# 需求覆盖率报告

生成时间: 2025-11-16

## 总体概览

| 指标 | 数值 |
|------|------|
| 需求总数 | 1 |
| 完全覆盖 | 1 (100%) |
| 部分覆盖 | 0 (0%) |
| 未覆盖 | 0 (0%) |
| 总验收标准数 | 20 |
| 已测试验收标准数 | 20 (100%) |

## 详细覆盖情况

### ✅ REQ-ORD-001: 订单管理功能

**覆盖状态:** 完全覆盖 (100%)

**相关接口:**
- `API-GET-Contacts` (Backend)
  - ✅ AC#1: 返回常用联系人列表，含姓名/证件类型/证件号脱敏/实名认证
    - 测试: `Ticket_Management/backend/test/routes/contacts.test.js::should return contacts with required fields`

- `API-GET-SeatMap` (Backend)
  - ✅ AC#1: 座位图显示列A-F与靠窗标识
    - 测试: `Ticket_Management/backend/test/routes/seats.test.js::should return seat map with columns and window flags`

- `API-POST-SeatLock` (Backend)
  - ✅ AC#1: 锁定座位返回令牌与过期时间
    - 测试: `Ticket_Management/backend/test/routes/seats.test.js::should lock seats and return lock tokens with expiry`

- `API-POST-OrderCreate` (Backend)
  - ✅ AC#1: 有效锁座生成待支付订单并返回订单ID
    - 测试: `Ticket_Management/backend/test/routes/orders.test.js::should create unpaid order and return order_id`

- `API-GET-Orders` (Backend)
  - ✅ AC#1: 默认未完成订单列表字段与UI一致
    - 测试: `Ticket_Management/backend/test/routes/orders.test.js::should list orders in unpaid tab with required fields`

- `API-GET-OrderDetail` (Backend)
  - ✅ AC#1: 订单详情完整字段集；未找到时返回404
    - 测试: `Ticket_Management/backend/test/routes/orders.test.js::should return order detail with full field set`

- `API-POST-OrderCancel` (Backend)
  - ✅ AC#1, AC#2: 取消未支付订单成功；每日取消超过3次返回限制错误
    - 测试: `Ticket_Management/backend/test/routes/orders.test.js::should cancel unpaid order or enforce daily limit`

- `UI-OrderFilling` (Frontend)
  - ✅ AC#1: 显示车次详细信息
    - 测试: `Ticket_Management/frontend/test/components/OrderFilling.test.tsx::should display selected train info on order filling page`
  - ✅ AC#2: 显示常用联系人列表与字段
    - 测试: `Ticket_Management/frontend/test/components/OrderFilling.test.tsx::should render contacts list with required fields`
  - ✅ AC#3: 提交按钮禁用直到选人并锁座
    - 测试: `Ticket_Management/frontend/test/components/OrderFilling.test.tsx::submit button should be disabled until passengers selected and seats locked`

- `UI-SeatSelection` (Frontend)
  - ✅ AC#1: 席别标签页可切换
    - 测试: `Ticket_Management/frontend/test/components/SeatSelectionModal.test.tsx::should render seat class tabs and allow switching`
  - ✅ AC#2: 座位图显示列A-F与靠窗
    - 测试: `Ticket_Management/frontend/test/components/SeatSelectionModal.test.tsx::should render seat map with columns A-F and window icons`
  - ✅ AC#3: 确认调用锁座接口并返回订单页
    - 测试: `Ticket_Management/frontend/test/components/SeatSelectionModal.test.tsx::confirm should call API-POST-SeatLock and return to order page`

- `UI-OrderManagement` (Frontend)
  - ✅ AC#1: 默认显示未完成订单标签
    - 测试: `Ticket_Management/frontend/test/pages/OrderManagement.test.tsx::should default to 未完成订单 tab`
  - ✅ AC#2: 订单卡片字段齐全
    - 测试: `Ticket_Management/frontend/test/pages/OrderManagement.test.tsx::should render order card fields`
  - ✅ AC#3: 取消订单弹框并调用接口
    - 测试: `Ticket_Management/frontend/test/pages/OrderManagement.test.tsx::should open cancel dialog and call API-POST-OrderCancel`

- `UI-CancelDialog` (Frontend)
  - ✅ AC#1: 显示标题与限制提示
  - ✅ AC#2: 确定调用取消接口；取消关闭对话框
    - 测试: `Ticket_Management/frontend/test/pages/OrderManagement.test.tsx::should open cancel dialog and call API-POST-OrderCancel`

- `UI-CancelSuccessModal` (Frontend)
  - ✅ AC#1: 显示成功提示与返回操作
    - 测试: `Ticket_Management/frontend/test/pages/OrderManagement.test.tsx::should render cancel success modal and navigate back`

**说明:** 当前所有测试为目标功能测试，基于接口定义的验收标准，因代码骨架未实现，运行时将失败，用作后续实现的验收基准。