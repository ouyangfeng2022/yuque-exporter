# 语雀知识库批量导出工具

[![Chrome Extension](https://img.shields.io/badge/Chrome-浏览器扩展-blue.svg)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

一款 Chrome 浏览器扩展，用于批量导出语雀知识库文档。零配置，无需手动复制 Token，安装即用。

## ✨ 功能特点

- **零配置** - 无需手动获取 Token 或 API 密钥
- **即开即用** - 安装扩展后，在语雀页面自动显示导出面板
- **批量导出** - 一键导出整个知识库的所有文档（语雀原生仅支持单篇导出）
- **多种格式** - 支持语雀原生的五种导出格式
- **目录保持** - 根据文档大纲自动组织文件目录

### 📄 支持的导出格式

本扩展调用语雀官方导出接口，支持语雀原生的全部五种导出格式：

| 格式 | 说明 | 扩展名 |
|------|------|--------|
| **Markdown** | 标准 Markdown 格式，适合程序员和笔记爱好者 | `.md` |
| **语雀 Lake** | 语雀原生格式，完整保留语雀特有语法 | `.lake` |
| **Word** | Microsoft Word 文档格式，便于编辑和分享 | `.docx` |
| **PDF** | 便携式文档格式，适合打印和归档 | `.pdf` |
| **JPG** | 图片格式，适合快速预览和分享 | `.jpg` |

> 💡 **核心价值**：语雀本身支持导出文档，但只能逐篇手动导出。本扩展实现了自动化批量导出，让你可以一键导出整个知识库中的所有文档，导出格式和质量与语雀原生导出完全一致。

## 🚀 安装方法

### 开发者模式安装（本地加载）

1. 下载或克隆本项目到本地
2. 打开 Chrome 浏览器，地址栏输入 `chrome://extensions/`（Edge 浏览器输入 `edge://extensions/`）
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择本项目根目录

安装完成后，扩展图标会出现在浏览器工具栏。

## 📖 使用方法

### 界面预览

| 初始状态 | 加载知识库后 |
|:---:|:---:|
| ![浮窗面板](assets/image1.png) | ![知识库列表](assets/image2.png) |

### 批量导出知识库

1. 打开任意语雀页面（需已登录语雀）
2. 页面右上角会自动出现浮动导出面板
3. 点击「加载知识库」按钮，获取所有知识库列表
4. 勾选要导出的知识库（支持全选）
5. 选择导出格式（Markdown / Lake / Word / PDF / JPG）
6. 根据需要调整导出选项
7. 点击「批量导出」按钮，等待完成

### 导出选项

**Markdown 格式选项：**
- **LaTeX** - 导出 LaTeX 公式为 Markdown 语法
- **锚点** - 保持语雀的锚点链接
- **换行** - 保持语雀的换行格式
- **MDAI** - 导出 PlantUML 等额外卡片内容

**PDF 格式选项：**
- **导出大纲** - 在 PDF 中包含文档大纲

## 🛠️ 技术架构

本扩展基于 Chrome Extension Manifest V3 开发：

```
├── manifest.json      # 扩展配置文件
├── popup.html         # 扩展弹出窗口（提示页面）
├── background.js      # 后台服务（批量导出核心逻辑）
├── content.js         # 内容脚本（Cookie 代理）
├── ui.js              # 浮动面板 UI（用户交互界面）
└── icons/             # 扩展图标
```

### 核心组件

- **Content Script** - 注入到语雀页面，读取 Cookie 信息
- **Background Worker** - 处理批量导出，调用语雀 API
- **UI Panel** - 浮动面板，提供知识库选择和导出控制

## 🔧 工作原理

由于语雀使用 httpOnly Cookie，Chrome 的 `chrome.cookies` API 无法直接访问。本扩展通过以下方式解决：

1. Content Script 直接读取 `document.cookie`
2. 通过消息传递机制将 Cookie 发送给 Background Worker
3. Background Worker 使用 Cookie 调用语雀官方导出接口
4. 遍历知识库文档列表，逐个调用语雀导出 API
5. 下载并保存导出的文件，保持原始目录结构

> ⚠️ **注意**：本扩展仅自动化了批量导出流程，实际导出过程由语雀官方接口完成，导出质量与语雀原生导出完全一致。

## 📁 导出结构

导出的文件会保持原始的目录结构，根据文档大纲生成对应文件夹：

```
知识库名称/
├── 文档1.md
├── 章节标题/
│   ├── 文档2.md
│   └── 文档3.md
└── 文档4.md
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 感谢语雀团队提供的优秀文档平台
- 感谢所有贡献者的支持

## ⚠️ 免责声明

本扩展仅供个人学习和研究使用，请尊重语雀的版权和服务条款。请勿用于商业用途或侵犯他人权益。

---

**如果这个项目对你有帮助，请给个 Star ⭐ 支持一下！**
