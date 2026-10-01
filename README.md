# Git 好好学

一个面向中文初学者的交互式 Git 教学网站。你可以在浏览器里输入 Git 命令，同时观察代码、工作区状态、本地分支、远端跟踪分支和提交树的变化。

无需安装 Git，不会修改电脑上的真实项目，也不需要登录账号。

## 在线体验

当前演示地址：<https://git-haoxue.wiry-bull-1259.chatgpt.site>

> 网站只有在托管平台设置为“公开访问”后，访客才能免登录使用。GitHub 仓库公开与网站公开是两项独立设置。

## 为什么做这个项目

很多 Git 教程只给出命令和概念，初学者很难看到一条命令究竟改变了什么。Git 好好学把学习过程拆成四个同步区域：

- 教学任务：告诉你下一步执行什么、为什么执行以及应该观察哪里。
- 模拟终端：输入常见 Git 命令，支持上下方向键浏览历史命令。
- 代码浏览器：编辑当前本地分支，查看其他本地分支与 `origin/*` 的代码快照。
- 分支与提交树：观察 `HEAD`、本地分支和远端跟踪分支如何移动。

## 三阶段课程

### 第一阶段：入门

学习工作区、暂存区、提交、HEAD 和分支的基本关系，练习：

```bash
git status
git diff
git add .
git commit -m "说明"
git log
git branch yhx
git switch yhx
git merge main
git restore src/App.tsx
```

### 第二阶段：个人项目

使用功能分支独立完成一个小项目，学习小步提交、合回主线和发布前检查。

### 第三阶段：团队协作

区分真实远端、本地的 `origin/*` 跟踪分支和当前工作分支，练习：

```bash
git fetch
git merge origin/main
git pull
git push
```

网站可以模拟队友向远端提交、非快进推送被拒绝以及代码冲突。

## 已支持的功能

- 编辑代码并观察未暂存、已暂存和已提交状态
- 创建、查看和切换本地分支
- 查看本地分支与远端分支的不同代码快照
- fast-forward、Already up to date 和冲突合并
- 独立的远端服务器、`origin/*` 跟踪分支和本地分支状态
- `fetch`、`pull`、`push` 及 push rejected 场景
- 固定高度终端、自动滚动和命令历史
- 切换课程时自动重置练习仓库

这是教学模拟器，不会替代真实 Git，也不覆盖 Git 的全部底层命令。

## 本地运行

要求 Node.js 22.13 或更高版本。

```bash
git clone git@github.com:YOUR_NAME/git-haoxue.git
cd git-haoxue
npm install
npm run dev
```

浏览器打开终端显示的本地地址。

## 构建

```bash
npm run build
```

## 公开部署

推荐把 GitHub 仓库连接到 Cloudflare 或 Vercel，并把部署结果设置为公开访问。公开部署后，普通访客只需打开链接，不需要 GitHub 或 ChatGPT 账号。

当前项目使用 Vinext 和 Cloudflare Worker 兼容构建。若要使用 GitHub Pages，需要另行改造成纯静态导出。

## 参与贡献

欢迎提交 Issue 或 Pull Request，例如：

- 增加 `rebase`、`cherry-pick`、`stash`、`reset` 和 `revert` 课程
- 改进提交树动画与冲突可视化
- 增加更多中文练习项目
- 修正文案、命令行为或无障碍体验

提交改动前请运行：

```bash
npm run build
```

## 许可证

本项目使用 [MIT License](./LICENSE)。你可以自由使用、学习、修改和分发，但需保留原许可证声明。
