# 需求覆盖率报告（用户注册、登录与密码管理功能）

来源文档：`12306_用户注册功能_详细需求文档.md`、`12306_用户登录功能_详细需求文档.md`、`12306_密码管理功能_详细需求文档.md`
版本：2025-11-11

## 概览（注册）
- 需求总数：6（Must 5，Should 1）
- 已覆盖：6
- 覆盖率：100%

## 明细
1. 用户名规则（Must）
   - 接口：GET /users/username/check；PATCH /registration/sessions/{id}/account
   - 数据模型：UserAccount.username
   - UI：AccountInfo.username
   - 测试：u01/u02/u03；s01/s02/n01

2. 密码规则（Must）
   - 接口：PATCH /registration/sessions/{id}/account
   - 数据模型：ValidationRules.password；UserAccount.password_hash
   - UI：AccountInfo.password
   - 测试：p01/p02/p03/p04；n02
   - 备注：提示文案与需求示例存在细微差异，需产品确认最终文案。

3. 手机号与短信验证（Must）
   - 接口：GET /users/phone/check；POST /registration/sessions/{id}/sms/send；POST /registration/sessions/{id}/sms/verify
   - 数据模型：SMSVerification；UserAccount.phone
   - UI：PhoneVerify
   - 测试：ph01/ph05；s01/s03；s06/s07；n03

4. 身份信息核验（Must）
   - 接口：POST /registration/sessions/{id}/identity/verify
   - 数据模型：IdentityVerification
   - UI：IdentityVerify
   - 测试：id01/id03；s08；n04

5. 服务条款与隐私政策勾选（Must）
   - 接口：POST /registration/sessions/{id}/terms
   - 数据模型：TermsAgreement
   - UI：TermsConfirm
   - 测试：s09；terms_accept（feature）

6. 注册流程状态机与进度（Should）
   - 接口：/registration/sessions 系列
   - 数据模型：RegistrationSession.progress
   - UI：ProgressIndicator
   - 测试：s04/s05/s10；flow_happy_path（feature）

## 待确认与改进建议
- 密码提示文案：与需求中的示例文案细微差异，建议在UI与接口错误码映射中统一。
- 手机号重复注册：是否引导“找回账号/找回密码”，建议补充文案与流程分支。
- 安全策略落地：速率限制与验证码防刷需在网关层/短信服务明确配置与监控指标。
- 可访问性细节：Screen Reader文案与焦点管理需在前端实现时进行审查与测试。

---

## 概览（登录与密码管理）
 - 需求总数：6（Must 4，Should 2）
 - 已覆盖：6
 - 覆盖率：100%

## 明细（登录）
1. 账号密码登录（Must）
   - 接口：POST /auth/login；GET /auth/session；POST /auth/logout
   - 数据模型：LoginRequest/LoginResponse、UserSession
   - UI：LoginForm
   - 测试：l03/l04/l05；AC01/AC02/AC03/AC19/AC20

2. 扫码登录（Should）
   - 接口：GET /auth/qrcode；GET /auth/qrcode/{id}/status；POST /auth/qrcode/{id}/refresh
   - 数据模型：QRCodeLoginSession
   - UI：QRCodePanel
   - 测试：l10/l11/l12/l13；AC08/AC09/AC10

3. 失败锁定（Must）
   - 策略：5次失败锁定30分钟
   - 接口：POST /auth/login
   - 数据模型：LoginAttempt
   - 测试：l08；n04；AC17/AC18

4. 维护窗口（Must）
   - 接口：POST /auth/login
   - 错误码：MAINTENANCE_WINDOW
   - 测试：l14；AC21

5. 密码找回（Should）
   - 接口：POST /auth/password/phone/request；POST /auth/password/phone/verify；POST /auth/password/email/request；GET /auth/password/face/start；GET /auth/password/face/status；GET /auth/password/face/{id}/status；POST /auth/password/face/confirm；POST /auth/password/reset
   - 测试（API + UI）：
     - API：p01/p02/p03/p04/p05/p06/p07/p10；n01/n02/n03/n04/n05/n07/n08/n09
     - UI：ui-p01/ui-p02/ui-p03/ui-p04/ui-p06
   - 备注：人脸识别为桩实现，实际集成需对接风控与生物识别服务；维护窗口、速率限制符合数据接口策略。

6. 登录后修改密码（Must）
   - 接口：POST /auth/password/change
   - 数据模型/规则：PasswordChangeRequest；NEW_PASSWORD_WEAK/NEW_PASSWORD_SAME_AS_OLD 错误码；维护窗口策略
   - 测试（API + UI）：
     - API：p08/p09；n06（旧密码错误）
     - UI：ui-p05
   - 备注：修改成功后要求用户重新登录（UI提示已覆盖），后端会话策略后续可扩展为令牌失效处理。

## 待确认与改进建议（登录）
- 人脸识别找回密码：仅为服务桩，需明确真实风控与识别服务。
- 会话过期（非活跃30分钟）：测试需支持模拟非活跃时间推进（建议在会话接口加入测试专用header）。
 - 修改密码后令牌失效策略：是否立即使当前会话失效，建议在后端与前端统一处理与提示。