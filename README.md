# Lix - AI PDF Manager

一个基于 Electron 的桌面应用程序，让你在文件树中管理 PDF 文件，并通过 AI 助手与 PDF 内容进行交互。

## 功能特性

- 📁 **文件树管理** - 浏览本地文件夹，直观的树形结构展示
- 📄 **PDF 预览** - 内置 PDF 查看器，支持翻页和缩放
- 🤖 **AI 对话** - 集成 OpenAI API，基于 PDF 内容进行智能问答
- 🎨 **现代 UI** - 基于 shadcn/ui 组件库，精美的深色/浅色主题

## 技术栈

- **构建工具**: Vite + Electron
- **前端框架**: React + TypeScript
- **UI 组件库**: shadcn/ui (Radix UI + Tailwind CSS)
- **PDF 查看器**: react-pdf
- **LLM 集成**: OpenAI API
- **状态管理**: Zustand

## 安装

### macOS

1. 下载 `Lix-0.1.0.dmg`
2. 双击打开 DMG 文件
3. 将 Lix 拖拽到 Applications 文件夹
4. 在 Applications 中找到 Lix 并启动

### Windows

1. 下载 `Lix-0.1.0-win.zip`
2. 解压 zip 文件到任意目录
3. 运行解压目录中的 `Lix.exe`

### Linux

1. 下载 `Lix-0.1.0.AppImage`
2. 添加执行权限：
   ```bash
   chmod +x Lix-0.1.0.AppImage
   ```
3. 运行：
   ```bash
   ./Lix-0.1.0.AppImage
   ```

### 从源码构建

#### 环境要求

- Node.js >= 18
- pnpm >= 8

#### 安装依赖

```bash
pnpm install
```

#### 开发模式

```bash
pnpm dev
```

应用将在开发模式下启动，包含热重载功能。

#### 构建应用

```bash
pnpm build
```

#### 打包分发

```bash
# 打包当前平台
pnpm dist

# 打包所有平台（需要对应平台环境）
pnpm dist --mac --win --linux
```

## 项目结构

```
Lix/
├── electron/              # Electron 主进程和预加载脚本
│   ├── main.ts           # 主进程入口
│   ├── preload.ts        # 预加载脚本
│   └── tsconfig.json     # TypeScript 配置
├── src/
│   ├── components/       # React 组件
│   │   ├── ui/          # shadcn/ui 基础组件
│   │   ├── sidebar/     # 文件树组件
│   │   ├── pdf-viewer/  # PDF 查看器组件
│   │   └── chat/        # 聊天面板组件
│   ├── stores/          # Zustand 状态管理
│   ├── lib/             # 工具函数和 API 封装
│   ├── App.tsx          # 主应用组件
│   └── main.tsx         # 应用入口
├── package.json
├── vite.config.ts       # Vite 配置
├── tailwind.config.ts   # Tailwind CSS 配置
└── tsconfig.json        # TypeScript 配置
```

## 使用说明

### 1. 选择文件夹

点击左侧边栏的文件夹图标，选择包含 PDF 文件的本地文件夹。

### 2. 浏览和打开 PDF

在文件树中点击任意 PDF 文件，即可在中间预览区打开。

### 3. PDF 导航

- 使用工具栏的左右箭头按钮翻页
- 使用 +/- 按钮或点击百分比调整缩放级别
- 查看当前页码和总页数

### 4. AI 对话

1. 首次使用时点击 "Set API Key" 设置 OpenAI API Key
2. 在输入框中输入问题，AI 将基于当前 PDF 内容回答
3. 点击 "+" 按钮可以清空对话历史

## 配置

### OpenAI API Key

API Key 会安全存储在本地配置文件中：
- Windows: `%APPDATA%/lix/config.json`
- macOS: `~/Library/Application Support/lix/config.json`
- Linux: `~/.config/lix/config.json`

## 许可证

MIT
