# 乘客信息同步功能实现文档

## 1. 功能概述
本项目实现了从 `User_Center`（个人中心）到 `Ticket_Management`（车票管理）的乘客信息实时同步。用户在个人中心添加的乘客信息，能够即时在车票预定页面的订单填写环节被检索和选择。

## 2. 架构设计

### 2.1 数据流向
- **源头**: `User_Center` Backend (Port 8083) - 负责存储和管理乘客信息的完整档案。
- **消费端**: `Ticket_Management` Frontend (Port 5174) - 在订单填写页面直接请求源头数据。

### 2.2 接口调用
- **API**: `GET http://localhost:8083/api/v1/passengers?showFull=true`
- **参数**: `showFull=true` 确保获取用于购票的完整证件号码（未脱敏）。
- **跨域处理**: `User_Center` 后端已配置 CORS 允许跨域访问。

## 3. 详细实现

### 3.1 前端组件 (`OrderFilling.tsx`)
位于 `e:\cs3604\12306\Ticket_Management\frontend\src\components\OrderFilling.tsx`。

- **数据获取**: 
  组件加载时（`useEffect`），尝试连接 `User_Center` 接口获取乘客列表。
  ```javascript
  const rc = await fetch('http://localhost:8083/api/v1/passengers?showFull=true');
  ```

- **数据映射**:
  将 `User_Center` 的数据格式转换为组件内部使用的 `Contact` 格式：
  - `passenger_id`: 保持一致。
  - `name`: 保持一致。
  - `id_type`: 保持一致。
  - `masked_id_number`: 前端根据完整证件号动态生成脱敏显示（前6后4，中间`*`），保障展示安全的同时保留购票所需的完整数据。

- **UI 展示**:
  采用列表复选框形式，显示乘客姓名、证件类型及脱敏后的证件号，符合 12306 风格。

- **异常处理**:
  若同步失败（如网络错误），控制台输出错误日志，组件保持可用（不崩溃），可回退到测试数据或空列表，提示用户检查网络。

### 3.2 性能与安全
- **性能**: 数据在组件挂载时一次性拉取，避免了频繁的请求。对于常规用户（乘客数量 < 100），前端渲染无压力。
- **安全**: 只有在 HTTPS 或受信任的内部网络（localhost）环境下传输完整证件号。前端仅在提交订单时使用完整证件号，展示时严格脱敏。

## 4. 测试验证
已建立自动化测试 `test/components/OrderFilling.sync.test.tsx`，覆盖以下场景：
1. **正常同步**: 验证能否正确获取并渲染 `User_Center` 返回的乘客数据。
2. **数据脱敏**: 验证界面显示的证件号是否已正确脱敏。
3. **异常回退**: 模拟网络失败，验证组件稳定性。
4. **大数据量**: 验证 100+ 乘客列表的渲染性能。

## 5. 部署说明
确保 `User_Center` 后端服务（8083）和 `Ticket_Management` 前端服务（5174）同时运行即可体验该功能。
