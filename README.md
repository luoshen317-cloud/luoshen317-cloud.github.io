# 个人网站 GitHub Pages 模板

这是一个不需要构建工具的静态个人网站，可以直接用 GitHub Pages 托管。

## 文件

- `index.html`: 页面内容和 SEO 信息
- `styles.css`: 视觉样式和响应式布局
- `script.js`: 移动端导航和页头滚动状态
- `assets/hero-workspace.png`: 首屏视觉图片

## 快速修改

在 `index.html` 中搜索并替换这些占位内容：

- `你的名字`
- `hello@example.com`
- `https://github.com/yourname`
- `https://www.linkedin.com/in/yourname`
- 项目名称、经历、笔记标题和个人简介

在 `styles.css` 顶部的 `:root` 中可以调整主色：

- `--accent`: 主按钮和链接颜色
- `--bg`: 页面背景
- `--surface`: 卡片和内容背景

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库，例如 `yourname.github.io`。
2. 上传本文件夹里的全部文件，确保 `index.html` 位于仓库根目录。
3. 进入仓库的 `Settings` → `Pages`。
4. 在 `Build and deployment` 中选择 `Deploy from a branch`。
5. 选择 `main` 分支和 `/ (root)` 目录，然后保存。
6. 等待 GitHub Actions 完成部署，访问 `https://yourname.github.io`。

如果你用普通仓库名，例如 `personal-site`，访问地址通常是 `https://yourname.github.io/personal-site/`。
