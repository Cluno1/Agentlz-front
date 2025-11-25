# rag接口总览

- 基础路径与标签： /v1 ，标签 documents （见 agentlz/app/routers/document.py:12 ）
- RAG 文档相关端点：
  - GET /v1/rag/{doc_id} 查询单文档（ agentlz/app/routers/document.py:15 ）
  - PUT /v1/rag/{doc_id} 更新文档（ agentlz/app/routers/document.py:24 ）
  - DELETE /v1/rag/{doc_id} 删除文档（ agentlz/app/routers/document.py:34 ）
  - GET /v1/rag/{doc_id}/download 文档下载（ agentlz/app/routers/document.py:44 ）
  - GET /v1/rag 文档列表（分页、排序、搜索、类型切换）（ agentlz/app/routers/document.py:54 ）
  - POST /v1/rag 创建文档（ agentlz/app/routers/document.py:80 ）
鉴权与租户

- 必需头： Authorization: Bearer <token> （全部接口依赖 require_auth ， agentlz/app/routers/document.py:16,25,35,45,57,85 ）
- 必需头： X-Tenant-ID: <tenant_id> （全部接口通过 require_tenant_id 解析， agentlz/app/routers/document.py:17,26,36,46,66,100 ）
- 管理员限制：
  - 更新、删除端点在路由层强制管理员（ require_admin ， agentlz/app/routers/document.py:27,37 ）
  - 创建端点当前实现未强制管理员，仅需认证（尽管路由注释写“需要管理员权限”，参考实现为仅认证， agentlz/app/routers/document.py:86 与服务层 create_document_service ， agentlz/services/document_service.py:571 ）
公共响应

- 统一响应模型 Result （ agentlz/schemas/responses.py:4 ）：
  - 成功： {"success": true, "code": 0, "message": "ok", "data": ...}
  - 失败： {"success": false, "code": <非0>, "message": "<错误信息>", "data": <可选>}
- 常见错误码与状态：
  - 401 未认证或无法获取用户信息（服务层做 claims["sub"] 校验，例见 agentlz/services/document_service.py:307,348,394,584 ）
  - 403 无权限（访问/更新/删除权限校验， agentlz/services/document_service.py:316,362,409 ）
  - 404 资源不存在（路由层抛出，例见 agentlz/app/routers/document.py:20,30,40,49 ）
  - 400 参数或类型错误（例：文档类型不支持， agentlz/services/document_service.py:590 ）
端点详情

- GET /v1/rag/{doc_id} （查询单文档）
  
  - 路由位置： agentlz/app/routers/document.py:15
  - 入参：
    - 路径参数： doc_id （字符串）
    - 头： Authorization 、 X-Tenant-ID
  - 权限：服务层按规则放行（system 文档、上传者本人、 user_doc_permission 有 admin/read 、同租户管理员，见 agentlz/services/document_service.py:164-221 ）
  - 出参： Result.data = DocumentItem （字段示例见仓储查询列）
    - 字段： id, tenant_id, uploaded_by_user_id, status, upload_time(字符串), title, content, type, tags, description, meta_https, save_https （ agentlz/repositories/document_repository.py:98-100 ）
  - 说明： upload_time 统一转为字符串（ agentlz/services/document_service.py:318-320 ）
- PUT /v1/rag/{doc_id} （更新文档）
  
  - 路由位置： agentlz/app/routers/document.py:24
  - 入参：
    - 路径参数： doc_id
    - 头： Authorization 、 X-Tenant-ID
    - Body： DocumentUpdate （ agentlz/schemas/document.py:16-20 ）
      - 可选字段： uploaded_by_user_id, status, title, content
    - 权限：路由需管理员（ require_admin ），服务层再校验“上传者本人 / 有 admin/write 权限 / 同租户管理员”（ agentlz/services/document_service.py:225-275 ）
  - 出参： Result.data = 更新后的记录 （包含同查询列； upload_time 字符串化， agentlz/services/document_service.py:366-368 ）
  - 允许更新列： uploaded_by_user_id, status, title, content, type, tags, description, meta_https （仓储白名单， agentlz/repositories/document_repository.py:198-208 ）
  - 说明： tags 在仓储层被处理为逗号分隔字符串（ agentlz/repositories/document_repository.py:214-221 ）
- DELETE /v1/rag/{doc_id} （删除文档）
  
  - 路由位置： agentlz/app/routers/document.py:34
  - 入参：
    - 路径参数： doc_id
    - 头： Authorization 、 X-Tenant-ID
    - 权限：路由需管理员；服务层同“更新”权限校验（ agentlz/services/document_service.py:404-410 ）
  - 出参： Result.data = {} （删除成功），否则 404（ agentlz/app/routers/document.py:41 ）
  - 删除实现：租户隔离删除（ agentlz/repositories/document_repository.py:246-252 ）
- GET /v1/rag/{doc_id}/download （下载文档）
  
  - 路由位置： agentlz/app/routers/document.py:44
  - 入参：
    - 路径参数： doc_id
    - 头： Authorization 、 X-Tenant-ID
  - 权限：同“查询单文档”规则
  - 出参： text/plain 响应体； Content-Disposition: attachment; filename="<title>.txt" （ agentlz/app/routers/document.py:51 ）
    - 内容来源： content 字符串与文件名由 title 派生，默认 document.txt （ agentlz/services/document_service.py:432-434 ）
- GET /v1/rag （分页列表）
  
  - 路由位置： agentlz/app/routers/document.py:54
  - 入参（Query）：
    - page 默认 1， >=1 （ agentlz/app/routers/document.py:58 ）
    - per_page 默认 10， 1..100 （ agentlz/app/routers/document.py:59 ）
    - sort 默认 id ，允许值映射： id, tenantId, uploadedBy, uploadedByUserId, status, uploadTime, title （ agentlz/repositories/document_repository.py:31-41 ）
    - order 默认 DESC ，值： ASC|DESC （ agentlz/app/routers/document.py:61 ）
    - q 可选，模糊匹配 title 或 content （ agentlz/repositories/document_repository.py:71-73 ）
    - type 默认 self ，值： system|self|tenant （ agentlz/app/routers/document.py:63 ）
  - 权限与数据范围（服务层， agentlz/services/document_service.py:470-537 ）：
    - system ：返回 tenant_id='system' 的文档（无需额外权限）
    - self ：返回 tenant_id='default' 且 uploaded_by_user_id = 当前用户 的文档（自定义 SQL， agentlz/services/document_service.py:27-80 ）
    - tenant ：
      - 若用户是 admin ：返回该租户全部文档
      - 若非 admin ：仅返回用户在 user_doc_permission 中有 admin/read 权限的文档（联表查询， agentlz/services/document_service.py:82-145 ）
  - 出参： Result.data = {"rows": [...], "total": <int>} （ agentlz/app/routers/document.py:77 ）
    - 行字段包含： id, tenant_id, uploaded_by_user_id, status, upload_time(字符串), title, content, type, tags, description, meta_https, save_https （ agentlz/repositories/document_repository.py:79-91 ）
- POST /v1/rag （创建文档）
  
  - 路由位置： agentlz/app/routers/document.py:80
  - 入参：
    - 头： Authorization 、 X-Tenant-ID
    - Query： type （ system|self|tenant ，当前服务实现未使用该枚举控制创建行为）
    - Body： payload （JSON，见服务层约定， agentlz/services/document_service.py:556-567 ）
      - 必填建议： document （原始内容或文件数据）、 document_type （文件类型，支持： pdf, doc, docx, md, txt, ppt, pptx, xls, xlsx, csv ， agentlz/services/document_service.py:587-590 ）、 title
      - 可选： uploaded_by_user_id （缺省则用当前用户， agentlz/services/document_service.py:606-609 ）、 tags （列表或字符串）、 description 、 meta_https
    - 内容处理：后端会将 document 解析为 Markdown 并写入 content （ agentlz/services/document_service.py:599-605 ）
  - 出参： Result.data = 新建记录 （包含 upload_time 字符串化， agentlz/services/document_service.py:630-632 ）
  - 说明与当前行为差异：
    - 路由注释“需要管理员权限”，但实现仅需认证；创建后自动为当前用户写入该文档的 admin 权限（ agentlz/services/document_service.py:613-624 ）
    - payload.document_type 被写入数据库列 type （文件类型）；与列表查询中的 type 参数（ system|self|tenant ）语义不同，避免混淆
数据表结构（建表）

- 文档表 document （ docs/deploy/sql/init_mysql.sql:82-100 ）
  - 列： id, tenant_id, uploaded_by_user_id, status, upload_time, title, content, disabled, type, tags, description, meta_https, save_https
  - 索引： tenant_id 、 uploaded_by_user_id 、组合索引 tenant_id + status
- 权限表 user_doc_permission （ docs/deploy/sql/init_mysql.sql:108-123 ）
  - 列： id, user_id, doc_id, perm(admin|read|write|none), created_at
  - 唯一键： (user_id, doc_id) ；与服务层权限判定配合（ agentlz/services/document_service.py:200-210,256-264 ）
前端对接要点

- 统一头：在所有请求添加 Authorization 与 X-Tenant-ID
- 列表分页与排序：仅使用允许的排序键； order 使用 ASC|DESC
- 类型切换：
  - 列表 type 为数据范围选择（ system|self|tenant ），与文档行的 type （文件类型）不同
- 创建文档：
  - 传 document_type 与 document ，后端生成 content （Markdown）
  - 若未传 uploaded_by_user_id ，后端默认为当前用户，并创建 admin 权限
- 下载端点返回纯文本与附件头；文件名由 title 加 .txt
- 错误处理：基于统一 Result ；HTTP 状态错误时 body 仍为 Result 风格，注意读取 message/code