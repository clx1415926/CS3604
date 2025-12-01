Feature: 12306 用户登录功能
  为了安全便捷地访问12306系统
  身为用户
  我希望通过账号/扫码登录，并能在必要时找回密码

  Background:
    Given 服务正常运行

  # 账号密码登录
  Scenario: AC01 用户名+密码登录成功
    When 我使用用户名 "testuser123" 和密码 "Password123!" 登录
    Then 我应当获得有效会话

  Scenario: AC02 手机号+密码登录成功
    When 我使用手机号 "13812345678" 和密码 "Password123!" 登录
    Then 我应当获得有效会话

  Scenario: AC03 邮箱+密码登录成功
    When 我使用邮箱 "user@example.com" 和密码 "Password123!" 登录
    Then 我应当获得有效会话

  Scenario: AC04 错误密码提示
    When 我使用用户名 "testuser123" 和错误密码 "Wrong_123" 登录
    Then 我应当看到错误码 "INVALID_CREDENTIALS"

  Scenario: AC05 未注册账号登录失败
    When 我使用用户名 "unknown_user" 和密码 "Password123!" 登录
    Then 我应当看到错误码 "INVALID_CREDENTIALS"


  # 扫码登录
  Scenario: AC08 生成二维码并处于未扫码状态
    When 我生成扫码登录二维码
    Then 二维码状态应为 "unscanned"

  Scenario: AC09 二维码被扫码后进入已扫码状态
    Given 我生成扫码登录二维码
    When 我轮询状态并模拟被扫码
    Then 二维码状态应为 "scanned"

  Scenario: AC10 二维码确认后创建会话
    Given 我生成扫码登录二维码
    When 我轮询状态并模拟确认
    Then 二维码状态应为 "confirmed" 且返回会话

  # 密码找回
  Scenario: AC11 手机号找回密码-发送验证码
    When 我提交手机号与证件信息请求找回密码
    Then 我应当收到状态 "sent"

  Scenario: AC12 手机号找回密码-验证验证码并获取重置令牌
    When 我提交手机号与验证码进行验证
    Then 我应当获得重置令牌

  Scenario: AC13 邮箱找回密码-发送重置链接
    When 我提交邮箱与证件信息请求找回密码
    Then 我应当收到状态 "sent"

  Scenario: AC14 人脸识别找回密码-生成二维码并确认
    When 我启动人脸识别找回密码
    And 我确认人脸识别
    Then 我应当获得重置令牌

  # 会话与安全

  Scenario: AC16 30分钟非活跃会话过期
    Given 我已登录
    When 我在会话检查时模拟非活跃超过30分钟
    Then 我应当看到错误码 "SESSION_EXPIRED"

  Scenario: AC17 失败5次触发锁定
    When 我连续输入错误密码5次
    Then 我应当看到错误码 "ACCOUNT_LOCKED"

  Scenario: AC18 锁定期间再次尝试提示锁定
    Given 我已被锁定
    When 我再次尝试登录
    Then 我应当看到错误码 "ACCOUNT_LOCKED"

  Scenario: AC19 登出成功
    Given 我已登录
    When 我执行登出
    Then 我应当收到204状态码

  Scenario: AC20 登录成功后跳转页面
    When 我登录成功
    Then 响应应包含跳转路径 "/profile"

  Scenario: AC21 维护窗口禁止登录
    When 我在维护窗口时间尝试登录
    Then 我应当看到错误码 "MAINTENANCE_WINDOW"