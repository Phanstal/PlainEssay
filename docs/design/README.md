# 设计参考与还原说明

## 来源

- 原型：[PlainEssay Writing App · Figma Make](https://www.figma.com/make/qn6Dlo2r2frD52bPjC1hal/PlainEssay-Writing-App?t=CGcbGlKxkbVO4H39-1)
- 冻结时间：2026-10-27（v0.1.0）；2026-11-01 更新到 Version 11（v0.1.2）；2026-11-02 更新到 Version 12（v0.1.5）；同日 v0.1.6 补齐 Version 12 的导出设置弹窗与 `Plain` 命名
- 冻结方式：Figma Make 不支持 Figma MCP（`create_session` 返回 “This tool is not supported for Make files. Supported file types: Design, Figjam, Slides, Figspec.”），因此从公开的 `figmacachedpreview` iframe 读取实时 DOM/CSS，保存为本地参考。

## 本目录文件

| 文件                              | 用途                                                                 |
| --------------------------------- | -------------------------------------------------------------------- |
| `prototype.css`                   | 原型完整样式（17,184 bytes），含设计 token、桌面与 760px 断点        |
| `prototype-v11.css`               | Version 11 完整样式（格式化后 23,341 bytes），含查找条、图片与拖动区 |
| `reference-home.png`              | 原型文档库 1440×900 参考截图                                         |
| `reference-editor.png`            | 原型编辑页 1440×900 参考截图                                         |
| `reference-v11-editor.png`        | Version 11 编辑页参考（818×532，含五按钮工具条）                     |
| `reference-v12-home.png`          | Version 12 文档库参考（1440×900，左上角 `Plain`）                    |
| `reference-v12-editor.png`        | Version 12 编辑页参考（1440×900，左上角 `Plain`）                    |
| `reference-v12-export-dialog.png` | Version 12 Word 导出设置弹窗参考（1440×900）                         |
| `reference-mobile-home.png`       | 原型文档库 390×844 参考截图                                          |
| `reference-mobile-editor.png`     | 原型编辑页 390×844 参考截图                                          |
| `screenshot-home.png`             | 本实现文档库 1440×900                                                |
| `screenshot-library.png`          | 本实现有文档时的文档库 1440×900                                      |
| `screenshot-editor-empty.png`     | 本实现空编辑页 1440×900                                              |
| `screenshot-editor-filled.png`    | 本实现带格式正文的编辑页 1440×900                                    |
| `screenshot-mobile-home.png`      | 本实现文档库 390×844                                                 |
| `screenshot-mobile-editor.png`    | 本实现编辑页 390×844                                                 |
| `screenshot-export-dialog.png`    | 本实现 Word 导出设置弹窗 1440×900                                    |

`reference-*` 是原型的视觉契约；`screenshot-*` 是当前实现的对照证据，后续 UI 改动可以替换它们。

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
- 正文：`#353d42`，1.08rem / 1.9，字重 410，字距 -0.008em；移动端 1.03rem / 1.82
- 工具栏背景：`#fcfcfac7` + 24px backdrop blur；纸张 `#fcfcfaeb`，圆角 1.4rem
- 页面背景：顶部 38rem 半径的淡蓝径向渐变 + 左右淡灰线性渐变

## 关键尺寸

- 文档库内容宽 `min(100% - 3rem, 58rem)`，移动端 `min(100% - 2rem, 58rem)`
- 标题字号 `clamp(2.4rem, 5vw, 4rem)`，字距 -0.06em，字重 590
- 文档行：图标 2.5×3rem，行内边距 1.15rem 1.25rem，gap 1.1rem
- 编辑纸张：`min(100%, 54rem)`，内边距 `clamp(4.75rem, 8vh, 7rem) clamp(3.5rem, 8vw, 7.25rem) 8rem`
- 格式工具条桌面：`top: clamp(12rem, 34vh, 19rem); left: max(1.25rem, 50% - 31rem)`；移动端底部居中
- 断点：760px

## 原型行为（已核对）

- 文档库：`New essay ＋` 立即创建空文档并进入编辑页；空标题显示 `Untitled Essay`；行按更新时间倒序；时间显示 `Today, 2:07 AM`；空库显示虚线卡片。
- 编辑页：返回箭头 + 字标 + 保存状态；`Saving… → Saved`；字数；`Export .md` 与 `Export .docx`；浮动 Undo/Redo/B/I/U（五按钮）；桌面工具条在纸张左侧，移动端底部居中。
- Version 11 新增：`⌘F` 查找替换条（Find / Replace with / 上一个 / 下一个 / Replace / All / 计数）、选中时 `${n} selected`、粘贴/拖放图片、`.image-drop-active` 虚线投放区、空状态 `Start a new essay`。
- Version 12：左上角字标由 `plainessay` 改为 `Plain`，文档库与编辑页一致；应用图标改为淡蓝圆角纸面 + 蓝色横线 + 右上角加号；应用名改为 `Plain`。
- Version 12 的 `Export .docx` 会先打开 `Export document` 弹窗：`Typeface`、`Line spacing`、`Paper size`，摘要 `1-inch margins · 0.5-inch first-line indent · black text`，底部 `Cancel` / `Export .docx`。原型里 Typeface 与 Line spacing 是禁用状态且各只有一个选项，Paper size 可选 US Letter / A4。
- 移动端：隐藏时间和 `Export .md`，只留 `Export .docx`；纸张取消边框/阴影/圆角。
- 原型字数：`A quiet place for ideas.` = 5；`First line with **style** and more.` = 6（按空白切分）。
- 原型 Markdown 导出缺陷：粗体正文会导出为 `**First line with **style** and more.**`；本实现不复刻。
- 原型 DOCX：标题居中，Times New Roman 12pt，双倍行距，段后 0，四边 1 英寸页边距，正文 0.5 英寸首行缩进；直引号导出为弯引号（`cv` 函数），粗体保留。

## 有意的偏差

| 项            | 原型                                                        | 本实现                                      | 原因                         |
| ------------- | ----------------------------------------------------------- | ------------------------------------------- | ---------------------------- |
| 删除入口      | 无                                                          | 右键行 + 悬停 `⋯` + 确认对话框              | 原型只是演示，v1 需要可删除  |
| 中文/日文计数 | 按空白切分，整段算 1                                        | CJK 按字符、拉丁按 token                    | 让中文用户看到有意义的字数   |
| Markdown 粗体 | 嵌套 `**` 破损                                              | Turndown 生成合法 Markdown                  | 导出必须能被其他工具正确解析 |
| 下划线导出    | 原型未验证                                                  | Markdown 保留 `<u>`；DOCX 保留 `w:u`        | 不丢失用户语义               |
| 空库文案      | `Start a new essay` / `A quiet page is ready when you are.` | 与原型一致                                  | 跟随 Version 11              |
| 图片上传      | 上传到原型远程服务，返回 URL                                | 本地 data URL，不上传                       | 本地优先、无网络、无隐私外流 |
| Word 图片     | 原型未实现                                                  | PNG/JPEG/GIF 嵌入；WebP 跳过                | 可用的 Word 导出             |
| 导出字体/行距 | Typeface、Line spacing 在原型中禁用且只有一种               | 可选 Times/Arial、Double/Single             | 用户要求可选项，不只是展示   |
| 应用名        | 原型页面标题 `PlainEssay`，左上角 `Plain`                   | 应用名、窗口、菜单、安装包均为 `Plain`      | 用户要求整个 app 叫 Plain    |
| 标题栏        | Web 原型无 macOS 红绿灯                                     | 原生透明标题栏 + 原生拖动，内容在标题栏下方 | 修复 Tauri #15623 激活拖不动 |
| `⋯` 按钮      | 无                                                          | 悬停显现，触屏常显                          | 删除操作的可发现性           |
| 字数/标题占位 | 原型有的输入状态未覆盖                                      | 标题 placeholder 为 `Untitled Essay`        | 与文档库 fallback 一致       |

## 维护约定

1. 改 UI 前先对照 `reference-*.png`；如果是有意偏离，更新上表。
2. 设计 token 以 `prototype.css` 为准，`src/styles/app.css` 的 `:root` 必须与之一致。
3. 新增截图放到本目录，命名 `screenshot-<页面>-<状态>.png`，尺寸固定 1440×900 或 390×844。
4. 不把 Figma Make 的私有 token 或临时预览 URL 写进仓库。
