# PlainEssay 验收清单（v0.1.0）

## 0. 构建信息

| 项目 | 值                                                                    |
| ---- | --------------------------------------------------------------------- |
| 版本 | v0.1.0                                                                |
| 平台 | macOS 12+，universal（arm64 + x86_64）                                |
| 产物 | `PlainEssay_0.1.0_universal.dmg`、`.zip`、`.sha256`、`SHA256SUMS.txt` |
| 签名 | ad-hoc（未使用 Apple Developer ID，未公证）                           |
| 仓库 | https://github.com/Phanstal/PlainEssay                                |

自动化状态（本地开发机，2026-10-27）：

- `npm run lint`：通过
- `npm run typecheck`：通过
- `npm test`：19 个单元测试通过
- `npm run build`：通过
- `npm run test:e2e`：4 个 Playwright 用例通过（Edge/Chromium，1440×900 与 390×844）
- `cargo test --manifest-path src-tauri/Cargo.toml`：1 个测试通过
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`：通过
- `npx tauri build --no-bundle`：Windows release 构建通过，并通过 WebView2 CDP 驱动真实 Tauri 窗口完成 SQLite 新建、自动保存、列表回读验证
- macOS 实机构建：由 GitHub Actions `macos-15` 完成，结果见 Actions 与 Release 页面

> 自动化的 Playwright 验证的是浏览器 localStorage 适配器；SQLite、原生菜单、窗口和 DMG 仍需按下面的真机步骤验收。

## 1. 下载与安装

- [ ] 从 Releases 下载 `PlainEssay_0.1.0_universal.dmg`、`.zip` 与 `SHA256SUMS.txt`。
- [ ] 校验：`shasum -a 256 -c PlainEssay_0.1.0_universal.dmg.sha256`，结果为 `OK`。
- [ ] 打开 DMG，把 `PlainEssay.app` 拖入 `/Applications`。
- [ ] 首次启动：右键 → 打开 → 打开；或在“系统设置 → 隐私与安全性”里选择“仍要打开”。
- [ ] 若提示“已损坏”，执行 `xattr -dr com.apple.quarantine /Applications/PlainEssay.app` 后重开。
- [ ] 确认应用图标、名称、窗口标题均为 PlainEssay；窗口默认约 1180×820，最小 720×560。

## 2. 文档库

- [ ] 首次打开显示空状态 “No essays yet”，文档数为 `0 documents`。
- [ ] 点击 `New essay ＋` 进入编辑页；返回后文档数变为 `1 document`。
- [ ] 行内显示文档图标、标题、字数、`Today, 2:07 AM` 形式的本地时间、右箭头。
- [ ] 超长标题以省略号截断，不撑破行布局。
- [ ] 空标题显示 `Untitled Essay`。
- [ ] 修改文档后返回，列表按最近编辑时间排序（最新在最上）。
- [ ] 右键行或悬停后的 `⋯` 打开删除菜单；确认后行消失；取消后行保留。
- [ ] 删除最后一个文档后回到空状态。
- [ ] 关闭并重新打开应用，列表与顺序保持。

## 3. 编辑页

- [ ] 左上角返回箭头、`plainessay` 字标、`Saved` 状态；右侧字数与两个导出按钮。
- [ ] 页面为一张居中纸张卡片；标题字号约 2.25rem，标题下方有一条蓝色短横线。
- [ ] 桌面端 B / I / U 浮动工具条位于纸张左侧；点击后光标不丢失，选中文字应用对应样式，按钮呈激活态。
- [ ] 输入时状态先显示 `Saving…`，约 600 ms 后变为 `Saved`。
- [ ] 输入后立即返回文档库，再打开，内容完整（返回会 flush）。
- [ ] 输入后立即 `⌘Q` 强退，重开确认最多丢失最近约 600 ms 的输入（已知边界，见架构文档）。
- [ ] `⌘S` 可主动保存；`⌘B` / `⌘I` / `⌘U` 可切换格式。
- [ ] 字数随输入更新；英文按词、数字和连字符词按一个 token；中文/日文按字符计数。
- [ ] 空正文不会产生多余空段落或占位符。
- [ ] 多段输入后段落间距约 0.9em，行高约 1.9，字体为系统无衬线。

## 4. 导出

### Markdown

- [ ] 点击 `Export .md` 弹出系统保存对话框，默认文件名为标题清洗后的 `.md`。
- [ ] 取消对话框不会报错、不会产生文件。
- [ ] 保存后用文本编辑器打开，首行为 `# 标题`，正文与编辑器一致。
- [ ] 粗体输出 `**text**`，斜体输出 `*text*`，下划线输出 `<u>text</u>`。
- [ ] 嵌套强调的 Markdown 合法，不出现原型中的 `**First line with **style** and more.**`。

### Word

- [ ] 点击 `Export .docx` 弹出保存对话框；保存后 Word / Pages 能正常打开。
- [ ] 标题居中，正文左对齐；字体 Times New Roman 12 pt。
- [ ] 行距为双倍（`w:line=480`），段后 0。
- [ ] 页边距四边 1 英寸。
- [ ] 粗体、斜体、下划线保留；多段结构与编辑器一致。
- [ ] 空标题导出文件名为 `Untitled Essay.docx`，文档内标题同样为 `Untitled Essay`。

## 5. 原生菜单与窗口

- [ ] macOS 菜单栏包含 `PlainEssay`、`File`、`Edit`、`Format`、`View`、`Window`。
- [ ] `File → New Essay`（`⌘N`）在任意页面新建并进入编辑页。
- [ ] `File → Save`（`⌘S`）保存当前文档。
- [ ] `File → Export Markdown…`（`⌘⇧M`）与 `Export Word Document…`（`⌘⇧D`）在编辑页可用。
- [ ] `Format → Bold / Italic / Underline` 对当前选区生效。
- [ ] `Edit` 菜单的撤销、重做、剪切、复制、粘贴、全选可用。
- [ ] `View → Toggle Full Screen` 可用；全屏下顶部安全区不遮挡工具条。
- [ ] 窗口拖动、最小化、关闭正常；重新打开后窗口尺寸与位置恢复。
- [ ] 红绿灯不遮挡返回按钮或字标（overlay titlebar 左内边距 5.25rem）。
- [ ] 顶部工具栏空白处可拖动窗口。

## 6. 移动布局（为 iOS/Android 预留）

- [ ] 把窗口缩到 760px 以下，或使用浏览器 390×844 视口。
- [ ] 文档库隐藏时间与箭头，`⋯` 始终可见；工具条收窄。
- [ ] 编辑页隐藏字数与 `Export .md`，只保留 `Export .docx`。
- [ ] 纸张取消圆角、边框和阴影，正文边距收窄。
- [ ] 格式工具条固定到底部居中，不被安全区遮挡。
- [ ] 输入、选择、滚动正常，光标不跳到屏幕外。

## 7. 隐私与稳定性

- [ ] 断网后应用功能不受影响；导出不依赖网络。
- [ ] 用 Little Snitch / Activity Monitor 观察，没有出站连接。
- [ ] 数据库位于 `~/Library/Application Support/com.phanstal.plainessay/plainessay.db`。
- [ ] 关闭应用后复制该文件，删除应用数据目录，重开应为空库；恢复文件后文档回来。
- [ ] 连续输入 10 分钟、频繁切换文档无崩溃、无明显卡顿。
- [ ] 大量文档（至少 100 篇）时文档库滚动与打开仍流畅。

## 8. 已知限制（v0.1.0 接受）

- 无 Apple 签名/公证，首次启动需要手动放行；每次新版本可能重复。
- 无自动更新。
- 无云同步、无账号、无多设备。
- 仅支持段落 + 粗体/斜体/下划线；不支持标题层级、列表、链接、图片。
- 删除不可撤销。
- 窗口关闭时最多丢失最后约 600 ms 的输入（返回/`⌘S` 会 flush）。
- 无数据库加密。
- 只有英文界面；时间格式为 en-US。

## 9. 验收结论

- [ ] 自动化检查全部通过（GitHub Actions CI 绿色）
- [ ] macOS Release 工作流产出了 DMG、ZIP 与 checksum
- [ ] 真机安装、编辑、导出、删除、菜单、窗口恢复全部通过
- [ ] 验收人：__________ 日期：__________
- [ ] 备注：
