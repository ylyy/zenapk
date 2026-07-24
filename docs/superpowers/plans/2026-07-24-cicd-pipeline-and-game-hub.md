# 双游戏整合与 GitHub Actions CI/CD 自动部署 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 整合 `fruit` 手势拍水果与 `badminton-game` 双人羽毛球游戏至统一应用大厅，并配置 GitHub Actions CI/CD 自动化构建流水线与免费 GitHub Pages 自动部署。

**Architecture:** 重构根目录与各游戏子目录的 package.json 逻辑，实现统一打制品到 `/dist` 目录；创建 `.github/workflows/deploy.yml` 工作流，每次 Push 代码自动触发依赖安装、项目编译、制品压缩与 GitHub Pages HTTPS 部署。

**Tech Stack:** Node.js (v18+), Vite, GitHub Actions, GitHub Pages, HTML5, JavaScript (ES6+).

## Global Constraints

- 统一编译产物输出位置为仓库根目录下的 `/dist`
- 大厅主页路径：`dist/index.html`
- 水果游戏子路径：`dist/fruit/index.html`
- 羽毛球游戏子路径：`dist/badminton/index.html`
- GitHub Actions 工作流使用 official `actions/deploy-pages@v4` 和 `actions/upload-pages-artifact@v3`

---

### Task 1: 整合应用 package.json 统一构建脚本与产物目录

**Files:**
- Modify: `package.json:1-12`
- Create: `scripts/build-all.js`
- Test: `dist/index.html`, `dist/fruit/index.html`, `dist/badminton/index.html`

**Interfaces:**
- Consumes: Existing `fruit` and `badminton-game` Vite configurations.
- Produces: `npm run build:all` command creating clean `/dist` directory structure.

- [ ] **Step 1: 创建一键聚合构建脚本 `scripts/build-all.js`**

```javascript
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

console.log('🧹 Cleaning dist directory...');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

console.log('📦 Building fruit game...');
execSync('npm run build', { cwd: path.join(rootDir, 'fruit'), stdio: 'inherit' });

console.log('📦 Building badminton game...');
execSync('npm run build', { cwd: path.join(rootDir, 'badminton-game'), stdio: 'inherit' });

console.log('📂 Copying game dist outputs...');
fs.cpSync(path.join(rootDir, 'fruit', 'dist'), path.join(distDir, 'fruit'), { recursive: true });
fs.cpSync(path.join(rootDir, 'badminton-game', 'dist'), path.join(distDir, 'badminton'), { recursive: true });

console.log('📄 Copying hub index.html...');
if (fs.existsSync(path.join(rootDir, 'index.html'))) {
  fs.copyFileSync(path.join(rootDir, 'index.html'), path.join(distDir, 'index.html'));
}

console.log('✅ Build all complete!');
```

- [ ] **Step 2: 更新根目录 `package.json` 中的 script 命令**

```json
{
  "name": "ar-motion-games-hub",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev:fruit": "cd fruit && npm run dev",
    "dev:badminton": "cd badminton-game && npm run dev",
    "build:fruit": "cd fruit && npm run build",
    "build:badminton": "cd badminton-game && npm run build",
    "build:all": "node scripts/build-all.js"
  }
}
```

- [ ] **Step 3: 调整 `index.html` 中的游戏跳转链接**

将 `index.html` 中的跳转链接调整为统一构建后的相对路径：
- 水果游戏连接：`./fruit/index.html`
- 羽毛球对战链接：`./badminton/index.html`

- [ ] **Step 4: 本地运行 `npm run build:all` 验证产物生成**

Run: `npm run build:all`
Expected: `/dist` 目录下成功包含 `index.html`, `fruit/` 目录以及 `badminton/` 目录。

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/build-all.js index.html
git commit -m "feat: add build-all script and unify dist output directory"
```

---

### Task 2: 配置 GitHub Actions 自动化 CI/CD 部署工作流

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: GitHub Repository Push Event on `main` or `master` branch.
- Produces: GitHub Pages deployment artifact and deployment job execution.

- [ ] **Step 1: 创建 `.github/workflows/deploy.yml`**

```yaml
name: Build and Deploy to GitHub Pages

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - name: Install Root Dependencies
        run: npm ci || npm install

      - name: Install Fruit Game Dependencies
        run: cd fruit && (npm ci || npm install)

      - name: Install Badminton Game Dependencies
        run: cd badminton-game && (npm ci || npm install)

      - name: Run Unified Build
        run: npm run build:all

      - name: Upload GitHub Pages Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 验证 workflow YAML 语法格式**

确保 YAML 文件缩进正确且无语法错误。

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions workflow for automatic GitHub Pages deployment"
```

---

### Task 3: 整体功能校验与提交推送

**Files:**
- Verify: Entire repository git state.

- [ ] **Step 1: 运行本地构建全流程测试**

Run: `npm run build:all`
Expected: 所有步骤 0 错误退出（exit code 0）。

- [ ] **Step 2: 验证产物文件包含**

检查以下路径文件是否存在：
- `dist/index.html`
- `dist/fruit/index.html`
- `dist/badminton/index.html`

- [ ] **Step 3: Final Commit & Push 提示**

提示用户合并并 push 到 GitHub 触发全自动云端部署！
