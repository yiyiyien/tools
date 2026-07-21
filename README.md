# 时间戳转换工具

一个可直接部署到 GitHub Pages 的静态网页工具，支持从混合文本或日志片段中提取时间戳并转换为本地时间。

## 功能

- 输入 `1,784,512,772,868`、`1780,000,736,801` 这类分隔符位置不固定的内容时，会自动清理为连续数字
- 支持从包含 ID、状态文字、特殊符号的日志文本中提取时间戳
- 自动识别 10/11/12/13 位时间戳，统一按前 10 位秒级时间戳解析
- 显示本地时间
- 适配桌面端和移动端

## 文件结构

```text
.
├── index.html
├── style.css
├── script.js
├── assets/
│   └── favicon/
│       ├── favicon.ico
│       ├── favicon-16x16.png
│       ├── favicon-32x32.png
│       ├── apple-touch-icon.png
│       ├── android-chrome-192x192.png
│       ├── android-chrome-512x512.png
│       └── site.webmanifest
└── README.md
```

## 本地预览

直接用浏览器打开 `index.html` 即可。

## 部署到 GitHub Pages

1. 新建一个 GitHub 仓库。
2. 上传整个项目目录，包含 `assets/favicon/` 中的图标文件。
3. 进入仓库的 `Settings`。
4. 打开 `Pages`。
5. 在 `Build and deployment` 中选择：
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. 保存后等待 GitHub Pages 生成访问地址。
