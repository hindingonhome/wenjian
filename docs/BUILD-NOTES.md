# 构建与验收记录 · 1.2.1

## 来源与构建

- 应用版本来自 package.json；Electron 44.9.0，electron-builder 26.15.3。
- Windows：electron-builder portable x64，未做商业数字签名。
- Linux：官方 Electron Linux x64 ZIP、AppImage type2-runtime 标签 20251108、SquashFS tools-ng 1.3.2 Windows 工具组装。
- download-receipts.json 记录工具来源和哈希；Electron 和 AppImage 运行时与上游摘要核对。SquashFS 工具记录下载哈希，未声称上游签名验证。工具不放入交付包。
- 两平台同一 app.asar；从 Linux SquashFS 读出的负载与 Windows SHA256 相同。

## 自动核验范围

- Node 回归覆盖十算法、确定性、参数变化与历史交互。
- Windows 最终 EXE：31 张页面与菜单图加载；3840、2560、1920、1440、1366、1280、1024、960 八种宽度，浅深主题共十六种布局；以 clientWidth 核对横向溢出。
- 顶栏十项选择、数值输入驱动参数、浮动面板关闭、作品区历史入口、各算法独立状态、五条历史、三个 AI 角度、PNG/JPG 下载完成及取消分支。
- Canvas 按可见尺寸与像素比生成缓冲区，上限约八百万像素；算法逻辑坐标保持不变。
- 渲染错误收集必须为空。截图核验关闭动画，避免隐藏测试窗口的首帧过渡影响截图；正常应用保留动画和减少动态效果设置。
- 本地字体加载与页面用字覆盖；图文说明书在应用渲染器中打开并截图复核。
- Linux：x64 ELF、Type 2 标记、SquashFS 偏移、主程序执行位、沙箱辅助程序权限及应用负载哈希。**未做 Linux 启动测试**，不能推断系统运行库、FUSE、显示和沙箱兼容性。
- 平台 ZIP 逐条目重新读取并核对摘要，交付根目录仅两平台 ZIP 与 SHA256SUMS.txt。

最终执行结果与截图在 Verification。验收说明中列出仍需用户检阅的视觉和目标系统项目。

## 字体与安全

界面嵌入源泉圆体 2.100 常规及粗体，以 Noto Sans SC 回退；均按 SIL OFL 1.1 保留许可、版权、来源及摘要。图标使用放大的“纹”字轮廓。未随包分发 Apple 专有字体。

HTML 在计算 CSP 前统一换行；外部脚本只从应用本地加载。桌面渲染器开启 sandbox、contextIsolation、webSecurity，禁用 nodeIntegration，资源通过白名单读取。外部研究链接交给系统浏览器打开。

## 第三方构建来源

- https://github.com/electron/electron/releases/tag/v44.9.0
- https://github.com/AppImage/type2-runtime/tree/20251108
- https://github.com/AgentD/squashfs-tools-ng
- https://infraroot.at/pub/squashfs/windows/
- https://github.com/ButTaiwan/gensen-font
- https://github.com/notofonts/noto-cjk

Licenses 保留 Electron、Chromium、字体许可；Linux 另附 AppImage 运行时许可及原文静态依赖链接。论文和图像来源在页面目录单独记录。
