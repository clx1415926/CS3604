# 登录接口测试报告

本报告基于 `backend/test/login.test.js` 集成测试结果生成，测试覆盖接口：登录、会话、退出、二维码登录、维护窗口。

## 测试环境
- Node.js + Express 本地桩服务（端口：8080）
- 预置账户：
  - 用户名：`testuser123` / 密码：`Password123!`
  - 手机号：`13812345678` / 密码：`Password123!`
  - 邮箱：`user@example.com` / 密码：`Password123!`

## 用例摘要与结果
| 用例 | 说明 | 结果 |
|---|---|---|
| 用户名密码登录成功 | `/auth/login` 正常登录 | 通过 |
| 获取会话状态成功 | `/auth/session` 返回会话信息 | 通过 |
| 非活跃超时会话过期 | `x-nonactive-minutes` 模拟过期 | 通过 |
| 手机号密码登录成功 | `/auth/login` phone 格式自动识别 | 通过 |
| 邮箱密码登录成功 | `/auth/login` email 格式自动识别 | 通过 |
| 错误密码导致失败 | 返回 `INVALID_CREDENTIALS` | 通过 |
| 维护窗口禁止登录 | `x-simulate-maintenance` 强制维护 | 通过 |
| 二维码登录流程 | 生成/轮询/确认 | 通过 |
| 退出登录成功 | `/auth/logout` 成功 | 通过 |

## 结论
- 共 23 项测试全部通过，接口行为与 `.artifacts/api_interface.yml` 的参数与响应格式一致。
- 错误码覆盖：`LOGIN_IDENTIFIER_INVALID_FORMAT`、`PASSWORD_REQUIRED`、`INVALID_CREDENTIALS`、`ACCOUNT_LOCKED`、`SESSION_EXPIRED`、`MAINTENANCE_WINDOW`、`QR_EXPIRED`。

## 后续建议
- 衔接真实存储与密码加密（目前为演示桩）。
- 增加速率限制与审计日志完善，提升并发与安全性。