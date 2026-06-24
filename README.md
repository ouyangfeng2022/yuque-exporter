# 语雀知识库批量导出

[![Version](https://img.shields.io/badge/version-2.1.0-brightgreen.svg)](#版本号)
[![Chrome Extension](https://img.shields.io/badge/Chrome-浏览器扩展-blue.svg)](https://chrome.google.com/webstore)
[![Edge Add-Ons](https://img.shields.io/badge/Edge-浏览器扩展-blue.svg)](https://microsoftedge.microsoft.com/addons/detail/%E8%AF%AD%E9%9B%80%E7%9F%A5%E8%AF%86%E5%BA%93%E6%89%B9%E9%87%8F%E5%AF%BC%E5%87%BA/dighgpfabpmfglojkecjejbeiifpjccb)

Chrome 浏览器扩展，批量导出语雀知识库文档。
安装即用，无需手动获取 Token 或 API 密钥 —— 扩展直接从页面读取认证信息，省去一切配置步骤。

语雀原生只支持单篇手动导出。这个扩展让你可以一键批量导出整个知识库的所有文档。

## 支持的导出格式

扩展调用语雀官方导出接口，支持全部五种格式：

| 格式 | 说明 | 扩展名 |
| ------ | ------ | -------- |
| Markdown | 标准 Markdown | `.md` |
| Lake | 语雀原生格式，完整保留语雀特有语法 | `.lake` |
| Word | Microsoft Word 文档 | `.docx` |
| PDF | 便携式文档格式 | `.pdf` |
| JPG | 图片格式 | `.jpg` |

> **注意**：导出由语雀官方接口完成，格式和质量与语雀原生导出一致。本扩展只做了批量自动化。

## 安装

从源码加载（开发者模式）：

1. 克隆项目到本地
2. 打开 `chrome://extensions/`（Edge 用 `edge://extensions/`）
3. 开启右上角「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择项目根目录

> 已在 [Edge Add‑ons 商店](https://microsoftedge.microsoft.com/addons/detail/%E8%AF%AD%E9%9B%80%E7%9F%A5%E8%AF%86%E5%BA%93%E6%89%B9%E9%87%8F%E5%AF%BC%E5%87%BA/dighgpfabpmfglojkecjejbeiifpjccb)上架：。
Chrome Web Store：上架中，后续可通过商店直接安装。

## 使用

### 界面

打开语雀页面后，右上角会出现浮动的导出面板：

| 初始状态 | 加载知识库后 |
| :---: | :---: |
| ![浮窗面板](assets/image1.png) | ![知识库列表](assets/image2.png) |

面板可拖拽移动，点击 `-` 按钮可折叠为小图标。在语雀知识库内部页面，面板还会显示「导出当前文档」按钮，方便单篇导出。

### 批量导出

1. 打开任意语雀页面（需要已登录语雀账号）
2. 点击面板中的「加载知识库」按钮
3. 勾选要导出的知识库，支持全选
4. 选择导出格式
5. 根据需要调整导出选项
6. 选择下载并发数（见下方「下载并发与限流」）
7. 点击「批量导出」

导出过程中面板会显示进度，完成后浏览器自动下载文件。

### 导出选项

**Markdown 格式可选参数：**

| 选项 | 说明 |
| ------ |------ |
| LaTeX | 将 LaTeX 公式导出为 Markdown 语法 |
| 锚点 | 保留语雀的锚点链接 |
| 换行 | 保留语雀的换行格式 |
| MDAI | 导出 PlantUML 等额外卡片内容（默认开启） |

**PDF 格式可选参数：**

| 选项 | 说明 |
| ------ | ------ |
| 导出大纲 | 在 PDF 中包含文档大纲 |

### 下载并发与限流

为了不给语雀服务器带来过大压力，批量导出采用**分批并发**策略：将文档分成多批，每批同时下载固定数量的文档，批与批之间停顿约 1 秒，再开始下一批。

面板上的「下载并发数」用于设置每批的并发数：

| 并发数 | 适用场景 |
| ------ | ------ |
| 1 | 最稳妥，完全串行 |
| 2（默认） | 推荐，兼顾速度与服务器压力 |
| 4 | 知识库较大、希望更快 |
| 8 | 最快，对服务器压力较大 |

例如选中并发 4、知识库共 100 篇文档时，会分成 25 批：每批 4 篇并发下载，整批完成后停顿 1 秒，再开始下一批。相比持续打满并发，这种节奏对服务器更友好；相比纯串行（并发 1）也能显著缩短总耗时。

### 导出目录结构

根据语雀知识库的大纲（TOC）自动组织目录：

```text
知识库名称/
├── 文档1.md
├── 章节标题/
│   ├── 文档2.md
│   └── 文档3.md
└── 文档4.md
```

## 技术实现

基于 Chrome Extension Manifest V3，纯 JavaScript，无构建步骤。

```text

.
├── manifest.json      # 扩展配置
├── background.js      # Service Worker，批量导出逻辑
├── content.js         # Content Script，Cookie 代理
├── ui.js              # 浮动面板 UI
├── popup.html         # 工具栏弹窗（提示页）
└── icons/             # 扩展图标
```

### 组件通信

三个组件通过 `chrome.runtime.sendMessage` 通信：

- **Content Script** — 注入语雀页面，读取 `document.cookie`
- **Service Worker** — 获取文档列表、调用导出 API、管理下载
- **UI Panel** — 知识库选择、格式配置、进度展示

### 工作原理

语雀使用 httpOnly Cookie，`chrome.cookies` API 无法访问。扩展通过 Content Script 直接读 `document.cookie`，通过消息传递交给 Service Worker，后者携带 Cookie 调用语雀 API。

1. 获取用户知识库列表 → `GET /api/mine/book_stacks`
2. 对每个选中的知识库，获取文档大纲（解析页面中 `window.appData`）
3. 遍历文档列表，**分批并发**调用导出接口 → `POST /api/docs/{id}/export`（每批并发数由用户设置，批间停顿 1 秒）
4. 等待语雀后台生成完成后下载文件
5. 通过 `chrome.downloads.download()` 保存，保持目录结构

## 常见问题

<details>
<summary>导出失败或 Cookie 为空？</summary>

确认已在当前浏览器登录语雀（`https://www.yuque.com`）。扩展依赖页面 Cookie 进行 API 认证。
</details>

<details>
<summary>可以导出私有知识库吗？</summary>

可以。只要你的账号有权限访问，就能导出。
</details>

<details>
<summary>为什么导出的是 .lake 格式而不是标准 Markdown？</summary>

Lake 是语雀原生格式，如果你需要标准 Markdown，在格式中选择 "Markdown" 即可。
</details>

## 版本号

项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)（`MAJOR.MINOR.PATCH`）：

- **MAJOR**：不兼容的 API / 行为变更
- **MINOR**：向后兼容的新功能（本次 `2.1.0` 即新增分批并发下载）
- **PATCH**：向后兼容的缺陷修复

版本的唯一权威来源是 [`manifest.json`](./manifest.json) 中的 `"version"` 字段，README 顶部的版本徽章与之保持同步。每次发版时同步更新这两处即可。

## 免责声明

本扩展仅供个人学习使用。请遵守语雀服务条款，勿用于商业用途或侵犯他人权益。

## 致谢

感谢语雀团队提供的文档平台。
