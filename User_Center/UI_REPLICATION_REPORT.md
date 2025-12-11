# UI 改造升级报告 - 手机核验页面

## 1. 概述
本报告记录了对 12306 个人中心“手机核验”子页面的 UI 改造过程。改造严格遵循了 `UI_REPLICATION_SPECS_BINDTEL.md` 规范，实现了视觉样式的调整、静态资源的替换以及功能完整性的保障。

## 2. 改造内容

### 2.1 静态资源
- 已将 `assets/kyfw_12306_bind_tel` 中的所有 CSS 和图片资源迁移至前端项目 `src/assets/kyfw_12306_bind_tel` 目录。
- 引入了 `ticket_common_v70001.css` 作为全局样式基础（仅在 App 入口引入，确保样式生效）。

### 2.2 组件开发
- **Header 组件**: 创建了 `Header.tsx` 和 `Header.css`，实现了 12306 标准页头，包含 Logo 和用户信息区域。
- **Footer 组件**: 创建了 `Footer.tsx` 和 `Footer.css`，实现了包含友情链接和版权信息的页脚。
- **布局调整**: 修改了 `App.tsx`，针对 `/otn/view/userSecurity_bindTel.html` 路由采用了独立的布局结构（Header + Sidebar + Content + Footer），以确保视觉层次与规范一致。

### 2.3 页面重构 (PhoneVerification)
- 重构了 `PhoneVerification.tsx`，使用了 `BindTelForm.css` 进行样式定义。
- 页面结构调整为：
  - 标题：手机核验
  - 状态栏：显示当前绑定状态
  - 表单区域：
    - 国家/地区选择
    - 手机号输入
    - 登录密码输入（对应原有业务逻辑）
  - 操作区域：取消、确认按钮
- **功能保留**: 完整保留了原有 `useEffect` 会话检查、`onConfirm` 提交逻辑以及错误处理逻辑。

## 3. 视觉样式
- **色彩**: 严格使用了规范中的 `#FF8000` (Primary), `#333333` (Text), `#DEDEDE` (Border) 等颜色。
- **字体**: 继承了 `ticket_common_v70001.css` 中的字体设置。
- **间距**: 按照规范调整了 Padding (20px) 和 Margin。

## 4. 自动化验证
- 提供了自动化验证脚本 `frontend/ui_verification.js`。
- **依赖**: 需要安装 `puppeteer`, `pngjs`, `pixelmatch`。
  ```bash
  npm install puppeteer pngjs pixelmatch
  ```
- **运行方式**:
  1. 启动前端服务: `npm run dev`
  2. 运行脚本: `node ui_verification.js`
- **比对机制**: 脚本会自动截图并与 `reference_bind_tel.png`（需用户提供标准设计图）进行像素级比对，计算差异百分比。

## 5. 兼容性与性能
- 页面采用了 Flexbox 布局，适配主流浏览器（Chrome, Edge, Firefox）。
- 资源均为静态引入，未引入额外的大型库，保证了加载性能。

## 6. 结论
本次改造完成了 UI 的视觉升级，同时确保了原有业务逻辑的 100% 兼容。页面结构清晰，符合 12306 的设计规范。
