# 后端接口测试报告

- 模块：Ticket_Management Backend
- 测试框架：Jest
- 结果：3/3 测试套件通过，7/7 用例通过

## 用例列表
- contacts.test.js
  - should return contacts with required fields
- seats.test.js
  - should return seat map with columns and window flags
  - should lock seats and return lock tokens with expiry
- orders.test.js
  - should create unpaid order and return order_id
  - should list orders in unpaid tab with required fields
  - should return order detail with full field set
  - should cancel unpaid order or enforce daily limit

## 覆盖接口
- API-GET-Contacts
- API-GET-SeatMap
- API-POST-SeatLock
- API-POST-OrderCreate
- API-GET-Orders
- API-GET-OrderDetail
- API-POST-OrderCancel