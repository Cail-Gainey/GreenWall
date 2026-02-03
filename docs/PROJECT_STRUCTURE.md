# 项目结构说明

## 目录结构

```
GreenWall/
├── .github/                    # GitHub配置
│   └── workflows/
│       └── build.yml          # CI/CD构建流程
│
├── build/                      # 构建输出目录
│   └── bin/                   # 编译后的二进制文件
│
├── docs/                       # 文档目录
│   ├── GITHUB_ACTIONS_SETUP.md # GitHub Actions配置说明
│   ├── PROJECT_STRUCTURE.md    # 项目结构说明（本文件）
│   └── images/                # 文档图片
│
├── frontend/                   # 前端代码
│   ├── src/                   # 源代码
│   │   ├── components/        # React组件
│   │   │   ├── Editor/       # 编辑器核心组件
│   │   │   └── ...           # 其他通用组件
│   │   ├── layouts/           # 页面布局
│   │   ├── i18n.tsx          # 国际化配置
│   │   ├── App.tsx           # 主应用组件
│   │   ├── types.ts          # 类型定义
│   │   └── main.tsx          # 入口文件
│   ├── dist/                  # 构建输出（gitignore）
│   ├── package.json           # 前端依赖
│   └── vite.config.ts        # Vite配置
│
├── logs/                       # 日志目录（gitignore）
│   └── YYYY-MM-DD.log         # 按日期分割的日志
│
├── templates/                  # 代码模板目录
│   └── languages/             # 各编程语言模板实现
│       ├── factory.go         # 模板工厂
│       ├── language_interface.go # 模板接口定义
│       └── [lang].go          # 具体语言模板 (Go, Python, etc.)
│
├── app.go                      # 应用主逻辑 (Wails Binding)
├── github.go                   # GitHub API交互 (仓库管理、分支获取)
├── multi_language.go           # 多语言仓库生成逻辑
├── oauth.go                    # OAuth认证与Token管理
├── logger.go                   # 结构化日志系统
├── main.go                     # 程序入口与Wails初始化
├── open_directory.go           # 跨平台目录操作
├── cmd_*.go                    # 平台特定命令执行
│
├── oauth_config.example.json   # OAuth配置示例
├── oauth_config.json           # OAuth配置（gitignore）
│
├── go.mod                      # Go模块依赖
├── go.sum                      # Go依赖校验
├── wails.json                  # Wails配置
├── Makefile                    # 构建脚本
│
├── .gitignore                  # Git忽略规则
├── LICENSE                     # 开源协议
├── README.md                   # 英文说明
└── README_zh.md                # 中文说明
```

## 核心模块说明

### 后端（Go）

| 文件/目录 | 说明 | 主要功能 |
|------|------|---------|
| `main.go` | 程序入口 | 初始化日志、启动Wails应用、窗口配置 |
| `app.go` | 应用绑定 | 处理前端请求、Git仓库初始化、导入导出逻辑 |
| `multi_language.go` | 生成引擎 | 实现多语言混合生成、权重计算、文件比例控制 |
| `templates/` | 代码模板 | 提供20+种编程语言的模拟代码生成模板 |
| `oauth.go` | OAuth认证 | GitHub登录、Token持久化、用户信息管理 |
| `github.go` | GitHub API | 仓库创建/查找、**自动获取分支列表**、强制推送覆盖 |
| `logger.go` | 日志系统 | 基于Zap的高性能结构化日志 |
| `open_directory.go` | 系统操作 | 跨平台打开文件夹路径 |

### 前端（React + TypeScript）

| 目录/文件 | 说明 |
|----------|------|
| `src/components/Editor/` | 画布、网格、工具栏等编辑器核心组件 |
| `src/components/PushRepoDialog.tsx` | 推送配置对话框（支持分支、隐私、多语言、强制覆盖等） |
| `src/layouts/` | 页面基础布局管理 |
| `src/i18n.tsx` | 强类型国际化翻译系统 |
| `src/types.ts` | 全局 TypeScript 类型定义 |

### 配置文件

| 文件 | 说明 | 是否提交 |
|------|------|---------|
| `oauth_config.json` | OAuth真实配置 | ❌ 不提交（敏感） |
| `oauth_config.example.json` | OAuth示例配置 | ✅ 提交 |
| `wails.json` | Wails配置 | ✅ 提交 |

## 构建流程

### 本地开发
```bash
# 开发模式（实时热更新）
wails dev

# 生产构建
wails build
```

### 功能特性
- **强制覆盖 (Force Push)**：直接重置远程分支历史，确保贡献图精准更新。
- **分支感知**：自动拉取并匹配 GitHub 远程分支（main/master）。
- **多语言混合**：自定义不同模式的文件生成比例，模拟真实开发者行为。
- **防止误操作**：生成前检测本地数据，防止推送空仓库。

## 国际化

支持语言：
- 🇺🇸 English
- 🇨🇳 中文

配置文件：`frontend/src/i18n.tsx` (动态上下文驱动)
