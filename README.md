# agentlz-front

## Installation

Install the application dependencies by running:

```sh
npm install
```

## Development

Start the application in development mode by running:

```sh
npm run dev
```

## Production

Build the application in production mode by running:

```sh
npm run build
```



## 项目目标:对接后端

#### 注意⚠️
 - 所有前端页面都必须使用 arco-design 组件库。//"@arco-design/web-react": "^2.66.8",
 - 所有前端页面都必须使用 tailwindcss 样式。
 - 每一个函数都要有对应的**中文**注释，注释中要包含函数的参数、返回值、异常等信息。
 - 注意要 i18n 所有的字符串，包括页面上的文字、按钮等。
 - 代码满足 eslint 规范。
## 1. 概述

本文档旨在为 Agentlz 前端项目提供开发规范，包括页面设计、路由设计和文件结构。前端项目将与 Agentlz 后端服务进行交互，实现 Agent 管理、文档上传与检索等核心功能。

**技术栈**：React 18, TypeScript,tailwindcss, echart, Vite, 管理框架使用 react-admin, 图表使用 echarts,组件使用 arco-design(字节跳动) 必须优先使用 arco-design组件，必要时才使用 material-ui 组件, 图标优先使用 material-ui 图标库。





## 参考 - 开发规范（企业后端 / LangChain）

本规范面向企业级后端服务，目标是提供一个通过 HTTPS 暴露接口的 Agent 平台。企业可在平台上开发/托管 Agent，上传企业文档并进行检索增强（RAG），基础存储采用 MySQL（结构化/元数据）与 PostgreSQL（向量存储，基于 pgvector）。本规范约束架构分层、编码方式、安全与合规、API 设计、测试与运维等方面，确保可维护、可扩展与可审计。

### 当前目标

1. **Agent 即服务 (Agent as a Service)**: 企业用户可以在本平台开发 `check`, `plan`, `tools` 类型的 Agent。这些 Agent 都通过 MCP (Multi-Agent Communication Protocol) 协议开放接口，可以被其他 Agent 远程调用，实现类似插件的模式。

2. **智能调度 Agent (Intelligent Schedule Agent)**: 开发一个总调度 Agent (`schedule_agent`)，它作为整个系统的“智能指挥官”。这个 Agent 开放 FastAPI 接口，其核心逻辑由一个强大的 LLM 和一个精心设计的“主提示词 (Master Prompt)”驱动，而非固定的代码流程。

### 智能调度 Agent 的核心工作流

```mermaid


graph TD
    A[用户输入] -->Q[RAG];
    Q--> B[plan_agent<br/>生成执行计划];

    P[mcp 可信度表] -->B;
    B --> P;

    B -- 超过最大循环限制 --> M[输出最终答案给用户];

    subgraph execute_agent [**execute agent 执行器**]
        direction LR
        C[接收计划] --> D[遍历计划步骤];
        D --> E{还有未执行步骤?};
        E -- 是 --> F[调用 tools agent];
        F --> H[ 调用 check agent];
        H --> I{验证通过?};
        I -- 通过 --> D;
        I -- 不通过 --> J{可重试/换工具?};
        J -- 是 --> F;
        J -- 否 --> K[返回执行失败];
           
    E -- 否 --> L[汇总结果];  
    L --> O[调用 check agent]; 
    
        
    end

    B --> C;
    K -- 失败 --> B;
    O -- 否 --> B;
    O -- 是 --> M[输出最终答案给用户];
    
``
