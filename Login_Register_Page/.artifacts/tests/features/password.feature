Feature: 密码管理
  为 12306 用户提供安全的密码找回与修改能力，支持手机、邮箱、人脸识别三种找回方式，并在登录后允许修改密码。

  Background:
    Given 系统处于正常服务窗口

  # 手机找回成功路径
  Scenario: 用户通过手机号请求验证码并重置密码成功
    When 用户提交手机号 13812345678 与身份证号 110101199001011234 请求短信验证码
    Then 系统返回状态 sent 且 TTL 为 5 分钟
    When 用户输入短信验证码 123456 完成验证
    Then 系统返回重置令牌
    When 用户使用重置令牌设置新密码 NewPass_123
    Then 系统返回 success

  # 邮箱找回成功路径
  Scenario: 用户通过邮箱请求重置链接
    When 用户提交邮箱 user@example.com 与身份证号 110101199001011234 请求重置
    Then 系统返回状态 sent

  # 人脸识别找回成功路径
  Scenario: 用户发起人脸识别重置流程并确认
    When 用户请求人脸识别二维码
    Then 返回 qrcode_id 与过期时间
    When 用户确认人脸识别
    Then 系统返回重置令牌

  # 登录后修改密码成功路径
  Scenario: 用户登录后修改密码
    Given 用户已使用用户名 testuser123 与密码 Password123! 登录成功
    When 用户提交旧密码 Password123! 与新密码 NewPass_123!
    Then 返回 success

  # 失败与边界
  Scenario: 维护窗口内手机找回被拒绝
    Given 系统处于维护窗口
    When 用户提交手机号请求短信验证码
    Then 返回错误 MAINTENANCE_WINDOW

  Scenario: 手机找回身份证不匹配
    When 用户提交手机号与身份证信息，但后端检测不匹配
    Then 返回错误 PHONE_ID_MISMATCH

  Scenario: 短信验证码错误或过期
    When 用户输入错误验证码
    Then 返回错误 SMS_CODE_MISMATCH
    When 用户输入过期验证码
    Then 返回错误 SMS_CODE_EXPIRED

  Scenario: 新密码强度不足
    When 用户尝试设置弱密码 123456
    Then 返回错误 PASSWORD_WEAK

  Scenario: 登录后修改密码旧密码错误
    Given 用户已登录
    When 用户提交错误的旧密码
    Then 返回错误 INVALID_CREDENTIALS