# 设计参考与还原说明

## 来源与版本

- 原型：[PlainEssay Writing App · Figma Make](https://www.figma.com/make/qn6Dlo2r2frD52bPjC1hal/PlainEssay-Writing-App)
- 当前冻结：**Version 24（10:56 AM，“Remove document count”）**，文件修改时间为 `2026-11-09 02:58:02 UTC`（`10:58:02 Asia/Shanghai`）。
- 版本核对图：`reference-v24-version-history.png`（Version 24 历史面板）。
- 历史冻结：2026-10-27（v0.1.0）；2026-11-01 Version 11（v0.1.2）；2026-11-02 Version 12（v0.1.5）；同日 v0.1.6 补齐 Version 12 的导出弹窗与 `Plain` 命名。
- 冻结方式：Figma Make 不支持 Figma MCP（`create_session` 返回 “This tool is not supported for Make files. Supported file types: Design, Figjam, Slides, Figspec.”），因此从公开的 `figmacachedpreview` iframe 读取实时 DOM/CSS，保存为本地参考。

Version 24 附近的改动链（用于确认当前 UI 的来源）：

| 版本 | 时间 | 说明 |
| ---- | ---- | ---- |
| 24 | 10:56 AM | Remove document count |
| 23 | 10:54 AM | Simplify home header |
| 22 | 10:50 AM | Add app icon and document title |
| 21 | 10:47 AM | Reduce essays heading size |
| 20 | 10:44 AM | Refine undo redo icons |
| 19 | 10:43 AM | Refine essay row actions |
| 18 | 10:41 AM | Add essay list actions |
| 17 | 10:39 AM | Focus new essay editor |
| 16 | 10:35 AM | Remove title divider |
| 13 | 1:44 PM（Nov 2） | Rename app wordmark to Plain |

## 本目录文件

当前契约（Version 24）：

| 文件 | 用途 |
| ---- | ---- |
| `prototype-v24.css` | Version 24 完整样式（21,296 bytes） |
| `reference-v24-home.png` | 文档库 1440×900 参考 |
| `reference-v24-editor.png` | 编辑页 1440×900 参考 |
| `reference-v24-export-dialog.png` | Word 导出弹窗 1440×900 参考 |
| `reference-v24-mobile-home.png` | 文档库 390×844 参考 |
| `reference-v24-mobile-editor.png` | 编辑页 390×844 参考 |
| `reference-v24-version-history.png` | Version 24 历史面板（10:56 AM） |
| `screenshot-home.png` | 本实现空文档库 1440×900 |
| `screenshot-library.png` | 本实现有文档的文档库 1440×900 |
| `screenshot-library-hover.png` | 本实现文档行悬停操作 1440×900 |
| `screenshot-editor-empty.png` | 本实现空编辑页 1440×900 |
| `screenshot-editor-filled.png` | 本实现带格式正文的编辑页 1440×900 |
| `screenshot-export-dialog.png` | 本实现 Word 导出弹窗 1440×900 |
| `screenshot-mobile-home.png` | 本实现文档库 390×844 |
| `screenshot-mobile-editor.png` | 本实现编辑页 390×844 |

历史参考：`prototype.css`、`prototype-v11.css`、`reference-home.png`、`reference-editor.png`、`reference-v11-editor.png`、`reference-v12-*` 仅用于追溯旧版本，不再作为当前视觉契约。

`reference-*` 是原型视觉契约；`screenshot-*` 是当前实现的对照证据，后续 UI 改动可以替换它们。

## 设计 token

```css
--primary: #a8d7f5;
--primary-strong: #428fd0;
--secondary: #ddf1f6;
--secondary-soft: #c8ebdd;
--neutral-white: #fcfcfa;
--neutral-light: #f0f4f5;
--neutral-mid: #dde4e7;
--neutral-dark: #30383d;
--accent-soft: #e8f5d9;
```

- 界面字体：`-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif`
- 写作/格式按钮衬线：`"Iowan Old Style", "Baskerville", "Times New Roman", serif`
- 正文：`#353d42`，`1.08rem / 1.9`，字重 410，字距 `-0.008em`；移动端 `1.03rem / 1.82`
- 工具栏背景：`#fcfcfac7` + 24px backdrop blur；纸张 `#fcfcfaeb`，圆角 1.4rem
- 页面背景：顶部 38rem 半径的淡蓝径向渐变 + 左右淡灰线性渐变
- 基础行高：Make 由 Tailwind preflight 的 `line-height: 1.5` 提供；本实现在 `body` 显式声明，避免不同构建链导致弹窗高度偏差

## 关键尺寸（Version 24）

### 文档库

- 内容宽 `min(100% - 3rem, 58rem)`；1440px 视口下左右各 256px。
- 页面内边距：桌面 `90px 0 96px`，移动端 `64px 0 96px`。
- `.library-heading`：`display:flex`、`align-items:flex-end`、`justify-content:space-between`、`margin-bottom:2.6rem`。
- 眉题：`0.67rem`、字重 650、字距 `0.1em`、颜色 `--primary-strong`。
- `h1`：`clamp(2rem, 4vw, 3.15rem)`，字重 590，字距 `-0.06em`；1440px 下 50.4px，390px 下 32px。
- `New essay ＋`：高 36px，圆角 0.7rem，`0 0.9rem` 内边距，无 hover 过渡。
- 行：高 84.8px，`grid-template-columns:auto 1fr auto`，`gap:1.1rem`，`padding:1.15rem 1.25rem`；行间 `1px solid #dde4e794` 分隔。
- 文档图标：40×48px，圆角 0.55rem，白色底 + 淡灰描边，内部三条短横线。
- 标题 13.76px/600；字数 10.72px；时间 10.72px，右对齐。
- 行操作：绝对定位 `right:8rem`、`top:50%`、`transform:translateY(-44%)`；默认 `opacity:0;pointer-events:none`，行悬停或 `focus-within` 时显示并上移 6%；按钮 28×28px。
- 空状态：高 18rem，虚线描边，圆角 1.15rem。

### 编辑页

- 工具栏高 64px，左右 32px；左侧返回按钮 32×32px 圆形，文档标题 `0.82rem/610`，保存状态 `0.62rem`。
- 右侧字数 `0.71rem`，颜色 `#818b90`；`Export .md` 与 `Export .docx`；桌面显示两者，移动端只保留 `.docx`。
- 纸张：宽 `min(100%, 54rem)`（1440px 下 864px），圆角 1.4rem，内边距 `clamp(4.75rem, 8vh, 7rem) clamp(3.5rem, 8vw, 7.25rem) 8rem`；1440×900 下 `x=288, y=95.5, h=796.5`。
- 标题：`clamp(1.75rem, 2.3vw, 2.25rem)`（1440px 下 33.12px），字重 590，行高 1.18，`margin-bottom:2.4rem`；**标题下方无分隔线**。
- 正文：`1.08rem / 1.9`（1440px 下 17.28px / 32.832px），首行无额外缩进；`white-space: pre-wrap`。
- 格式工具条：桌面竖向 45.2×185.9px，`top:clamp(12rem,34vh,19rem)`、`left:max(1.25rem,50% - 31rem)`；1440×900 下 `x=224, y=304`；移动端横向 185.9×45.2px，底部 `1.25rem` 居中。
- 格式按钮 32×32px；顺序为 Undo、Redo、B、I、U；Undo/Redo 使用线性弧线图标，**始终可点，无禁用态**；B/I/U **无激活高亮**。
- 移动端纸张取消边框、阴影和圆角，内边距 `56px 25.6px 96px`；正文 16.48px / 29.9936px；页面宽 390px 时纸张 `h=780px`。

### Word 导出弹窗

- 宽 448px，圆角 1.15rem，内边距 24px；1440×900 下 `x=496, y=217.3, h=465.4`。
- 标题区 `MICROSOFT WORD` 眉题 + `Export document`；右上角关闭按钮。
- Typeface 固定为 `Times New Roman · 12 pt`，Line spacing 固定为 `Double-spaced`，两者禁用且只有一个选项。
- Paper size 可选 `US Letter · 8.5 × 11 in` / `A4 · 210 × 297 mm`。
- 摘要条：`1-inch margins · 0.5-inch first-line indent · black text`；底部 `Cancel` / `Export .docx`。

## 原型行为（已核对）

- 文档库：没有顶部导航、没有字标、没有文档总数；`New essay ＋` 立即创建标题为 `Untitled Essay` 的空文档并进入编辑页，光标落在正文开头；把标题清空后，工具栏仍回退为 `Untitled Essay`，纸张内标题留白；行按更新时间倒序；时间显示 `Today, 2:07 AM`；空库显示虚线卡片。
- 行操作：悬停行时在右侧时间之前出现铅笔与垃圾桶图标；铅笔打开文档，垃圾桶调用浏览器原生 `window.confirm`，文案为 `Delete “{title}”? This action cannot be undone.`。
- 编辑页：返回箭头 + 当前文档标题 + 保存状态；`Saving… → Saved`；字数；`Export .md` 与 `Export .docx`；浮动五按钮工具条；无字标、无标题分隔线。
- Version 11 起：`⌘F` 查找替换条（Find / Replace with / 上一个 / 下一个 / Replace / All / 计数）、选中时 `${n} selected`、粘贴/拖放图片、`.image-drop-active` 虚线投放区、空状态 `Start a new essay`。
- Version 12 起：应用名与字标为 `Plain`，应用图标为淡蓝圆角纸面 + 蓝色横线 + 右上角加号；导出弹窗的 Typeface 与 Line spacing 禁用、Paper size 可选。
- Version 23–24：移除首页导航与文档数，文档库直接以眉题 + `Essays` + `New essay` 开始；移除编辑页字标与标题分隔线；Undo/Redo 改为统一线性图标并去掉禁用态；B/I/U 去掉激活态。
- 移动端：隐藏时间、字数和 `Export .md`，只留 `Export .docx`；纸张取消边框/阴影/圆角。
- 原型字数：`A quiet place for ideas.` = 5；`First line with **style** and more.` = 6（按空白切分）。
- 原型 Markdown 导出缺陷：粗体正文会导出为 `**First line with **style** and more.**`；本实现不复刻。
- 原型 DOCX：标题居中，Times New Roman 12pt，双倍行距，段后 0，四边 1 英寸页边距，正文 0.5 英寸首行缩进；直引号导出为弯引号（`cv` 函数），粗体保留。

## 有意的偏差

| 项 | 原型 | 本实现 | 原因 |
| -- | ---- | ------ | ---- |
| 中文/日文计数 | 按空白切分，整段算 1 | CJK 按字符、拉丁按 token | 让中文用户看到有意义的字数 |
| Markdown 粗体 | 嵌套 `**` 破损 | Turndown 生成合法 Markdown | 导出必须能被其他工具正确解析 |
| 下划线导出 | 原型未验证 | Markdown 保留 `<u>`；DOCX 保留 `w:u` | 不丢失用户语义 |
| 图片上传 | 上传到原型远程服务，返回 URL | 本地 data URL，不上传 | 本地优先、无网络、无隐私外流 |
| Word 图片 | 原型未实现 | PNG/JPEG/GIF 嵌入；WebP 跳过 | 可用的 Word 导出 |
| 导出字体/行距 | UI 固定且禁用 | UI 同样固定且禁用；底层 docx 引擎仍保留 typeface/lineSpacing 参数供测试 | 视觉以 Make 为准，同时保留导出引擎的测试覆盖 |
| 应用名 | 页面标题 `PlainEssay`，无可见字标 | 应用名、窗口、菜单、安装包均为 `Plain` | 用户要求整个 app 叫 Plain |
| 标题栏 | Web 原型无 macOS 红绿灯，CSS 使用 `-webkit-app-region` | 原生透明标题栏；不使用 `-webkit-app-region` | v0.1.4 已确认后者会与 Tauri 原生拖动冲突 |
| 时间显示 | 用 UTC 渲染（上海 11:42 显示 `Today, 3:42 AM`） | 本地时区 | 原型是 Make 的显示 bug，不应复制 |

## 维护约定

1. 改 UI 前先对照 `reference-v24-*.png`；如果是有意偏离，更新上表。
2. 设计 token 以 `prototype-v24.css` 为准，`src/styles/app.css` 的 `:root` 必须与之一致。
3. 新增截图放到本目录，命名 `screenshot-<页面>-<状态>.png`，尺寸固定 1440×900 或 390×844。
4. 不把 Figma Make 的私有 token 或临时预览 URL 写进仓库。
5. 更新 Make 版本时，先记录 Version 号、时间和改动说明，再替换 `reference-v24-*` 与 `prototype-v24.css`。
