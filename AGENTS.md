# AGENTS.md

本文件为 AI Agent 与开发协作规则说明文档，记录项目架构、核心功能规范、GitHub 自动化流水线（Workflows）及发版协作流程。

---

## 1. 项目概览与技术栈

- **项目名称**：PDFTools（智能发票合并打印与重命名效率工具箱）
- **核心定位**：纯前端/本地化运行的 PDF 处理套件，支持 Web 端静态部署与跨平台桌面客户端原生运行。
- **技术栈**：
  - **前端框架**：React 19 + TypeScript + Vite 8 + Tailwind CSS
  - **PDF 处理**：`pdfjs-dist`（文字图元坐标与元数据提取、缩略图渲染）、`pdf-lib`（PDF 双联拼版与合成合并）
  - **打包压缩**：`jszip`（重命名后批量一键打包导出）
  - **桌面端运行时**：Tauri 2.0 (Rust) + Electron（提供轻量级 2.5MB Windows 安装版/绿色便携版与 macOS 原生应用）
  - **代码规范工具**：TypeScript (`tsc -b`)、`oxlint`

---

## 2. 核心功能与模块规范

1. **发票智能合并与 A4 双联拼版 (`InvoiceMergeWorkbench`)**
   - 自动等比缩放并排版 2 张发票至 A4 纸张，节省 50% 纸张。
   - 包含发票专用章无偏移保护、居中虚线裁剪引导、发票复制副本 (`+1`) 及 300 DPI 报销封面单生成。
2. **发票批量智能重命名 (`InvoiceRenameWorkbench`)**
   - 依托 2D 空间排版感知引擎 (`reconstructVisualLines`) 与坐标聚类，彻底解决数电票图元分离导致的字段脱节问题。
   - 精准区分左右双栏与上下结构的销售方与购买方。
   - 支持 `{日期}`, `{销售方}`, `{金额}`, `{发票号码}`, `{发票代码}`, `{购买方}`, `{原文件名}` 等模板占位符，支持一键 ZIP 打包。
3. **通用 PDF 批量合并 (`GeneralMergeWorkbench`)**
   - 支持多文档多页 PDF 的追加合并与拖拽排序。
4. **在线检测升级系统 (`updater.ts`)**
   - 基于 `public/version.json` 进行空闲后台静默版本对比，支持 Web 端一键热更新及桌面端安装包直达下载。

---

## 3. GitHub 托管与 CI/CD 自动化流水线 (Workflows)

项目代码托管在 GitHub（`bearben2575/PDFTools`），在 `.github/workflows` 中配置了两个核心自动化 Flow：

### Flow 1: GitHub Pages 部署流水线 (`.github/workflows/deploy.yml`)
- **文件路径**：`.github/workflows/deploy.yml`
- **触发条件**：
  - `push` 代码至 `main` 分支
  - 手动触发 (`workflow_dispatch`)
- **运行流程**：
  1. 使用 Node.js 22 并缓存 npm 依赖；
  2. 执行 `npm ci` 安装依赖并运行 `npm run build` 生成 `dist` 静态产物；
  3. 通过 `actions/upload-pages-artifact` 与 `actions/deploy-pages` 自动发布至 GitHub Pages 托管站点。

### Flow 2: 多平台桌面端发布流水线 (`.github/workflows/release.yml`)
- **文件路径**：`.github/workflows/release.yml`
- **触发条件**：
  - 推送匹配 `v*` 规则的 Tag（如 `v1.0.5`）
  - 手动触发 (`workflow_dispatch`)
- **并发构建矩阵**：
  1. **`release-windows` (windows-latest)**：
     - 配置 Node.js 22 与 Rust stable 环境；
     - 执行 `npm run build` 与 `npx tauri build`；
     - 自动收集 NSIS 安装向导包 (`Setup_x64.exe`)、单文件绿色便携版 (`Portable_x64.exe`) 及 MSI 安装包 (`x64.msi`)；
     - 通过 `softprops/action-gh-release` 自动创建 GitHub Release，正文关联 `CHANGELOG.md`。
  2. **`release-macos` (macos-latest)**：
     - 配置 Node.js 22 与 Rust stable 环境；
     - 执行 `npx tauri build --bundles dmg,app` 打包 macOS 镜像 (`macOS.dmg`)；
     - 自动挂载并发布至同一个 GitHub Release 中。

---

## 4. 版本更新与发版协作规范

每次发布新版本时，必须同步更新以下 5 处版本号文件并更新变更日志：

1. `package.json` 中的 `version`
2. `public/version.json` 中的 `version`, `releaseDate`, `title`, `highlights`, `githubReleaseUrl`
3. `src/lib/version/updater.ts` 中的 `CURRENT_VERSION`
4. `src-tauri/tauri.conf.json` 中的 `version`
5. `src-tauri/Cargo.toml` 中的 `version`
6. `CHANGELOG.md`：根据最新特性说明更新日志。

**发布步骤示例**：
```bash
# 1. 验证构建与静态检查
npm run lint
npm run build

# 2. 提交代码变更
git add .
git commit -m "chore: release vX.Y.Z"

# 3. 打 Tag 并推送到远程触发流水线
git tag vX.Y.Z
git push origin main --tags
```
推送后 GitHub Actions 会自动触发 Pages 构建与桌面多端打包发布。

---

## 5. 常用本地开发命令

```bash
# 启动本地 Web 开发服务器
npm run dev

# 编译检查与生产构建
npm run build

# 执行代码风格与语法检查
npm run lint

# 本地 Tauri 桌面端构建
npm run tauri:build
```
