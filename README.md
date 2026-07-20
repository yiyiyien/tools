# 时间戳转换工具

一个可直接部署到 GitHub Pages 的静态网页工具，支持时间戳转时间、时间转时间戳，并会自动过滤输入里的逗号、空格、下划线等特殊字符。

## 功能

- 输入 `1,784,512,772,868` 这类内容时，会自动清理为 `1784512772868`
- 自动识别秒级和毫秒级时间戳
- 显示本地时间、UTC 时间和 ISO 格式
- 支持日期时间反向转换为秒级和毫秒级时间戳
- 支持一键复制结果
- 适配桌面端和移动端

## 文件结构

```text
.
├── index.html
├── style.css
├── script.js
└── README.md
```

## 本地预览

直接用浏览器打开 `index.html` 即可。

## 部署到 GitHub Pages

1. 新建一个 GitHub 仓库。
2. 上传 `index.html`、`style.css`、`script.js` 和 `README.md`。
3. 进入仓库的 `Settings`。
4. 打开 `Pages`。
5. 在 `Build and deployment` 中选择：
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. 保存后等待 GitHub Pages 生成访问地址。
