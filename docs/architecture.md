# PlainEssay 架构说明

## 1. 目标与约束

PlainEssay 是一个单窗口、本地优先的 macOS 写作应用：

- 一个安静的文档库和一个专注的编辑页；
- 数据只存在本机，无账号、无云同步、无遥测；
- 支持导出 `.md` 与 `.docx`；
- 首版以**未签名、未公证**的 `.app` / `.dmg` 形式个人分发；
- 当前在 Windows 上开发，通过 GitHub Actions 的 macOS runner 产出和验证 macOS 构建，最终由用户在真机验收；
- 保留迁移到 iOS / Android 的可能，不把业务逻辑绑死在 macOS 或桌面壳上。

原型来自 Figma Make，设计还原以冻结到 `docs/design/` 的 CSS、HTML 和参考截图为契约。Figma MCP 不支持 Make 文件（`create_session` 返回 “This tool is not supported for Make files”），因此没有把 Figma MCP 接入开发流程。

## 2. 分层与依赖方向

```text
┌──────────────────────────────────────────────┐
│ app/App.tsx          视图切换、命令总线接线   │
│ features/library     文档库                   │
│ features/editor      TipTap 编辑页             │
└───────────────┬──────────────────────────────┘
                │ 只依赖 domain 的接口
┌───────────────▼──────────────────────────────┐
│ domain/essay.ts       Essay、字数、时间、文件名 │
│ domain/repository.ts  EssayRepository 端口      │
└───────────────┬──────────────────────────────┘
                │
┌───────────────▼──────────────────────────────┐
│ infra/storage        SQLite / localStorage     │
│ infra/export         Markdown / DOCX            │
│ platform/tauri       运行环境判断、命令总线     │
│ platform/commands    原生菜单 → 前端命令        │
└───────────────┬──────────────────────────────┘
                │ Tauri IPC / 浏览器 API
┌───────────────▼──────────────────────────────┐
│ src-tauri            菜单、SQL、对话框、窗口   │
│                      save_export 命令          │
└──────────────────────────────────────────────┘
```

约束：

- `domain/` 不导入 React、Tauri、DOM 或 Node。
- `infra/` 通过 `domain/repository.ts` 的接口实现存储；视图只拿接口，不拿具体适配器。
- `platform/` 负责运行环境差异；业务组件不直接判断 `window.__TAURI_INTERNALS__`。
- Rust 壳不承载写作业务，只负责桌面能力：窗口、菜单、文件对话框后的落盘。

## 3. 数据模型

```sql
CREATE TABLE essays (
  id           TEXT PRIMARY KEY NOT NULL,
  title        TEXT NOT NULL DEFAULT '',
  content_html TEXT NOT NULL DEFAULT '',
  plain_text   TEXT NOT NULL DEFAULT '',
  word_count   INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL,  -- Unix ms
  updated_at   INTEGER NOT NULL   -- Unix ms
);
CREATE INDEX idx_essays_updated_at ON essays(updated_at DESC);
```

- 正文以 TipTap 产生的 HTML 保存，同时冗余 `plain_text` 与 `word_count`，让文档库列表不必解析 HTML。
- 标题为空时 UI 显示 `Untitled Essay`，但数据库保留空字符串，避免“标题是否被用户改过”的歧义。
- 列表只按 `updated_at DESC` 排序。
- 字数：拉丁文本按空白分隔的 token 计数，CJK 字符按字计数（例如“你好世界”为 4）。原型只按空格切分，中文会得到 1，这里是有意修正。
- 时间显示：今天 `Today, 2:07 AM`，昨天 `Yesterday, 2:07 PM`，更早 `Sep 2, 9:05 AM`，跨年补年份。实现为纯函数，依赖系统本地时区。

### 迁移策略

首版在 `Database.load('sqlite:plainessay.db')` 之后执行幂等的 `CREATE TABLE IF NOT EXISTS` 与 `CREATE INDEX IF NOT EXISTS`。后续字段变更应改为版本化迁移（`PRAGMA user_version` 或 `tauri-plugin-sql` 的 Rust migrations），不要在业务代码里散落 `ALTER TABLE`。

数据库位置由 `tauri-plugin-sql` 解析到 app config 目录，在 macOS 上是：

```text
~/Library/Application Support/com.phanstal.plainessay/plainessay.db
```

## 4. 存储适配器

```ts
interface EssayRepository {
  list(): Promise<EssaySummary[]>;
  get(id: string): Promise<Essay | null>;
  create(input?: { title?: string }): Promise<Essay>;
  save(essay: Essay): Promise<void>;
  remove(id: string): Promise<void>;
}
```

| 适配器             | 使用场景                                 | 数据位置                               |
| ------------------ | ---------------------------------------- | -------------------------------------- |
| `sqliteRepository` | Tauri 桌面窗口                           | app config 目录的 `plainessay.db`      |
| `localRepository`  | `npm run dev` 浏览器模式、Playwright E2E | `localStorage["plainessay.essays.v1"]` |

`createEssayRepository()` 在启动时检测 Tauri 环境并动态导入对应适配器，避免浏览器构建加载 SQL 插件。

未来移动端可以直接增加第三个适配器（例如 iOS 的 GRDB/SQLite 封装，或 Android 的 Room），只实现同一接口即可。

## 5. 编辑与自动保存

- 编辑器使用 TipTap 3（ProseMirror），只启用段落、Bold、Italic、Underline；关闭列表、标题、引用、代码块、链接等与 v1 定位不符的节点。
- 标题是受控 `<input>`；正文是 contenteditable。二者任一变化都会：
  1. 更新 `latestRef`（标题、HTML、纯文本、字数）；
  2. 置 `dirty`；
  3. UI 立即显示 `Saving…`；
  4. 重启 600 ms 防抖计时器。
- 防抖结束调用 `repository.save()`；成功后仅当期间没有新编辑才显示 `Saved`，失败则显示 `Save failed` 并把 dirty 保持为 true。
- 返回文档库、`⌘S`、卸载组件、`beforeunload` 都会尝试 flush。当前窗口关闭最多可能丢失最近 600 ms 的编辑；若未来需要严格保证，应在 Rust 的 `on_window_event(CloseRequested)` 中先阻止关闭、通知前端 flush、完成后再销毁窗口。
- 导出前也会先 flush，保证导出的内容与屏幕一致。

## 6. 导出

### Markdown

`infra/export/markdown.ts`：Turndown + 自定义 underline 规则。

- 标题输出 `# Title`；
- 正文中的 `<strong>` / `<em>` 输出 `**` / `*`；
- `<u>` 输出内联 `<u>`（CommonMark 没有下划线语法，丢标记会损失语义）；
- 原型里粗体导出会得到 `**First line with **style** and more.**` 的错误 Markdown；本实现通过 Turndown 的规则正确生成 `First line with **style** and more.`，不复制该缺陷。

### Word

`infra/export/docx.ts`：用 `docx` 库构造 OOXML。

- 标题段落居中，Times New Roman 12 pt（`w:sz=24`）；
- 正文左对齐，`w:line=480`（双倍行距），段后 0；
- 页边距四边 1440 twips（1 英寸）；
- 正文的 `<strong>` / `<em>` / `<u>` 分别映射为 `w:b` / `w:i` / `w:u`；`<br>` 映射为换行；
- 导出文件名由标题清洗非法字符后生成，空标题使用 `Untitled Essay`。

### 落盘

- 桌面：`@tauri-apps/plugin-dialog` 的 `save()` 得到用户选择的路径，把字节 base64 后交给 Rust 的 `save_export(path, data_base64)` 写文件。路径来自系统对话框，前端不能任意指定路径。
- 浏览器：Blob + `<a download>`，供 E2E 验证下载内容。

## 7. 原生壳（Tauri 2）

- 单窗口 1180×820，最小 720×560，`titleBarStyle: Overlay` + `hiddenTitle`。
- 插件：`dialog`、`sql`（sqlite feature）、`window-state`；窗口状态自动保存与恢复。
- 权限（`capabilities/default.json`）：`core:default`、`dialog:default`、`sql:default`、`sql:allow-execute`。注意 `sql:default` 只含读取、加载、关闭，不含写操作，必须显式加 `allow-execute`。
- macOS 菜单：`PlainEssay`、`File`、`Edit`、`Format`、`View`、`Window`。菜单项通过 `app.emit("plainessay://command", "...")` 发到前端；前端 `subscribeAppCommands` 统一处理 `new-essay` / `save` / `export-*` / `format-*` / `back`。
- 浏览器模式没有原生菜单，改为等价的键盘快捷键（`⌘/Ctrl+N`、`⌘/Ctrl+S`、`⌘/Ctrl+Shift+M`、`⌘/Ctrl+Shift+D`）；B/I/U 由 TipTap 自己的键盘映射处理。
- macOS 上给 header 增加 `5.25rem` 左内边距，避开红绿灯；header 设置 `data-tauri-drag-region` 以支持拖动窗口。
- CSP 只允许 self、Tauri IPC、本地 WebSocket（开发 HMR）；没有远程字体或外链脚本。

## 8. 平台移植（iOS / Android）

已具备的条件：

1. **业务逻辑可复用**：domain、存储接口、导出、时间/字数/文件名全部与平台无关。
2. **UI 响应式**：`max-width: 760px` 下隐藏时间、Markdown 按钮、字数，格式栏移到底部居中；已在 390×844 视口验证。
3. **Tauri 2 移动端路径**：Tauri 2 支持 iOS/Android。届时需要：
   - 为移动端选择 SQLite 实现（`tauri-plugin-sql` 的移动支持或原生桥）；
   - 替换桌面菜单命令为移动端手势/按钮；
   - 导出改用系统分享面板（`share` 插件）而不是保存对话框；
   - 增加安全区适配（当前已使用 `env(safe-area-inset-*)`）；
   - 用真机测试键盘、选择、滚动与自动保存行为。

尚未承诺的：iOS/Android 首版范围、App Store 审核策略、跨设备同步。当前架构不阻止这些，但也不假装已经完成。

## 9. 安全与隐私

- 无网络请求；渲染进程不能读任意文件。
- HTML 仅在本地 TipTap 编辑器内产生和渲染。粘贴内容由 ProseMirror schema 约束；v1 未开放原始 HTML 粘贴或链接，减少 XSS 面。
- 导出路径只能来自原生保存对话框；Rust 命令只负责写这一条路径。
- 数据库无加密；这是本地个人写作工具的取舍。若未来存敏感内容，可评估 SQLCipher。

## 10. 测试与 CI

| 层          | 工具           | 覆盖                                                                                           |
| ----------- | -------------- | ---------------------------------------------------------------------------------------------- |
| domain 单元 | Vitest         | 字数、时间格式、空标题、文件名清洗                                                             |
| 存储        | Vitest + jsdom | localStorage 适配器的增删改查与持久化                                                          |
| 导出        | Vitest         | Markdown 的粗体/斜体/下划线、原型 bug 回归；DOCX 的 OOXML 字体、行距、页边距、粗体/斜体/下划线 |
| UI E2E      | Playwright     | 新建、自动保存、刷新持久化、Markdown/Word 下载、空标题、删除、移动布局                         |
| Rust        | `cargo test`   | `save_export` 解码与写文件                                                                     |
| 构建        | CI             | Ubuntu 前端全链路 + macOS 原生构建/发布                                                        |

CI 没有 Mac 真机调试能力，原生窗口的最终视觉与交互需要按 `docs/acceptance.md` 在真机验收。

## 11. 关键决策记录

| 决策                                | 取舍                                                         |
| ----------------------------------- | ------------------------------------------------------------ |
| Tauri 2 而不是 SwiftUI              | 一套前端可延伸到移动端；牺牲原生控件与部分 macOS 细节        |
| TipTap 而不是 Slate/Lexical         | 与原型 contenteditable 行为接近，扩展成本低，文档成熟        |
| SQLite 而不是 JSON 文件             | 事务、排序、后续迁移更稳；代价是需要 Rust 插件               |
| 同时保留 localStorage 适配器        | 浏览器开发/E2E 无需启动原生壳；接口与 SQLite 一致            |
| 用 Turndown 而不是手写 HTML→MD      | 正确处理嵌套强调，避免原型里的 Markdown 破损                 |
| 用 `docx` 构造 OOXML 而不是模板替换 | 结构可控，测试可直接解压校验                                 |
| 首版不签名、不公证                  | 个人分发成本最低；用户需手动绕过 Gatekeeper，README 已写清楚 |
