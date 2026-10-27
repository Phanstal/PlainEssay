# 设计参考与还原说明

## 来源

- 原型：[PlainEssay Writing App · Figma Make](https://www.figma.com/make/qn6Dlo2r2frD52bPjC1hal/PlainEssay-Writing-App?t=sN12j4c4nWGpmHpK-1)
- 冻结时间：2026-10-27
- 冻结方式：Figma Make 不支持 Figma MCP（`create_session` 返回 “This tool is not supported for Make files. Supported file types: Design, Figjam, Slides, Figspec.”），因此从公开的 `figmacachedpreview` iframe 读取实时 DOM/CSS，保存为本地参考。

## 本目录文件

| 文件                           | 用途                                                          |
| ------------------------------ | ------------------------------------------------------------- |
| `prototype.css`                | 原型完整样式（17,184 bytes），含设计 token、桌面与 760px 断点 |
| `reference-home.png`           | 原型文档库 1440×900 参考截图                                  |
| `reference-editor.png`         | 原型编辑页 1440×900 参考截图                                  |
| `reference-mobile-home.png`    | 原型文档库 390×844 参考截图                                   |
| `reference-mobile-editor.png`  | 原型编辑页 390×844 参考截图                                   |
| `screenshot-home.png`          | 本实现文档库 1440×900                                         |
| `screenshot-library.png`       | 本实现有文档时的文档库 1440×900                               |
| `screenshot-editor-empty.png`  | 本实现空编辑页 1440×900                                       |
| `screenshot-editor-filled.png` | 本实现带格式正文的编辑页 1440×900                             |
| `screenshot-mobile-home.png`   | 本实现文档库 390×844                                          |
| `screenshot-mobile-editor.png` | 本实现编辑页 390×844                                          |

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
- 编辑页：返回箭头 + 字标 + 保存状态；`Saving… → Saved`；字数；`Export .md` 与 `Export .docx`；浮动 B/I/U；桌面工具条在纸张左侧，移动端底部居中。
- 移动端：隐藏时间和 `Export .md`，只留 `Export .docx`；纸张取消边框/阴影/圆角。
- 原型字数：`A quiet place for ideas.` = 5；`First line with **style** and more.` = 6（按空白切分）。
- 原型 Markdown 导出缺陷：粗体正文会导出为 `**First line with **style** and more.**`；本实现不复刻。
- 原型 DOCX：标题居中，Times New Roman 12pt，双倍行距，段后 0，四边 1 英寸页边距，粗体保留。

## 有意的偏差

| 项            | 原型                    | 本实现                                       | 原因                         |
| ------------- | ----------------------- | -------------------------------------------- | ---------------------------- |
| 删除入口      | 无                      | 右键行 + 悬停 `⋯` + 确认对话框               | 原型只是演示，v1 需要可删除  |
| 中文/日文计数 | 按空白切分，整段算 1    | CJK 按字符、拉丁按 token                     | 让中文用户看到有意义的字数   |
| Markdown 粗体 | 嵌套 `**` 破损          | Turndown 生成合法 Markdown                   | 导出必须能被其他工具正确解析 |
| 下划线导出    | 原型未验证              | Markdown 保留 `<u>`；DOCX 保留 `w:u`         | 不丢失用户语义               |
| 空库文案      | 原型未展示空状态        | “No essays yet / Start with a quiet page.”   | 完整状态设计                 |
| 标题栏        | Web 原型无 macOS 红绿灯 | overlay titlebar + 5.25rem 左内边距 + 可拖动 | 原生 macOS 体验              |
| `⋯` 按钮      | 无                      | 悬停显现，触屏常显                           | 删除操作的可发现性           |
| 字数/标题占位 | 原型有的输入状态未覆盖  | 标题 placeholder 为 `Untitled Essay`         | 与文档库 fallback 一致       |

## 维护约定

1. 改 UI 前先对照 `reference-*.png`；如果是有意偏离，更新上表。
2. 设计 token 以 `prototype.css` 为准，`src/styles/app.css` 的 `:root` 必须与之一致。
3. 新增截图放到本目录，命名 `screenshot-<页面>-<状态>.png`，尺寸固定 1440×900 或 390×844。
4. 不把 Figma Make 的私有 token 或临时预览 URL 写进仓库。
