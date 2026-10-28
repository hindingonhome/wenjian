# 纹间 · 字体与字标来源

## 当前使用

页面中文、拉丁字母、数字及“纹”字图标采用 **源泉圆体 GenSen Rounded 2.100**，常规R与粗体B。字体保留黑体结构，在笔画端点与转角处圆润化。CSS使用应用内别名WenJian Rounded；不是苹果的专有字体。

- 作者项目：https://github.com/ButTaiwan/gensen-font
- 使用文件：otf/TW/GenSenRounded2TW-R.otf、GenSenRounded2TW-B.otf。
- 作者许可：https://github.com/ButTaiwan/gensen-font/blob/master/SIL_Open_Font_License_1.1.txt
- 本地许可：assets/fonts/GenSen-OFL.txt；平台包另附Licenses/GenSen-OFL.txt。
- 字体版本、版权、上游地址与SHA256：assets/fonts/sources.json。

原始字形完整转为WOFF2用于离线加载，没有删除字符或重新设计字形。当前界面581个不同汉字在常规、粗体中均有字形；结果见Verification/font-coverage.json。源文件为作者TW分区版本，不把界面简体文字转换为繁体。

## 备用字体

保留可商用Noto Sans SC常规及粗体，CSS别名WenJian Sans。来源：https://github.com/notofonts/noto-cjk；许可见assets/fonts/OFL.txt及Licenses/NotoSansSC-OFL.txt。特殊字符可由备用字体显示；未依赖Windows专有中文字体进行离线分发。

## 商用许可

上述字体均依SIL Open Font License 1.1分发。可用于商业软件、嵌入及随应用分发，需保留原版权和许可；字体文件不得单独作为商品出售。

放大的“纹”字由源泉圆体粗体字形转为SVG轮廓，再生成PNG/ICO，不依赖本机安装字体。图标与字体来源同样保留在包内。
