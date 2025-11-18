# Agentlz 前端开发规范

### 注意⚠️
 - 所有前端页面都必须使用 arco-design 组件库。
 - 所有前端页面都必须使用 tailwindcss 样式。
 - 每一个函数都要有对应的**中文**注释，注释中要包含函数的参数、返回值、异常等信息。
 - 注意要 i18n 所有的字符串，包括页面上的文字、按钮等。
 - 代码满足 eslint 规范。
## 1. 概述

本文档旨在为 Agentlz 前端项目提供开发规范，包括页面设计、路由设计和文件结构。前端项目将与 Agentlz 后端服务进行交互，实现 Agent 管理、文档上传与检索等核心功能。

**技术栈**：React 18, TypeScript,tailwindcss, echart, Vite, 管理框架使用 react-admin, 图表使用 echarts,组件使用 arco-design(字节跳动) 必须优先使用 arco-design组件，必要时才使用 material-ui 组件, 图标优先使用 material-ui 图标库。



## 2. 页面设计

根据后端提供的功能和 API 接口，前端需要实现以下主要页面：

### 2.1 认证与用户管理

* **登录页 (`/login`)**：
  * 用户输入用户名/邮箱和密码进行登录。
  * 成功登录后获取 JWT Token 并存储。
  * 提供注册/忘记密码入口（如果后端支持）。
* **注册页 (`/register`)**：
  * 用户注册新账号。
* **个人设置页 (`/settings/profile`)**：
  * 显示当前用户信息。
  * 修改密码、个人资料等。

### 2.2 Agent 管理

* **Agent 列表页 (`/agents`)**：
  * 显示所有可用的 Agent（`check`, `plan`, `tools` 类型）。
  * 提供 Agent 的创建、编辑、删除功能（如果前端需要管理 Agent 配置）。
  * 显示 Agent 的状态、类型、描述等信息。
* **Agent 详情/交互页 (`/agents/:agent_id`)**：
  * 与特定 Agent 进行交互的界面，例如向 `schedule_agent` 提交查询。
  * 展示查询结果，包括 `intermediate_steps`（中间步骤）以提高透明度。
  * 可能包含 Agent 的配置信息和运行日志。

### 2.3 文档管理 (RAG)

* **文档列表页 (`/documents`)**：
  * 显示已上传的文档列表。
  * 显示文档的元数据（如 `doc_id`、文件名、上传时间、状态）。
  * 提供文档的查看、编辑、删除功能。
* **文档上传页 (`/documents/upload`)**：
  * 提供文件上传界面，支持 `multipart/form-data` 方式上传文件。
  * 显示上传进度和结果。
* **文档详情页 (`/documents/:doc_id`)**：
  * 显示单个文档的详细信息。
  * 提供触发文档索引/切分/嵌入的功能。

### 2.4 系统通用页面

* **仪表盘/首页 (`/dashboard` 或 `/`)**：
  * 提供系统概览，例如 Agent 运行状态、文档统计等。
* **健康检查页 (`/health`)**：
  * 显示后端服务的健康状态。
* **多租户选择/切换组件**：
  * 在 UI 中提供租户选择或切换的功能，以便在请求中携带 `X-Tenant-ID`。
* **错误提示组件**：
  * 统一处理后端返回的 `AgentResponse` 错误信息，并以友好的方式展示给用户。

## 3. 路由设计

前端路由应与后端 API 路由保持一定的逻辑对应关系，并考虑认证和权限控制。

```md

/
├── /login
├── /register
├── /dashboard
├── /agents
│   ├── /agents/:agent_id
├── /documents
│   ├── /documents/upload
│   ├── /documents/:doc_id
├── /settings
│   ├── /settings/profile
└── /* (404 Not Found)
```

**路由守卫 (Route Guards)**：

* 所有需要认证的路由（除 `/login`, `/register` 外）都应有认证守卫，检查用户是否已登录且 JWT Token 有效。
* 可能需要权限守卫，根据用户角色和权限控制页面访问。

**API 交互**：

* 前端请求后端 API 时，统一添加 `/v1` 前缀。
* 对于需要认证的请求，在请求头中添加 `Authorization: Bearer <JWT_TOKEN>`。
* 对于多租户场景，在请求头中添加 `X-Tenant-ID: <TENANT_ID>`。
* 统一处理后端返回的 `AgentResponse` 结构，包括成功响应和错误响应。

## 4. 文件结构

以下是一个推荐的前端项目文件结构，旨在提高模块化、可维护性和可扩展性。

```md

src/
├─ admin/                       ← 所有后台相关代码收拢到这里
│  ├─ App.tsx                   ← Admin 根组件（<Admin> 入口）
│  ├─ auth/                     ← 登录/权限相关
│  │  ├─ authProvider.ts
│  │  ├─ LoginPage.tsx
│  │  └─ permissions.ts
│  ├─ data/                     ← 数据层
│  │  ├─ dataProvider.ts        ← 统一 axios 封装
│  │  ├─ httpClient.ts          ← 拦截器、token、错误码
│  │  └─ types/                 ← 全局 DTO
│  │     ├─ user.d.ts
│  │     └─ post.d.ts
│  ├─ layout/                   ← 自定义布局
│  │  ├─ Layout.tsx
│  │  ├─ Menu.tsx
│  │  └─ themes.ts
│  ├─ resources/                ← 每个资源一个文件夹
│  │  ├─ posts/
│  │  │  ├─ index.ts            ← 统一导出 <Resource>
│  │  │  ├─ PostList.tsx
│  │  │  ├─ PostCreate.tsx
│  │  │  ├─ PostEdit.tsx
│  │  │  ├─ PostShow.tsx
│  │  │  ├─ PostForm.tsx        ← 新建+编辑复用表单
│  │  │  └─ postFields.ts       ← 字段配置/校验规则
│  │  ├─ users/
│  │  │  ├─ index.ts
│  │  │  ├─ UserList.tsx
│  │  │  └─ …
│  │  └─ index.ts               ← 自动扫描并注册所有 Resource
│  ├─ components/               ← 跨资源通用组件
│  │  ├─ RichTextInput.tsx
│  │  ├─ ImageUpload.tsx
│  │  └─ BulkExportButton.tsx
│  ├─ i18n/                     ← 国际化
│  │  ├─ i18nProvider.ts
│  │  └─ translations/
│  │     ├─ zh.ts
│  │     └─ en.ts
│  └─ utils/                    ← 小工具
│     ├─ date.ts
│     └─ file.ts
├─ App.tsx                      ← 业务前台（如有）入口
└─ index.tsx                    ← React 根节点

```

## 5. 关键考虑事项

* **认证 (JWT)**：
  * 登录成功后，将 JWT Token 安全地存储在客户端（例如 `localStorage` 或 `sessionStorage`）。
  * 所有需要认证的 API 请求，通过 Axios 拦截器等方式自动在请求头中添加 `Authorization: Bearer <token>`。
  * 实现 Token 过期刷新机制（如果后端支持）。
* **多租户 (X-Tenant-ID)**：
  * 在用户登录后或选择租户后，将 `tenant_id` 存储在状态管理中。
  * 通过 Axios 拦截器等方式，自动在所有 API 请求头中添加 `X-Tenant-ID: <tenant_id>`。
* **统一错误处理**：
  * 后端返回统一的 `AgentResponse` 错误结构，前端应有一个全局的错误处理机制。
  * 例如，使用 Toast 或 Modal 组件显示错误消息，并根据错误码进行特定处理（如 401 未授权则跳转登录页）。
* **加载状态与用户反馈**：
  * 对于所有异步操作（如 API 请求），应提供加载指示器（Loading Spinner）和友好的用户反馈。
* **表单验证**：
  * 所有用户输入表单都应进行前端验证，并结合后端 Pydantic 模型的验证规则。
* **响应式设计**：
  * 考虑不同设备（桌面、平板、移动）的显示效果，采用响应式布局。
* **代码规范**：
  * 遵循 ESLint 和 Prettier 规范，保持代码风格一致性。
  * 使用 TypeScript 进行类型检查，提高代码健壮性。

## 6. 后续工作

* 详细定义每个页面的 UI 元素和交互逻辑。
* 根据实际需求，细化状态管理方案。
* 编写单元测试和集成测试。
* 持续与后端团队沟通，确保接口一致性。
