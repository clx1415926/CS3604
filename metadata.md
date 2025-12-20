> 本文档是项目的唯一真理来源（Single Source of Truth）。所有的代码生成、接口设计和文件结构必须严格遵守本文档定义的规范。

## 1. Tech Stack & Dependencies (技术栈约束)

本项目采用模块化架构，各功能模块（Home_Page, Login_Register_Page, Ticket_Management, Ticket_Selection, User_Center）独立维护，但共享相似的技术栈。

### Frontend (Client)

  * Framework: React 18+ (created via Vite)
  * Language: JavaScript (ES6+) / TypeScript (部分模块)
  * Styling: CSS / Modules
  * HTTP Client: Axios / Fetch
  * Build Tool: Vite
  * Testing: Vitest, React Testing Library (RTL)

### Backend (Server)

  * Runtime: Node.js (LTS)
  * Framework: Express.js
  * Database: SQLite3 (使用 `sqlite3` driver)
  * Testing: Jest / Vitest
  * Utilities: Nodemon (dev), Cors, Body-parser

### Data Model: Trains & Stations (车次与车站数据模型约定)

  * 车次与车站数据在逻辑上抽象为统一的数据层，供 Ticket_Selection 模块及后续扩展模块复用。
  * 推荐采用 SQLite 数据库文件统一管理：
    * 库：`ticket_selection.db`
    * 核心表（示意）：
      * `trains`：`id`, `train_no`, `from_station`, `to_station`, `depart_time`, `arrive_time`, `duration`, `train_date`, `train_type` 等；
      * `seats`：`id`, `train_id`, `seat_type`, `seat_count`, `price` 等；
      * `stations`：`id`, `name`, `code`, `pinyin`, `abbr` 等。
  * 查询接口（如 `/api/tickets`, `/api/stations`）应通过数据访问层（DAO/Repository）访问上述数据模型，而不是直接操作内存常量。

-----

## 2. Project Directory Structure (目录结构规范)

本项目包含多个独立的功能模块子目录，每个模块下通常包含：
- `.artifacts/`：接口定义、需求覆盖率与追踪矩阵等元数据；
- `backend/`：Node.js + Express 服务端代码与测试；
- `frontend/`：React + Vite 客户端代码与测试；
- 若干与模块相关的需求文档与说明文档。

```text
/root
├── .artifacts/                      # 跨模块的接口与追踪元数据
│   ├── api_interface.yml
│   ├── data_interface.yml
│   ├── traceability_matrix.yml
│   └── ui_interface.yml
│
├── Home_Page/                       # REQ-1 首页与导航
│   ├── .artifacts/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── data/               # 首页服务时间、站点元数据
│   │   │   ├── routes/             # 站点信息等接口路由 (site.js)
│   │   │   ├── app.js
│   │   │   └── server.js
│   │   ├── test/
│   │   │   └── routes/
│   │   ├── package.json
│   │   └── package-lock.json
│   └── frontend/
│       ├── src/
│       │   └── components/
│       │       └── HomePage.tsx
│       ├── assets/                 # 首页静态资源（图片、字体、CSS）
│       ├── test/
│       │   └── components/
│       ├── index.css
│       └── index.html
│
├── Login_Register_Page/             # REQ-2 登录与注册
│   ├── .artifacts/
│   │   └── tests/                  # 接口与UI测试用例与报告
│   ├── backend/
│   │   ├── data/
│   │   │   └── accounts.db        # 用户账号 SQLite 数据库
│   │   ├── src/
│   │   │   ├── cli/               # 密码找回、发送验证码等脚本
│   │   │   ├── db.js
│   │   │   └── server.js
│   │   ├── test/
│   │   │   ├── *.test.js          # 登录 / 注册 / 密码管理测试
│   │   │   └── *.http             # 接口调试脚本
│   │   ├── package.json
│   │   └── package-lock.json
│   └── frontend/
│       ├── src/
│       │   ├── assets/            # 登录/注册页面静态资源
│       │   ├── forms/             # registration.form.schema.json 等表单定义
│       │   ├── *.html             # login / register / forgot-password 等页面
│       │   └── *.js               # 对应页面脚本（login.js, register.js 等）
│       ├── test/                  # 前端 UI 用例 YAML
│       └── styles & css           # 多个登录/注册样式文件
│
├── Ticket_Management/               # REQ-4 订单管理（预订 + 订单中心）
│   ├── .artifacts/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── contacts.js    # 常用联系人接口
│   │   │   │   ├── orders.js      # 订单创建、支付、取消等接口
│   │   │   │   └── seats.js       # 选座与座位状态接口
│   │   │   ├── app.js
│   │   │   └── server.js
│   │   ├── test/
│   │   │   └── routes/            # 订单全流程与边界条件测试
│   │   ├── package.json
│   │   └── package-lock.json
│   └── frontend/
│       ├── src/
│       │   ├── components/        # OrderFilling, SeatSelectionModal 等组件
│       │   ├── pages/             # OrderManagement, Payment 等页面
│       │   ├── index.tsx
│       │   └── index.css
│       ├── test/
│       │   ├── components/
│       │   └── pages/
│       ├── index.html
│       ├── package.json
│       └── package-lock.json
│
├── Ticket_Selection/                # REQ-3 车票查询
│   ├── .artifacts/
│   ├── backend/
│   │   ├── data/
│   │   │   ├── ticket_selection.db      # 车次与车站 SQLite 数据库（trains, seats, stations 等表）
│   │   │   └── ticket_selection.schema.sql  # 数据库结构定义与初始化脚本
│   │   ├── src/
│   │   │   ├── db/                      # 车次与车站数据访问层（封装对 SQLite/其他存储的读写）
│   │   │   ├── routes/
│   │   │   │   ├── stations.js         # 站点查询与自动补全（通过 db 层访问 stations 表）
│   │   │   │   └── tickets.js          # 车次查询与筛选接口（通过 db 层访问 trains / seats 表）
│   │   │   └── index.js
│   │   ├── test/
│   │   │   └── routes/
│   │   ├── package.json
│   │   └── package-lock.json
│   └── frontend/
│       ├── src/
│       │   ├── assets/            # 车票查询页面样式与字体
│       │   ├── components/        # QueryForm, FilterPanel, TrainList 等
│       │   ├── App.jsx
│       │   ├── index.jsx
│       │   └── index.css
│       ├── public/                # 部分静态资源副本
│       ├── test/
│       │   └── components/
│       ├── index.html
│       ├── package.json
│       └── vite.config.js
│
├── User_Center/                     # REQ-5 个人信息管理与乘客管理
│   ├── .artifacts/
│   ├── backend/
│   │   ├── scripts/               # 数据迁移与辅助脚本
│   │   ├── src/
│   │   │   ├── db/                # JSON 数据存储与访问封装
│   │   │   ├── routes/            # passengers.js, profile.js 等路由
│   │   │   ├── utils/             # 安全与校验工具
│   │   │   └── server.js
│   │   ├── test/                  # 数据持久化、并发与安全相关测试
│   │   └── jest.config.js
│   └── frontend/
│       ├── src/
│       │   ├── assets/            # 复用首页与手机核验等样式/图片
│       │   ├── components/        # Header, Footer 等共享组件
│       │   ├── pages/             # PersonalInfoView, PassengerList, PhoneVerification 等页面
│       │   ├── shared/            # 跨页面复用的 Header 等组件
│       │   ├── utils/             # 校验工具 (validators.ts)
│       │   ├── App.tsx
│       │   └── index.tsx
│       ├── test/
│       │   └── pages/
│       ├── index.html
│       ├── package.json
│       └── vite.config.ts
│
├── Requirements/                    # 统一需求文档目录
│   ├── requirements.yaml            # 聚合后的统一需求（REQ-1 ~ REQ-5）
│   └── sample_requirements.yaml
│
├── metadata.md                      # 本文件（技术栈与目录结构规范）
├── README.md
└── 其他根目录文件（.gitignore, OPTIMIZATION_LOG.md 等）
```

### Testing File Placement & Naming (测试文件放置与命名)

- 测试文件通常位于 `test` 目录下，与 `src` 结构镜像或根据功能组织。
- 命名遵循 `*.test.js` 或 `*.test.tsx`。
- Frontend 测试使用 `npm run test` (Vitest)。
- Backend 测试使用 `npm run test` (Jest/Vitest)。
