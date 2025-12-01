# 运行与预览端口说明

为了方便前后端联调与 IDE 内嵌预览，本项目推荐统一使用 8081 作为预览端口：

- 前端预览端口：8081
- 后端 API Base：`http://localhost:8081/api/v1`

如何启动后端以使用 8081：

- Windows PowerShell：
  - 设置端口并启动：`$env:PORT=8081; node backend/src/server.js`
- macOS/Linux：
  - 设置端口并启动：`PORT=8081 node backend/src/server.js`

默认后端端口为 8080；若前端预览使用 8081，请按上述方式调整后端端口以保持一致。

提示：自动化测试（`backend/test/*.test.js`）会在随机端口启动后端，不受上述端口配置影响。