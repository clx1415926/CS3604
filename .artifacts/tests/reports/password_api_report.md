# 找回/修改密码 API 测试报告

本报告基于 `.artifacts/tests/api/password_api_tests.yml` 的用例集与 `backend/test/password.test.js` 的自动化执行结果整理。

## 测试环境
- 本地后端：`node backend/src/server.js`
- 测试框架：`jest` + `supertest`

## 接口与结果概览
1. 手机找回
   - POST /auth/password/phone/request：成功返回 `status=sent` 与 `ttl_minutes=5`；支持维护窗口阻断（503）、身份证不匹配（422, PHONE_ID_MISMATCH）、速率限制（429, SMS_TOO_FREQUENT）。
   - POST /auth/password/phone/verify：成功返回 `reset_token`；覆盖验证码错误（400, SMS_CODE_MISMATCH）、过期（400, SMS_CODE_EXPIRED）。
2. 邮箱找回
   - POST /auth/password/email/request：成功返回 `status=sent`；覆盖格式错误（400, EMAIL_INVALID_FORMAT）、速率限制（429, EMAIL_TOO_FREQUENT）。
3. 人脸识别找回
   - GET /auth/password/face/start：返回 `qrcode_id`、`expires_at`；
   - GET /auth/password/face/status 与 GET /auth/password/face/{id}/status：轮询状态 `unscanned/scanned/confirmed/expired`；
   - POST /auth/password/face/confirm：确认后返回 `reset_token`。
4. 重置密码
   - POST /auth/password/reset：校验令牌与密码强度；覆盖弱密码（400, PASSWORD_WEAK）与维护窗口阻断（503）。
5. 登录后修改密码
   - POST /auth/password/change：需要有效会话与旧密码校验；覆盖旧密码错误（401, INVALID_CREDENTIALS）、弱密码（400, NEW_PASSWORD_WEAK）、会话缺失（401, SESSION_EXPIRED）、维护窗口阻断（503）。

## 自动化执行摘要
- 测试套件：3（注册、登录、密码管理）
- 用例总数：34
- 结果：全部通过（0 失败）

## 结论与后续
- 接口桩已完整覆盖密码找回与修改的主要路径与错误场景，可用于前后端联调与需求验收。
- 后续建议：
  - 对接真实生物识别与风控服务，替换人脸识别桩逻辑。
  - 在密码重置与修改后，明确会话与令牌失效策略，并补充相应测试用例。