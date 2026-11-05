# 商店上架材料（Chrome Web Store / Microsoft Edge Add-ons）

> 填写到各开发者控制台前请通读本文。Chrome 与 Edge 各自独立提交、独立审核。
> 隐私政策全文见 `extension/PRIVACY.md`（上架时需将其托管到可公开访问的 URL，如 GitHub 仓库页面或 GitHub Pages，并把链接填入控制台"隐私政策网址"字段）。

---

## 1. 基本信息

| 字段 | Chrome 网上应用店 | Edge 加载项 |
|---|---|---|
| 名称 | Rdown 下载接管 | Rdown 下载接管 |
| 版本 | 2.0.0 | 2.0.0 |
| 语言 | 简体中文、English | 简体中文、English |
| 类别 | 工具 / 下载 | 工具 / 下载 |

### 简短描述（≤132 字符，两店通用）

> 把浏览器下载自动接管到本机的 Rdown 下载管理器：HTTP 多线程、BT/磁力、m3u8/mpd 流媒体、断点续传。
>
> 需要配合开源本机程序 Rdown 使用（见详细描述）。

英文版：

> Captures browser downloads to the local Rdown manager: multi-connection HTTP, BitTorrent/magnet, m3u8/mpd streams, resume.
> Requires the open-source Rdown local app (see full description).

---

## 2. 详细描述（详细说明 / Store listing description）

### 中文

Rdown 下载接管是开源下载管理器 Rdown 的官方浏览器扩展（配套本机程序源码见项目主页，免费、开源、无广告）。

【重要】本扩展需要配合在你电脑上运行的 Rdown 本机程序（Node.js，开源）才能工作：
1. 从项目主页下载或克隆 Rdown；
2. 运行 start.bat（或 npm start）启动本机服务（默认 http://127.0.0.1:16801）；
3. 安装本扩展即可，选项页可一键测试连接。
未启动本机程序时，扩展不会影响你的正常下载：接管失败的下载会自动交还浏览器完成。

主要功能：
- 自动接管浏览器下载：点击下载链接后自动发送到 Rdown（多连接分段、断点续传），发送失败自动回退浏览器下载
- 请求头透传：自动携带 Cookie / User-Agent / Referer，需要登录后才能下载的文件也能正常接管
- BT 与磁力链接：磁力链接点击直接接管；支持 tracker 自动更新
- 流媒体地址：m3u8 / mpd 下载清单地址自动识别并交给下载器
- 智能过滤：域名黑/白名单（通配符）、文件后缀黑/白名单、文件大小阈值
- 右键菜单：下载链接 / 图片 / 视频 / 音频，批量下载页面全部链接
- 磁力链接点击接管：点击页面上的 magnet: 链接直接创建任务
- 下载完成 / 失败系统通知，图标角标实时显示任务数
- 快捷键：Alt+Shift+D 开关接管，Alt+Shift+K 打开管理面板；按住 Alt 点击下载可临时跳过接管
- 接管开关、规则全部可配置，设置支持导出/导入

隐私说明：扩展只把你发起的下载地址及该请求所需的 HTTP 请求头发送到你本机的 Rdown 服务（默认 127.0.0.1，数据不出本机）；不收集、不上传任何数据给第三方，不含广告与追踪。详见隐私政策。

### English

Rdown Connector is the official browser extension of the open-source Rdown download manager (free, open-source, ad-free; local app source on the project page).

[Important] This extension requires the Rdown local application (Node.js, open-source) running on your computer:
1. Download or clone Rdown from the project page;
2. Run start.bat (or npm start) to start the local service (default http://127.0.0.1:16801);
3. Install this extension — the options page has a one-click connection test.
If the local app is not running, the extension will not affect your normal downloads: any failed hand-off falls back to the browser automatically.

Features:
- Captures browser downloads to Rdown automatically (multi-connection segments, resume); falls back to the browser on failure
- Request-header passthrough: Cookie / User-Agent / Referer forwarded, so downloads behind logins work
- BitTorrent & magnet links: click magnet: links to create tasks; auto tracker updates
- Stream manifests: m3u8 / mpd playlist URLs detected and handed to the downloader
- Smart filters: domain allow/block lists (wildcards), extension allow/block lists, size threshold
- Context menus: download link / image / video / audio; batch-download all links on a page
- Magnet click capture: clicking a magnet: link on a page creates a task directly
- System notifications on completion/failure; badge shows active task count
- Shortcuts: Alt+Shift+D toggle capture, Alt+Shift+K open the panel; hold Alt while clicking to bypass once
- All switches and rules configurable; settings export/import supported

Privacy: the extension only sends the download URL and the HTTP request headers needed for that request to your local Rdown service (127.0.0.1 by default; data never leaves your machine). No third-party data collection, no ads, no tracking. See the privacy policy for details.

---

## 3. 搜索关键词（≤7 个，Edge 明确限制 7 个）

aria2, 下载管理器, 下载接管, BT, 磁力, m3u8, 流媒体下载

---

## 4. Chrome 控制台 Privacy practices（隐私做法）选项卡填写指南

按实际行为如实勾选（与 PRIVACY.md 及扩展行为完全一致，切勿多勾或少勾）：

| 声明项 | 勾选 | 说明 |
|---|---|---|
| 远程代码使用 | **否**（Does NOT use remote code） | 扩展不下载执行远程代码 |
| 收集/使用用户数据： | | |
| - 个人身份信息（PII） | 否 | 不收集 |
| - 财务与付款信息 | 否 | 不收集 |
| - 健康信息 | 否 | 不收集 |
| - 认证信息（Auth info） | **是** | Cookie 属于认证信息，用于下载请求的鉴权透传 |
| - 位置信息 | 否 | 不收集 |
| - 网站内容 | **是** | 下载请求的 HTTP 请求头（webRequest 观测） |
| - 浏览记录（Browsing history） | 否 | 不读取浏览历史；仅处理你发起的下载项 |
| - 用户活动（User activity） | 可勾"否" | 无分析追踪 |
| - 网站内容（Website content）同上 | — | 同上 |
| 认证信息用途声明 | 单一用途 | "仅在用户发起下载时，将下载请求所需的 Cookie 发送至用户本机的 Rdown 服务（默认 127.0.0.1）以完成该下载" |
| 网站内容用途声明 | 单一用途 | "仅在用户发起下载时，读取该下载请求的 HTTP 请求头并转发至用户本机的 Rdown 服务以完成该下载" |
| 数据出售 | 否 | 不出售 |
| 数据用于广告/营销 | 否 | 无广告无营销 |
| 数据转移是否经用户同意 | — | 数据仅发往用户自己配置的本机服务 |
| 隐私政策网址 | **必填** | 托管 PRIVACY.md 后的公开 URL |

**Limited Use 认证（Restricted Use 条款）**：确认数据仅用于本扩展的单一用途（把用户发起的下载转发给本机下载管理器），不用于广告、不出售、不由人工阅读。

## 5. Edge Partner Center 对应填写

- Store/Submission → Properties：类别选"工具"；语言勾选 zh-CN、en。
- Submission Options → **Notes for certification（认证备注）**：粘贴第 6 节的审核说明。
- 隐私政策 URL：同 Chrome（公开可访问）。
- 声明扩展依赖本机软件：详细描述中已说明（对应政策 1.2.3 Dependency on other software）。

---

## 6. 审核测试说明（Review / Notes for certification）

> 复制以下内容到 Chrome "审核备注"和 Edge "Notes for certification"。

```
This extension is the companion connector of the open-source local download manager "Rdown".
It requires the Rdown local service (Node.js, open-source) running at http://127.0.0.1:16801.

How to test:
1. Download the Rdown package from the project URL (source repository in the listing).
2. Run start.bat (Windows) or "npm start" to start the local service; the Web UI opens at http://127.0.0.1:16801.
3. Install this extension; open the extension options page and click "Test connection" — it should report a successful connection.
4. Download any file in the browser (e.g., a .zip from any site): the download is captured and appears in the Rdown Web UI at http://127.0.0.1:16801; the browser download is cancelled.
5. Stop the Rdown service and download again: the extension detects the failure and lets the browser download normally (graceful fallback).
6. Right-click a link → "Download with Rdown"; click a magnet: link on a page (with capture enabled) to create a BitTorrent task.
7. Alt+Shift+D toggles capture; the badge shows "OFF" when disabled.

The extension communicates ONLY with the user-configured local server (default 127.0.0.1).
No user data is sent to any third party. No remote code is loaded or executed.
Permissions rationale:
- downloads: intercept browser downloads (single purpose)
- webRequest (observe-only): capture request headers of the download for authenticated downloads
- cookies: read cookies of the download URL as header fallback
- contextMenus / notifications / alarms / storage: menus, completion notifications, badge refresh, settings
- host_permissions <all_urls>: required to observe download requests and read download-site cookies on any website
```

---

## 7. 图标与截图清单

| 素材 | 要求 | 现状 |
|---|---|---|
| 图标 16/48/128 | 清晰、原创 | ✅ `icons/icon16/48/128.png`（程序生成的原创箭头图标） |
| Chrome 截图 | 1280x800 或 640x400，≤ 数量按控制台 | ⬜ 需实拍：①Web UI 任务列表（暗色）②新建任务对话框（流媒体解析）③扩展 popup ④选项页过滤规则 |
| Edge 截图 | 按 Partner Center 当前要求 | ⬜ 同上 |
| 宣传图（可选） | Chrome 小图 440x280 / 大图 1400x560 | ⬜ 可选 |

截图建议：在 Chrome 中加载扩展后截取 popup 与选项页；Web UI 截图直接访问 http://127.0.0.1:16801 截取。

---

## 8. 打包前最终自查表

- [ ] manifest.json 位于 ZIP 根目录；所有引用文件存在（可用 `node --check` + 引用校验脚本确认）
- [ ] 权限已最小化（无 tabs/scripting 等未使用权限）
- [ ] 代码无混淆、无远程可执行代码、无内联脚本（仅外链 src 脚本）
- [ ] PRIVACY.md 已托管为公开 URL 并填入两个控制台
- [ ] Chrome Privacy practices 各声明项与实际行为一致
- [ ] 详细描述已声明对本机服务的依赖与测试方法
- [ ] Edge 备注中粘贴了审核测试说明
- [ ] 搜索词 ≤7 个
- [ ] 版本号 ≥ 上一版本
