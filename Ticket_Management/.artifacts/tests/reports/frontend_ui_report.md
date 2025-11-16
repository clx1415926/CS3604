# 前端UI测试报告

- 模块：Ticket_Management Frontend
- 测试框架：Vitest + React Testing Library
- 结果：4/4 测试文件通过，10/10 用例通过

## 用例列表
- OrderFilling.test.tsx
  - should display selected train info on order filling page
  - should render contacts list with required fields
  - submit button should be disabled until passengers selected and seats locked
- SeatSelectionModal.test.tsx
  - should render seat class tabs and allow switching
  - should render seat map with columns A-F and window icons
  - confirm should call API-POST-SeatLock and return to order page
- OrderManagement.test.tsx
  - should default to 未完成订单 tab
  - should render order card fields
  - should open cancel dialog and call API-POST-OrderCancel
- CancelSuccessModal.test.tsx
  - should render cancel success modal and navigate back

## 覆盖接口
- UI-OrderFilling
- UI-SeatSelection
- UI-OrderManagement
- UI-CancelDialog
- UI-CancelSuccessModal