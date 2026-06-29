# 找不同小游戏

这是一个移动端友好的找不同网页版小游戏（共 3 关，每关 3 处不同）。

文件说明：
- index.html - 主页面
- styles.css - 样式
- script.js - 交互逻辑
- manifest.json - PWA 配置（可选）
- sw.js - 简单 Service Worker，用于缓存
- assets/ - 放置关卡图片和图标（请替换为你的图片）

如何使用：
1. 在仓库根目录把图片上传到 assets/：
   - assets/level1-left.jpg
   - assets/level1-right.jpg
   - assets/level2-left.jpg
   - assets/level2-right.jpg
   - assets/level3-left.jpg
   - assets/level3-right.jpg
   - （可选）assets/icon-192.png、assets/icon-512.png
2. 点击仓库 Settings → Pages，把 Source 设置为 Branch: main / Folder: / (root)，等待几分钟，页面将在：
   https://karrie09011016-arch.github.io/1/
   （如果你的用户名或仓库名不同，请用实际地址替换）
3. 生成二维码供扫码打开：
   使用二维码 API：
   https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=YOUR_URL
   把 YOUR_URL 替换为你网站地址的 URL encode 形式，例如：
   https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https%3A%2F%2Fkarrie09011016-arch.github.io%2F1%2F

如果你希望我帮你：
- 我可以替你把关卡图片上传到仓库（你提供图片），或者
- 在你部署成功后我可以直接为你生成二维码并返回下载链接。
