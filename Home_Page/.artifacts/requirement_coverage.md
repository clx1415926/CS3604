# 需求覆盖率报告

生成时间: 2025-11-13

## 总体概览

| 指标 | 数值 |
|------|------|
| 需求总数 | 1 |
| 完全覆盖 | 1 (100%) |
| 部分覆盖 | 0 (0%) |
| 未覆盖 | 0 (0%) |
| 总验收标准数 | 16 |
| 已测试验收标准数 | 16 (100%) |

## 详细覆盖情况

### ✅ REQ-001: 首页与导航

**覆盖状态:** 完全覆盖 (100%)

**相关接口:**
- `API-GET-HomeMetadata` (Backend)
  - ✅ AC#1: 成功返回包含服务时间与官方提示的信息体
    - 测试: `Home_Page/backend/test/routes/site.test.js::should return 200 and include serviceHours and officialSafetyTip`
  - ✅ AC#2: friendLinks 至少包含铁路相关官方站点条目
    - 测试: `Home_Page/backend/test/routes/site.test.js::should include at least one railway official friend link`
  - ✅ AC#3: compliance 提供公安备案与ICP备案信息
    - 测试: `Home_Page/backend/test/routes/site.test.js::should include compliance policeRecord and icpRecord`
  - ✅ AC#4: accessibility 提供适老化无障碍入口说明
    - 测试: `Home_Page/backend/test/routes/site.test.js::should include accessibility elderlyServiceEntry and description`

- `UI-HomePage` (Frontend)
  - ✅ AC#1: 首屏渲染显示品牌标识与欢迎语
    - 测试: `Home_Page/frontend/test/components/HomePage.test.tsx::should render brand and welcome text on first paint`
  - ✅ AC#2: 显示服务时间说明
    - 测试: `Home_Page/frontend/test/components/HomePage.test.tsx::should display service hours text`
  - ✅ AC#3: 显示官方安全提示关于官方APP与授权
    - 测试: `Home_Page/frontend/test/components/HomePage.test.tsx::should display official safety tip about authorized app`
  - ✅ AC#4: 渲染五个入口按钮并具备可访问名称
    - 测试: `Home_Page/frontend/test/components/HomePage.test.tsx::should render five accessible buttons with names`
  - ✅ AC#5: 未登录点击管理类按钮拦截并引导至登录/注册
    - 测试: `Home_Page/frontend/test/components/HomePage.test.tsx::should intercept and prompt login for management buttons when not logged in`
  - ✅ AC#6: 登录后点击管理类按钮成功跳转到对应页面
    - 测试: `Home_Page/frontend/test/components/HomePage.test.tsx::should navigate to management pages after login`
  - ✅ AC#7: 键盘导航Tab顺序与Enter/Space触发
    - 测试: `Home_Page/frontend/test/components/HomePage.test.tsx::should support keyboard navigation in defined order`
  - ✅ AC#8: 手机屏宽纵向堆叠且触控尺寸≥44px
    - 测试: `Home_Page/frontend/test/components/HomePage.test.tsx::should stack vertically on small screens and keep min touch size`
  - ✅ AC#9: 底部展示友情链接与版权备案信息及无障碍入口说明
    - 测试: `Home_Page/frontend/test/components/HomePage.test.tsx::should display friend links and compliance info in footer`
  - ✅ AC#10: 路由解析失败或网络错误时错误提示并提供重试与返回首页
    - 测试: `Home_Page/frontend/test/components/HomePage.test.tsx::should show error feedback and retry/home actions on navigation failure`
  - ✅ AC#11: 点击“登录注册”按钮跳转登录/注册页面
    - 测试: `Home_Page/frontend/test/components/HomePage.test.tsx::should navigate to login/register when clicking button`
  - ✅ AC#12: 未登录点击“车票查询”按钮跳转到车票查询页面
    - 测试: `Home_Page/frontend/test/components/HomePage.test.tsx::should navigate to ticket search without login`

**说明:** 当前仅提供代码骨架与目标功能测试，按“测试先行”原则，这些测试在现状下应当失败，用于指导后续实现。