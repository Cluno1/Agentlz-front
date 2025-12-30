---
title: Agentlz接口
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
code_clipboard: true
highlight_theme: darkula
headingLevel: 2
generator: "@tarslib/widdershins v4.0.30"

---

# Agentlz接口

Base URLs:

# Authentication

# MCP管理

## POST 上传共享MCP

POST /v1/mcp

> Body 请求参数

```json
{
  "name": "PDF_Parser(system)",
  "transport": "stdio",
  "command": "python",
  "args": [
    "-m",
    "pdf_tool"
  ],
  "description": "解析并抽取 PDF 文本内容",
  "category": "document",
  "trust_score": 60.5
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|type|query|string| 是 |none|
|Authorization|header|string| 是 |none|
|Content-Type|header|string| 是 |none|
|body|body|object| 是 |none|
|» name|body|string| 是 |none|
|» transport|body|string| 是 |none|
|» command|body|string| 是 |none|
|» args|body|[string]| 是 |none|
|» description|body|string| 是 |none|
|» category|body|string| 是 |none|
|» trust_score|body|number| 是 |none|

> 返回示例

> 200 Response

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "data": {
    "id": 167,
    "name": "PDF_Parser(system)",
    "transport": "stdio",
    "command": "python",
    "args": [
      "-m",
      "pdf_tool"
    ],
    "category": "document",
    "trust_score": 60.5,
    "description": "解析并抽取 PDF 文本内容"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## GET 列表查询

GET /v1/mcp

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|type|query|string| 是 |none|
|page|query|string| 是 |none|
|per_page|query|string| 是 |none|
|sort|query|string| 是 |none|
|order|query|string| 是 |none|
|q|query|string| 是 |none|
|Authorization|header|string| 是 |none|
|X-Tenant-ID|header|string| 是 |none|

> 返回示例

> 200 Response

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "data": {
    "rows": [
      {
        "id": 167,
        "name": "PDF_Parser(system)",
        "transport": "stdio",
        "command": "python",
        "args": [
          "-m",
          "pdf_tool"
        ],
        "category": "document",
        "trust_score": 60.5,
        "description": "解析并抽取 PDF 文本内容"
      },
      {
        "id": 118,
        "name": "notion-mcp-server",
        "transport": "http",
        "command": "http",
        "args": {
          "mcpServers": {
            "notion-mcp-server": {
              "type": "http",
              "url": "https://mcp.notion.com/mcp"
            }
          }
        },
        "category": "官方",
        "trust_score": 80,
        "description": "Official Notion MCP Server with OAuth-based remote hosting."
      },
      {
        "id": 86,
        "name": "context7",
        "transport": "http",
        "command": "http",
        "args": {
          "mcpServers": {
            "context7": {
              "type": "http",
              "url": "https://mcp.context7.com/mcp"
            }
          }
        },
        "category": "开发",
        "trust_score": 74,
        "description": "Context7 MCP Server -- Up-to-date code documentation for LLMs and AI code editors"
      },
      {
        "id": 85,
        "name": "github",
        "transport": "http",
        "command": "http",
        "args": {
          "mcpServers": {
            "github": {
              "type": "http",
              "url": "https://api.githubcopilot.com/mcp/"
            }
          }
        },
        "category": "开发",
        "trust_score": 80,
        "description": "GitHub MCP Server connects AI tools to GitHub for code management and automation."
      },
      {
        "id": 84,
        "name": "valuecell",
        "transport": "stdio",
        "command": "docker",
        "args": {
          "mcpServers": {
            "valuecell": {
              "command": "docker",
              "args": [
                "run",
                "--rm",
                "-i",
                "ghcr.io/ValueCell-ai/valuecell:latest"
              ]
            }
          }
        },
        "category": "金融",
        "trust_score": 80,
        "description": "Valuecell is a Python-based project licensed under Apache 2.0."
      },
      {
        "id": 83,
        "name": "awesome-llm-apps",
        "transport": "stdio",
        "command": "docker",
        "args": {
          "mcpServers": {
            "awesome-llm-apps": {
              "command": "docker",
              "args": [
                "run",
                "--rm",
                "-i",
                "ghcr.io/Arindam200/awesome-llm-apps:latest"
              ]
            }
          }
        },
        "category": "开发",
        "trust_score": 80,
        "description": "Collection of LLM Applications"
      },
      {
        "id": 82,
        "name": "GhidraMCP",
        "transport": "stdio",
        "command": "docker",
        "args": {
          "mcpServers": {
            "GhidraMCP": {
              "command": "docker",
              "args": [
                "run",
                "--rm",
                "-i",
                "ghcr.io/LaurieWired/GhidraMCP:latest"
              ]
            }
          }
        },
        "category": "开发",
        "trust_score": 80,
        "description": "GhidraMCP is a Model Context Protocol server for LLMs."
      },
      {
        "id": 81,
        "name": "browser-tools-mcp",
        "transport": "stdio",
        "command": "docker",
        "args": {
          "mcpServers": {
            "browser-tools-mcp": {
              "command": "docker",
              "args": [
                "run",
                "--rm",
                "-i",
                "ghcr.io/AgentDeskAI/browser-tools-mcp:latest"
              ]
            }
          }
        },
        "category": "开发",
        "trust_score": 80,
        "description": "A browser monitoring tool enhancing AI applications via MCP for data analysis."
      },
      {
        "id": 80,
        "name": "higress",
        "transport": "stdio",
        "command": "docker",
        "args": {
          "mcpServers": {
            "higress": {
              "command": "docker",
              "args": [
                "run",
                "--rm",
                "-i",
                "ghcr.io/alibaba/higress:latest"
              ]
            }
          }
        },
        "category": "开发",
        "trust_score": 80,
        "description": "Higress is an AI Native API Gateway designed for efficient API management."
      },
      {
        "id": 79,
        "name": "git-mcp",
        "transport": "stdio",
        "command": "docker",
        "args": {
          "mcpServers": {
            "git-mcp": {
              "command": "docker",
              "args": [
                "run",
                "--rm",
                "-i",
                "ghcr.io/idosal/git-mcp:latest"
              ]
            }
          }
        },
        "category": "开发",
        "trust_score": 80,
        "description": "GitMCP is a tool for managing Git repositories with enhanced features."
      }
    ],
    "total": 66
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## GET 根据关键词搜索 MCP

GET /v1/mcp/search

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|q|query|string| 是 |none|
|k|query|string| 是 |none|
|Authorization|header|string| 是 |none|
|X-Tenant-ID|header|string| 是 |none|

> 返回示例

> 200 Response

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": 166,
      "name": "PDF_Parser（tenant）",
      "transport": "stdio",
      "command": "python",
      "description": "解析并抽取 PDF 文本内容",
      "trust_score": 60.5,
      "sem_score": 0.7443558726098627,
      "total_score": 0.6812839220511756
    },
    {
      "id": 167,
      "name": "PDF_Parser(system)",
      "transport": "stdio",
      "command": "python",
      "description": "解析并抽取 PDF 文本内容",
      "trust_score": 60.5,
      "sem_score": 0.7443558726098627,
      "total_score": 0.6812839220511756
    },
    {
      "id": 35,
      "name": "markitdown",
      "transport": "stdio",
      "command": "docker",
      "description": "Python tool for converting files and office documents to Markdown.",
      "trust_score": 80,
      "sem_score": 0.6420890902227717,
      "total_score": 0.6778801812004945
    },
    {
      "id": 38,
      "name": "semantic-kernel",
      "transport": "stdio",
      "command": "docker",
      "description": "Integrate cutting-edge LLM technology quickly and easily into your apps",
      "trust_score": 80,
      "sem_score": 0.5797915113096539,
      "total_score": 0.6218123601786885
    },
    {
      "id": 37,
      "name": "context7",
      "transport": "stdio",
      "command": "docker",
      "description": "Context7 MCP Server -- Up-to-date code documentation for LLMs and AI code editors",
      "trust_score": 80,
      "sem_score": 0.5458324496945799,
      "total_score": 0.5912492047251219
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## GET 查询详情

GET /v1/mcp/167

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |none|
|X-Tenant-ID|header|string| 是 |none|

> 返回示例

> 200 Response

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "data": {
    "id": 167,
    "name": "PDF_Parser(system)",
    "transport": "stdio",
    "command": "python",
    "args": [
      "-m",
      "pdf_tool"
    ],
    "category": "document",
    "trust_score": 60.5,
    "description": "解析并抽取 PDF 文本内容",
    "tenant_id": "system",
    "created_by_id": 131139
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## DELETE 删除 MCP

DELETE /v1/mcp/167

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |none|
|X-Tenant-ID|header|string| 是 |none|

> 返回示例

> 200 Response

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "data": {
    "id": 167,
    "name": "PDF_Parser(system)",
    "transport": "stdio",
    "command": "python",
    "args": [
      "-m",
      "pdf_tool"
    ],
    "category": "document",
    "trust_score": 75,
    "description": "新的描述"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

# 数据模型

