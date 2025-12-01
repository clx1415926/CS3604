# 后端源代码（注册功能桩）

此目录包含一个最小可运行的 Express 服务器（server.js），对齐 `.artifacts/api_interface.yml` 端点：

- GET /api/v1/users/username/check
- GET /api/v1/users/phone/check
- POST /api/v1/registration/sessions
- PATCH /api/v1/registration/sessions/:session_id/account
- POST /api/v1/registration/sessions/:session_id/sms/send
- POST /api/v1/registration/sessions/:session_id/sms/verify
- POST /api/v1/registration/sessions/:session_id/identity/verify
- POST /api/v1/registration/sessions/:session_id/terms
- POST /api/v1/registration/sessions/:session_id/complete
- GET /api/v1/terms/links

说明：当前实现为内存态模拟，便于对接测试；后续可替换为数据库与真实第三方服务。

本地运行（可选）：
1. 安装依赖：npm i express
2. 启动：node backend/src/server.js
3. 基础 URL：http://localhost:8080/api/v1

预览端口与 API Base 说明：
- 前端预览（开发服务器）默认使用 8081 端口。
- 若需与前端保持同端口（8081），可在启动后端前设置环境变量 PORT=8081：
  - Windows PowerShell：`$env:PORT=8081; node backend/src/server.js`
  - macOS/Linux：`PORT=8081 node backend/src/server.js`
- 统一之后的 API Base 为：`http://localhost:8081/api/v1`