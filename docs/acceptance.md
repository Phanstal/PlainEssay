# Plain 验收清单（v0.1.6）

> **历史清单。** 本清单对应 v0.1.6（Make Version 12）。当前源码已按 Make Version 24（2026-11-09 10:56 AM）调整：文档库移除顶部导航、字标和文档数，编辑页移除字标与标题分隔线，行操作与导出弹窗改为最新交互。当前 UI 契约见 [`docs/design/README.md`](design/README.md)；待下一次发版时再据此重生成验收清单。

## 0. 构建信息

| 项目 | 值                                                               |
| ---- | ---------------------------------------------------------------- |
| 版本 | v0.1.6                                                           |
| 平台 | macOS 12+，universal（arm64 + x86_64）                           |
| 产物 | `Plain_0.1.6_universal.dmg`、`.zip`、`.sha256`、`SHA256SUMS.txt` |
| 签名 | ad-hoc（未使用 Apple Developer ID，未公证）                      |
| 仓库 | https://github.com/Phanstal/PlainEssay                           |

自动化状态（本地开发机，2026-11-02）：

- `npm run lint`：通过
- `npm run typecheck`：通过
- `npm test`：32 个单元测试通过（含导出字体/行距/纸张、首行缩进、引号清洗）
- `npm run build`：通过
- `npm run test:e2e`：8 个 Playwright 用例通过（1440×900 与 390×844；覆盖 `Plain` 字标、导出设置、引号清洗、查找替换、撤销、选中字数、图片粘贴持久化）
- `cargo test --manifest-path src-tauri/Cargo.toml`：1 个测试通过
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`：通过
- `npx tauri build --no-bundle`：Windows release 构建通过；SQLite 原生窗口行为沿用 v0.1.0 的 WebView2 CDP 验证步骤
- v0.1.5（CI run `41401452809`、macOS run `41401477679`）已验证图标与 `Plain` 字标；v0.1.6 在此基础上增加导出设置、首行缩进、引号清洗与全应用改名
- v0.1.6 CI（run `41416517250`）：前端 lint / typecheck / 32 个单测 / build / 8 个 E2E，Rust fmt / clippy / test 全部通过
- v0.1.6 macOS 构建（run `41416546112`）：universal `.app` 编译、ad-hoc 签名、DMG/ZIP/checksum 打包与 GitHub Release 发布全部通过
- 产物复核：DMG SHA-256 `d5f6933b…`、ZIP SHA-256 `46266bd5…`，与 `SHA256SUMS.txt` 一致；安装包内为 `Plain.app`，`CFBundleName`/`CFBundleDisplayName=Plain`，可执行文件 `plainessay`（内部名），`CFBundleShortVersionString=0.1.6`，identifier 仍为 `com.phanstal.plainessay`；Mach-O fat binary 含 `x86_64`（`0x01000007`）与 `arm64`（`0x0100000C`）；`icon.icns` 与仓库 `src-tauri/icons/icon.icns` 的 SHA-256 一致
- v0.1.6 图标与 v0.1.5 相同：`assets/plain-icon-1024.png`（由 `assets/plain-icon-source.webp` 转码）生成 macOS / Windows / Linux / iOS / Android 全套图标

> 自动化的 Playwright 验证的是浏览器 localStorage 适配器；SQLite、原生菜单、窗口和 DMG 仍需按下面的真机步骤验收。

## 1. 下载与安装

- [ ] 从 Releases 下载 `Plain_0.1.6_universal.dmg`、`.zip` 与 `SHA256SUMS.txt`。
- [ ] 校验：`shasum -a 256 -c Plain_0.1.6_universal.dmg.sha256`，结果为 `OK`；DMG SHA-256 为 `d5f6933b…`，ZIP 为 `46266bd5…`。
- [ ] 打开 DMG，把 `Plain.app` 拖入 `/Applications`。
- [ ] 首次启动：右键 → 打开 → 打开；或在“系统设置 → 隐私与安全性”里选择“仍要打开”。
- [ ] 若提示“已损坏”，执行 `xattr -dr com.apple.quarantine /Applications/Plain.app` 后重开。
- [ ] 确认应用名称为 Plain；Dock、Finder、DMG 卷标与安装包名也均为 `Plain`；窗口默认约 1180×820，最小 720×560。
- [ ] Dock、Finder 与 DMG 中显示新图标：淡蓝圆角纸面、三条蓝色横线、右上角蓝色加号，不再是旧版图标。
- [ ] 文档库与编辑页左上角字标均为 `Plain`，字号、字重与原 `plainessay` 一致，不挤压返回按钮或操作区。

## 2. 文档库

- [ ] 首次打开显示空状态 `Start a new essay` / `A quiet page is ready when you are.`，文档数为 `0 documents`。
- [ ] 点击 `New essay ＋` 或空状态卡片进入编辑页；返回后文档数变为 `1 document`。
- [ ] 行内显示文档图标、标题、字数、`Today, 2:07 AM` 形式的本地时间、右箭头。
- [ ] 超长标题以省略号截断，不撑破行布局。
- [ ] 空标题显示 `Untitled Essay`。
- [ ] 修改文档后返回，列表按最近编辑时间排序（最新在最上）。
- [ ] 右键行或悬停后的 `⋯` 打开删除菜单；确认后行消失；取消后行保留。
- [ ] 删除最后一个文档后回到空状态。
- [ ] 关闭并重新打开应用，列表与顺序保持。

## 3. 编辑页

- [ ] 左上角返回箭头、`Plain` 字标、`Saved` 状态；右侧字数与两个导出按钮。
- [ ] 页面为一张居中纸张卡片；标题字号约 2.25rem，标题下方有一条蓝色短横线。
- [ ] 桌面端浮动工具条依次为 Undo、Redo、B、I、U，位于纸张左侧；点击格式按钮后光标不丢失，选中文字应用对应样式，按钮呈激活态。
- [ ] 没有可撤销/可重做历史时，Undo / Redo 按钮置灰；编辑后 `⌘Z` / `⇧⌘Z` 与按钮行为一致。
- [ ] 选中文字时右上角字数变为 `${n} selected`；取消选区后恢复 `${wordCount} words`。
- [ ] `⌘F` 或 `Edit → Find…` 打开查找条；输入 `alpha` 后显示 `1 of N`，Enter / Shift+Enter 在匹配项间循环并选中文字。
- [ ] 替换：单次 Replace 只替换当前项；Replace all 替换全部匹配项；关闭按钮 / Esc 关闭查找条。
- [ ] 输入时状态先显示 `Saving…`，约 600 ms 后变为 `Saved`。
- [ ] 输入后立即返回文档库，再打开，内容完整（返回会 flush）。
- [ ] 输入后立即 `⌘Q` 强退，重开确认最多丢失最近约 600 ms 的输入（已知边界，见架构文档）。
- [ ] `⌘S` 可主动保存；`⌘B` / `⌘I` / `⌘U` 可切换格式。
- [ ] 字数随输入更新；英文按词、数字和连字符词按一个 token；中文/日文按字符计数。
- [ ] 空正文不会产生多余空段落或占位符。
- [ ] 多段输入后段落间距约 0.9em，行高约 1.9，字体为系统无衬线。

## 4. 图片

- [ ] 从 Finder 复制 PNG/JPEG/GIF/WebP 图片，在正文中 `⌘V` 粘贴，图片插入光标处，圆角、最大宽度不超过纸张。
- [ ] 从 Finder 拖动图片到正文，拖动经过时纸张出现虚线高亮；松手后图片插入。
- [ ] 插入后状态变为 `Saving…` → `Saved`；返回列表再打开、刷新或重启应用后图片仍在。
- [ ] 选择大于 12 MB 的图片或 SVG，出现错误提示且不插入。
- [ ] 断网时粘贴图片仍然成功；应用不应发出任何上传请求。
- [ ] 图片在导出 Markdown 中为 `![alt](data:image/...)`，在 Word 中作为嵌入图片出现。
- [ ] 图片与文字之间没有多余空段落；删除图片后正文其余内容保持完整。

## 5. 导出

### Markdown

- [ ] 点击 `Export .md` 弹出系统保存对话框，默认文件名为标题清洗后的 `.md`。
- [ ] 取消对话框不会报错、不会产生文件。
- [ ] 保存后用文本编辑器打开，首行为 `# 标题`，正文与编辑器一致。
- [ ] 粗体输出 `**text**`，斜体输出 `*text*`，下划线输出 `<u>text</u>`。
- [ ] 正文与标题中的直引号、撇号输出为弯引号，不出现 `&quot;` 或反斜杠转义。
- [ ] 嵌套强调的 Markdown 合法，不出现原型中的 `**First line with **style** and more.**`。
- [ ] 图片输出为 Markdown 图片语法，data URL 与编辑器中的图片一致。

### Word

- [ ] 点击 `Export .docx` 先打开 `Export document` 设置弹窗，而不是直接弹出保存对话框；`Cancel`、`×`、Esc、点击遮罩都能关闭且不产生文件。
- [ ] 弹窗包含 `Typeface`、`Line spacing`、`Paper size` 三项；默认值分别为 `Times New Roman · 12 pt`、`Double-spaced`、`US Letter · 8.5 × 11 in`。
- [ ] 字体可选 `Times New Roman · 12 pt` 与 `Arial · 12 pt`；行距可选 `Double-spaced` 与 `Single-spaced`；纸张可选 US Letter 与 A4。
- [ ] 摘要始终显示 `1-inch margins · 0.5-inch first-line indent · black text`；窄屏下弹窗不溢出。
- [ ] 保存后 Word / Pages 能正常打开；标题居中，正文左对齐，段后 0。
- [ ] 默认：Times New Roman 12 pt、双倍行距（`w:line=480`）、US Letter（`w:pgSz w:w=12240 w:h=15840`）、四边 1 英寸页边距。
- [ ] 切换到 Arial / Single-spaced / A4 后导出，字体为 Arial、行距为 `w:line=240`、纸张为 `w:w=11907 w:h=16839`。
- [ ] 每个正文段落首行缩进 0.5 英寸（`w:firstLine=720`），标题不缩进，图片段落不缩进。
- [ ] 正文中的直双引号、直单引号与撇号导出为弯引号：`"it's"` → `“it’s”`，`'single'` → `‘single’`；Markdown 导出一致。
- [ ] 粗体、斜体、下划线保留；多段结构与编辑器一致。
- [ ] 图片作为内嵌媒体出现，宽度不超过页面正文宽度，比例不变。
- [ ] 空标题导出文件名为 `Untitled Essay.docx`，文档内标题同样为 `Untitled Essay`。

## 6. 原生菜单与窗口

- [ ] macOS 菜单栏包含 `Plain`、`File`、`Edit`、`Format`、`View`、`Window`。
- [ ] `File → New Essay`（`⌘N`）在任意页面新建并进入编辑页。
- [ ] `File → Save`（`⌘S`）保存当前文档。
- [ ] `File → Export Markdown…`（`⌘⇧M`）与 `Export Word Document…`（`⌘⇧D`）在编辑页可用。
- [ ] `Format → Bold / Italic / Underline` 对当前选区生效。
- [ ] `Edit` 菜单的撤销、重做、剪切、复制、粘贴、全选可用；`Edit → Find…`（`⌘F`）打开查找条。
- [ ] `View → Toggle Full Screen` 可用；全屏下顶部安全区不遮挡工具条。
- [ ] 窗口置前时，按住顶部原生标题栏拖动，窗口立即移动；不需要先点击一次激活。
- [ ] 窗口未置前时，第一次点击原生标题栏即可激活并拖动，行为与普通 macOS 窗口一致。
- [ ] 文档库和编辑页的页面 header 都位于原生标题栏下方，红绿灯不遮挡字标、返回按钮或导出按钮。
- [ ] 页面内按钮、输入框、查找条和正文编辑区不触发窗口拖动，点击/输入正常。
- [ ] 双击原生标题栏可最大化/还原窗口。
- [ ] 窗口最小化、关闭正常；重新打开后窗口尺寸与位置恢复。

## 7. 移动布局（为 iOS/Android 预留）

- [ ] 把窗口缩到 760px 以下，或使用浏览器 390×844 视口。
- [ ] 文档库隐藏时间与箭头，`⋯` 始终可见；工具条收窄。
- [ ] 编辑页隐藏字数与 `Export .md`，只保留 `Export .docx`。
- [ ] 390×844 下点 `Export .docx`，设置弹窗宽度不超出屏幕，三个下拉框、摘要、`Cancel` 与 `Export .docx` 均可操作。
- [ ] 纸张取消圆角、边框和阴影，正文边距收窄。
- [ ] 格式工具条固定到底部居中，不被安全区遮挡；横向容纳 5 个按钮。
- [ ] 查找条在窄屏下左右铺开，输入框与按钮可用。
- [ ] 输入、选择、滚动正常，光标不跳到屏幕外。

## 8. 隐私与稳定性

- [ ] 断网后应用功能不受影响；导出不依赖网络。
- [ ] 用 Little Snitch / Activity Monitor 观察，没有出站连接；粘贴图片也不会触发上传。
- [ ] 数据库位于 `~/Library/Application Support/com.phanstal.plainessay/plainessay.db`。
- [ ] 关闭应用后复制该文件，删除应用数据目录，重开应为空库；恢复文件后文档回来。
- [ ] 连续输入 10 分钟、频繁切换文档、插入多张图片无崩溃、无明显卡顿。
- [ ] 大量文档（至少 100 篇）时文档库滚动与打开仍流畅。

## 9. 已知限制（v0.1.6 接受）

- 无 Apple 签名/公证，首次启动需要手动放行；每次新版本可能重复。
- 无自动更新。
- 无云同步、无账号、无多设备。
- 仅支持段落 + 粗体/斜体/下划线 + 本地图片；不支持标题层级、列表、链接、图片缩放/裁切、alt 文本编辑。
- Word 导出字体只提供 Times New Roman 与 Arial（均 12 pt），行距只提供双倍与单倍；纸张只提供 US Letter 与 A4，不提供自定义页边距。
- 图片以 base64 存入 SQLite，大图或多图会显著增大数据库和自动保存负担；单图上限 12 MB。
- Word 导出可嵌入 PNG/JPEG/GIF；WebP 可在编辑器与 Markdown 中显示，但 Word 导出会跳过该图。
- 查找替换按单个文本节点匹配，跨粗体/斜体等格式边界的短语不会被当作一个匹配。
- 删除不可撤销。
- 窗口关闭时最多丢失最后约 600 ms 的输入（返回/`⌘S` 会 flush）。
- 无数据库加密。
- 只有英文界面；时间格式为 en-US。
- macOS 使用原生透明标题栏而非 Overlay，顶部比 v0.1.2 多一条原生标题栏；这是规避 Tauri #15623 的取舍。

## 10. 验收结论

- [ ] 自动化检查全部通过（GitHub Actions CI 绿色）
- [ ] macOS Release 工作流产出了 DMG、ZIP 与 checksum
- [ ] 真机安装、编辑、图片、查找替换、导出、删除、菜单、窗口恢复全部通过
- [ ] 验收人：__________ 日期：__________
- [ ] 备注：
