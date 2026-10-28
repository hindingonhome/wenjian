# 纹间 · WenJian

在本地观察自然生长，比较算法肌理与首饰概念。

[下载 Windows / Linux](https://github.com/hindingonhome/wenjian/releases/latest) · [使用说明](User-Guide.md) · [使用与版权](LICENSE) · [第三方声明](THIRD_PARTY_LICENSE.txt)

CHAMBER · 个人非商业使用免费，商业使用须另行书面授权。仓库公开可见，不采用开源许可；第三方组件遵从各自许可。商业授权联系：97101yy@gmail.com。

# 纹间 1.2.1 · 验收版

## 打开

- Windows：解压对应 ZIP，运行 WenJian-1.2.1-Windows-x64.exe。
- Linux x64：解压后执行 sh Launch.sh。此版尚未在 Linux 实机验证启动兼容性。
- 网页：打开 Backup-HTML/index.html，保留同目录全部资源。页面、算法、字体和图片可离线使用；外部论文需要联网。

## 本版重点

顶栏“算法”菜单像产品目录一样切换十项研究。当前算法的大标题、生长画布、参数、五条历史、金属概念图与研究来源同步切换。大画布支持按分辨率和像素密度重绘。

点击“调节参数”打开浮动面板，拖动圆润滑块或直接输入数值；速度只改变播放推进速度。点击“历史”查看最多五条会话记录。画布底部工具栏可暂停、单步、换形态、保存版本和导出。

浅深主题、十项算法、独立参数、三视角首饰图和完整引用保留。底部“规则／运算／应用”三栏已删除。菜单、面板可用 Escape 关闭。

界面及纹字图标使用源泉圆体 GenSen Rounded；Noto Sans SC 为备用字体。两者均附 SIL OFL 1.1 许可、版权信息和来源摘要。当前界面581个不同汉字的常规、粗体字形均已检查覆盖。

## 说明书与验收

- 简要操作：User-Guide.md；图文排版版：Backup-HTML/docs/Quick-Guide.html。
- 验收项目和待确认事项：验收说明.md。
- 自动检查报告、截图、字体覆盖及Linux结构证据：Verification。
- ZIP文件校验：外部 SHA256SUMS.txt；包内逐文件校验：PACKAGE-MANIFEST.sha256。

## 内容边界

生长图是研究机制的教学转译，未宣称精确复现论文。神经元胞自动机和三维生成式元胞自动机未载入论文训练权重。

AI首饰图按算法固定，三个角度是预生成静态图，模拟有限转向；参数不会调用在线AI重绘。PNG/JPG不是可打印网格。克重计算软件仍为独立项目。原始接触表与来源保留在备用HTML的docs和previews中。

## 开发与回退

源码运行 node --test tests/*.test.cjs。开发依赖与版本见package.json；准备离线资源后构建两端。当前源码保留算法引擎，产品布局单独在styles/product.css与assets/product-ui.js中实现。

1.1.1平台包保存在交付/2026-10-21-纹间-1.1.1，可用于回看旧版。完整改造前基线仍保留于历史构建存档。只撤回本次产品布局时，可直接提出“回退到1.1.1布局，保留字体资源与原始素材”。

Windows程序未做商业数字签名。Linux保留Chromium沙箱，未以关闭沙箱规避未知兼容问题。正式发行版通过纹间 GitHub Releases 提供。
