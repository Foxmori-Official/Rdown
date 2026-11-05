# 缺失与半成品功能补全优先级路线图

> 依据《功能验收清单》自检结果（docs/acceptance-audit.md）编制。
> 原则：缺失功能先查参考项目源码（本地 `.research/` 已备 Motrix / Gopeed / N_m3u8DL-RE / Aria2-Explorer / cat-catch 源码），无参考才自研。

## P0（已完成，2026-10-19 批次，全部实测）

| 功能 | 参考来源 | 状态 |
|---|---|---|
| MCP Server 9 工具（/mcp） | Gopeed `pkg/mcpserver/server.go` | ✅ 9 工具全链路实测 |
| 扩展媒体嗅探（m3u8/mpd/视频/音频） | cat-catch（★22k）onResponseStarted+请求头配对 | ✅ 50 项测试全过 |
| 扩展多服务器 URL 路由 | Aria2-Explorer `getRpcServer` rpcList+pattern | ✅ |
| 扩展中间件 API | Aria2-Explorer `externally_connectable` | ✅ |
| 代理设置（--all-proxy 系） | aria2 原生选项 | ✅ 引擎参数+重启联动 |
| doctor 环境自检 | N_m3u8DL-RE `doctor` | ✅ 实测返回版本/路径 |
| CLI（add/list/watch NDJSON/doctor） | N_m3u8DL-RE 配置优先级 + Motrix CLI 形态 | ✅ 实测通过 |
| Metalink 创建 / 校验和透传 | aria2 原生 | ✅ 代码打通 |

## P1（✅ 已完成 2026-10-20 批次，全部实测；参考已定位，工作量中等）

| 功能 | 参考来源 | 状态 |
|---|---|---|
| UPnP/NAT-PMP 端口映射 | Motrix UPnPManager.js（委托 nat-api 库，同款薄封装） | ✅ nat-api 接线 + 设置联动 |
| 下载前参数弹窗（扩展） | Aria2-Explorer askBeforeDownload | ✅ 112 项测试全过 |
| 扩展面板多形态（新标签/窗口/侧边栏） | Aria2-Explorer webUIOpenStyle | ✅ 同上 |
| 流媒体选流 DSL（id/lang/res/bwMin/for=best[N]） | N_m3u8DL-RE ComplexParamParser（研究报告 §2） | ✅ E2E：res=^1280 选中 720p，drop 剔除 640p |
| 广告分片剔除 / custom-range 选段 | N_m3u8DL-RE --ad-keyword/--custom-range | ✅ customRange "0-2" 截 6→3 分片实测 |
| 命名模板变量 + UTF-8 字节安全截断 | N_m3u8DL-RE --save-pattern | ✅ <SaveName>_<Resolution> 等 12 变量 + 字节截断带哈希 |
| 限速多档预设 | Motrix Turbo | ✅ 全速/办公/夜间三档 + apply 端点 |
| Docker/NAS 无头部署 | Gopeed Dockerfile | ✅ 多阶段构建 + 非 root + 权限预校验 + compose |
| 任务搜索/优先级/定时开始 | Motrix/Gopeed/N_m3u8DL-RE --task-start-at | ✅ 搜索过滤 + changePosition 队列重排 + 定时自启实测 |
| 自动解压 / Webhook / 后处理脚本 | Gopeed autoExtract/webhook | ✅ webhook 实测送达；tar 自动解压（7z/rar 需 7-Zip） |
| 数据看板（速度波形图） | Motrix Dashboard | ✅ 1Hz×300 点采样 + totals 端点 |
| Electron 桌面壳（P2 提升） | Motrix Electron 架构 | ✅ 托盘/magnet 协议/种子关联/单实例/开机自启（electron 39 装好） |
| Web UI 十语言 i18n（P2 提升） | Gopeed i18n | ✅ 139 key × 9 语言文件 + Auto 跟随系统，指定顺序 |

## P2（大工程或低优先，需专项评估）

| 功能 | 参考来源 | 说明 |
|---|---|---|
| 插件系统（QuickJS 沙箱 + 权限审批 + 生命周期 Hook + 市场） | Motrix Turbo `.moext` + Gopeed goja | 最大单项工程；建议以 Node `vm` 隔离 + manifest 权限声明起步 |
| ed2k 电驴协议 | Gopeed `internal/protocol/ed2k/fetcher.go` | 需实现 ed2k 服务器 TCP 协议客户端，工作量大 |
| MSS(.ism) 原生解析 | N_m3u8DL-RE MSS 解析器 | 当前由外挂引擎路径覆盖 |
| CENC/DRM 解密引擎调度 | N_m3u8DL-RE `--decryption-engine` | 需集成 mp4decrypt/shaka；外挂引擎路径覆盖 |
| 直播实时合并/时移回看/IPTV 批量 | N_m3u8DL-RE 直播模块 | 原生引擎直播增强 |
| Electron 桌面壳（托盘/开机启动/协议注册） | Motrix Electron 架构 | 当前 Web 形态刻意取舍 |
| 移动端（Android/iOS） | Gopeed Flutter | 跨端重构级工程 |
| 设备码远程配对 | Motrix pairing 流程 | 远程访问安全场景 |
| 隐藏 WebView 插件解析环境 | Gopeed WebView 扩展 | 依赖桌面壳 |
