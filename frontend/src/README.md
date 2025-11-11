# 前端源代码（表单 Schema）

此目录包含注册流程的表单 Schema：`forms/registration.form.schema.json`，对应 `.artifacts/ui_interface.yml`。

用法建议：
- 依据 schema 自动生成表单控件与校验（如使用 React + JSON Schema Form 或自建表单层）。
- 使用接口库定义的端点对接后端，按页面分步提交数据与状态。
- 实现 UI 可访问性：键盘可达、ARIA 标签、错误聚焦、倒计时可被朗读等。