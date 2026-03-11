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

# agents

## PUT 设置允许的 MCP 列表

PUT /v1/agents/6/mcp/allow

> Body 请求参数

```json
{
  "mcp_agent_ids": [
    23,
    45
  ]
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |none|
|X-Tenant-ID|header|string| 是 |none|
|Content-Type|header|string| 是 |none|
|body|body|object| 是 |none|
|» mcp_agent_ids|body|[integer]| 是 |none|

> 返回示例

> 200 Response

```json
{}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## PUT 设置排除的 MCP 列表

PUT /v1/agents/4/mcp/exclude

> Body 请求参数

```json
{
  "mcp_agent_ids": [
    23
  ]
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |none|
|X-Tenant-ID|header|string| 是 |none|
|Content-Type|header|string| 是 |none|
|body|body|object| 是 |none|
|» mcp_agent_ids|body|[integer]| 是 |none|

> 返回示例

> 200 Response

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "data": {
    "agent_id": 4,
    "affected": 1,
    "mode": "EXCLUDE"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## DELETE 恢复默认 MCP 配置

DELETE /v1/agents/6/mcp/reset

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|Authorization|header|string| 是 |none|
|X-Tenant-ID|header|string| 是 |none|

> 返回示例

> 200 Response

```json
{}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

# 数据模型

