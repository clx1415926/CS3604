# 需求覆盖率报告

生成时间: 2025-11-11

## 总体概览

| 指标 | 数值 |
|------|------|
| 需求总数 | 1 |
| 完全覆盖 | 1 (100%) |
| 部分覆盖 | 0 (0%) |
| 未覆盖 | 0 (0%) |
| 总验收标准数 | 6 |
| 已测试验收标准数 | 6 (100%) |

## 详细覆盖情况

### ✅ REQ-TICKET-QUERY: 车票查询功能

**覆盖状态:** 完全覆盖 (100%)

**相关接口:**
- `API-GET-QueryStations` (Backend)
  - ✅ AC#1: 请求 /api/stations?keyword=bj 应返回北京相关的站点列表。
    - 测试: `backend/test/routes/stations.test.js::should return 200 OK and a list of stations for a valid keyword`
- `API-GET-QueryTickets` (Backend)
  - ✅ AC#1: 当所有参数合法时，应返回 200 OK 和车次数据。
    - 测试: `backend/test/routes/tickets.test.js::should return 200 OK and train data for valid query parameters`
  - ✅ AC#2: 当缺少必要参数时，应返回 400 Bad Request。
    - 测试: `backend/test/routes/tickets.test.js::should return 400 Bad Request when required parameters are missing`
- `UI-QueryForm` (Frontend)
  - ✅ AC#1: 应包含出发地、目的地、日期三个输入控件和一个查询按钮。
    - 测试: `frontend/test/components/QueryForm.test.tsx::should render all required form fields`
- `UI-TrainList` (Frontend)
  - ✅ AC#1: 能正确渲染车次号、站点、时间、历时和余票信息。
    - 测试: `frontend/test/components/TrainList.test.tsx::should render train list correctly`
- `UI-FilterPanel` (Frontend)
  - ✅ AC#1: 应提供车次类型（高铁、动车、直达）和席别（一等座、二等座、软卧、硬卧）的复选框。
    - 测试: `frontend/test/components/FilterPanel.test.tsx::should render filter options`