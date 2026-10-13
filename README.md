# PDFTools - 智能发票合并打印与效率工具箱 📄✨

> **100% 浏览器本地处理 · 零隐私泄漏 · A4 双联拼版 · 节省 50% 打印纸张 · 财务报销专属**

一个专为解决财务报销痛点而生的现代纯前端与桌面端 PDF 工具箱。支持网页版免安装直接使用，同时提供 **Windows 安装版与单文件绿色免安装版 (.exe)**，完全支持企业内网断网离线运行！

---

## 💻 桌面端下载 (.exe) 与在线体验

- 🌐 **在线免安装版**：[https://bearben2575.github.io/PDFTools/](https://bearben2575.github.io/PDFTools/)
- 📥 **Windows 安装版 (仅 3MB · 极简安装向导 · 自动生成桌面快捷方式)**：[PDFTools_Setup_x64.exe](https://github.com/bearben2575/PDFTools/releases/latest)
- 📦 **Windows 标准安装包 (.msi · 仅 3MB · 企业内网推荐)**：[PDFTools_x64.msi](https://github.com/bearben2575/PDFTools/releases/latest)
- ⚡ **离线绿色便携版 (.zip · 解压双击直接运行)**：[PDFTools-Offline-Portable.zip](https://github.com/bearben2575/PDFTools/releases/latest)

---

## 🌟 核心功能特性

### 1. 🧾 智能发票合并 (A4 双联 2合1 排版)
- **A4 双联上下拼版**：自动将 2 张电子发票按上下位置等比排版在一张 A4 纸上，打印纸张立省 50%。
- **印章无偏移保护**：深度处理发票坐标系，确保税务局电子发票红章、发票专用章无位移、无遮挡。
- **中间虚线裁剪引导线**：可选开启中间虚线引导与剪刀标识，打印后裁剪整齐方便。
- **纵向票据自动横旋**：智能检测票据方向，竖版票据自动旋转对齐半页横栏。
- **单张居中 (1合1) 与边距调节**：支持紧凑 (12pt)、标准 (20pt)、宽松 (30pt) 三档边距微调。

### 2. 💰 智能信息提取与财务看板
- **关键数据自动解析**：自动提取发票中的 **价税合计金额 (`¥`)**、**发票号码（含20位数电发票）**、**开票日期** 与 **销售方名称**。
- **发票数据手动校准**：支持点击金额徽章快速手动修正或微调。
- **财务汇总看板**：实时汇总待报销发票份数、自动计算总金额，并即时转换为 **人民币中文大写金额**（如 `壹仟零柒元伍角整`）。

### 3. 📑 自动生成印刷级「费用报销汇总封面单」
- 一键开启生成置于 PDF 首张的报销封面单。
- 采用原生 Canvas 300 DPI 印刷级渲染，无须额外加载几十兆中文字体包，毫秒级合成。
- 包含报销人、报销部门、汇总日期、大小写总金额、发票明细表格及底部领导签字审批栏。

### 4. 📋 一键发票“复制副本” (+1)
- 解决财务要求某些特定发票打印多份留底的痛点。点击发票卡片旁的“复制”按钮即可生成独立副本参与排版，支持任意多份。

### 5. 🖨️ 所见即所得实时预览与一键打印
- 右侧大屏高保真 Canvas 实时渲染拼版效果，支持缩放与多页翻页。
- **一键直接打印**：免去先下载再用本地软件打开的繁琐步骤，直接唤起系统打印对话框。
- **智能命名导出**：一键导出带时间戳命名的合并 PDF（如 `发票报销拼版_20261013_1030.pdf`）。

### 6. 🏷️ 发票批量智能重命名与一键 ZIP 打包
- 自动提取发票开票日期、销售方、报销金额、发票号码与发票代码。
- 内置 4 套常用财务归档命名模板（如 `{日期}_{销售方}_{金额}元.pdf`），支持自定义占位符变量自由组合。
- 支持实时对照预览新旧文件名、单条文件名手动微调、单张独立下载或 **一键打包下载全部重命名发票 (.ZIP)**。

### 7. 📦 通用 PDF 合并基座
- 内置通用多页 PDF 合并工具，支持合同、标书、论文、简历等任意多页文档拖拽排序与批量合并。

### 8. 🔒 100% 本地隐私安全保障
- **零服务端存储**：所有 PDF 文件解析、拼版、提取与生成均在浏览器端（Memory / Canvas）完成，文件 **绝不上传到任何远程服务器**，杜绝企业发票与敏感财务数据泄露。

---

## 🚀 免费托管与上线部署方案

本项目为纯静态 Web 应用（无后端服务器依赖），可以 **100% 免费** 托管在以下主流静态部署平台上：

### 方案一：Vercel（强烈推荐 · 1分钟全自动）
Vercel 提供每月 100GB 免费流量与免费自动化构建：
1. 访问 [vercel.com](https://vercel.com/) 并使用 GitHub 账号登录。
2. 点击 **"Add New..." -> "Project"**。
3. 找到并选择导入你的仓库 `bearben2575/PDFTools`。
4. Framework Preset 会自动识别为 `Vite`，无需修改任何设置，直接点击 **"Deploy"**。
5. 约 30 秒构建完成后即可获得一个免费的全球加速二级域名（如 `pdftools-xxx.vercel.app`），支持绑定个人独立域名与免费 SSL 证书。
6. 后续每次执行 `git push` 到仓库，Vercel 会自动拉取并更新部署。

---

### 方案二：Cloudflare Pages（无限免费流量 · 国内访问友好）
Cloudflare 提供无限流量、强大的 CDN 加速以及免费自定义域名：
1. 注册并登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 在左侧菜单点击 **Workers & Pages** -> **Create application** -> 选择 **Pages** 选项卡。
3. 点击 **Connect to Git** 并授权访问 GitHub 仓库 `bearben2575/PDFTools`。
4. 构建配置填写：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. 点击 **Save and Deploy**，即可获得免费分配的 `pages.dev` 访问链接。

---

### 方案三：GitHub Pages（零额外账号 · 仓库原生托管）
本项目已内置 GitHub Actions 自动部署流水线（见 `.github/workflows/deploy.yml`）：
1. 将代码推送到 GitHub 的 `main` 分支。
2. 打开 GitHub 仓库页面，点击顶部 **Settings** -> 左侧 **Pages**。
3. 在 **Build and deployment** 下的 **Source** 下拉菜单中，选择 **GitHub Actions**。
4. 提交代码后，GitHub Actions 会自动编译并将 `dist` 目录发布到 GitHub Pages。
5. 部署完成后即可通过 `https://bearben2575.github.io/PDFTools/` 直接访问。

---

### 方案四：Netlify
1. 登录 [Netlify](https://www.netlify.com/)，选择 **Add new site** -> **Import an existing project**。
2. 选择 GitHub 并勾选 `bearben2575/PDFTools`。
3. 构建命令设为 `npm run build`，发布目录设为 `dist`，点击 **Deploy** 即可。

---

## 💻 本地开发与构建

### 1. 安装环境要求
- Node.js >= 18.0.0
- npm / pnpm / yarn

### 2. 克隆项目与安装依赖
```bash
git clone git@github.com:bearben2575/PDFTools.git
cd PDFTools
npm install
```

### 3. 启动本地开发服务
```bash
npm run dev
```
打开浏览器访问 `http://localhost:5173` 即可开始使用。

### 4. 生产环境构建
```bash
npm run build
```
打包输出静态资源位于 `dist/` 目录下，可直接放置于任意 Nginx、Apache、OSS 或 CDN 静态托管空间。

---

## 🛠️ 技术栈一览

- **核心框架**：React 19 + TypeScript + Vite 8
- **样式与设计系统**：Tailwind CSS + Lucide React（专业线性 SVG 图标）
- **PDF 处理核心**：
  - `pdf-lib`：PDF 页面创建、A4 2-up 矢量嵌入、坐标变换与拼版输出
  - `pdfjs-dist`：客户端发票高分辨率缩略图渲染、发票文本流解析提取
- **拖拽与交互**：`@dnd-kit/core` + `@dnd-kit/sortable`
- **特效**：`canvas-confetti`

---

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。
