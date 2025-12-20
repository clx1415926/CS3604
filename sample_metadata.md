> 本文档是项目的唯一真理来源（Single Source of Truth）。所有的代码生成、接口设计和文件结构必须严格遵守本文档定义的规范。

## 1. Tech Stack & Dependencies (技术栈约束)

必须严格使用以下技术栈:

### Frontend (Client)

  * Framework: React 18+ (created via Vite)
  * Language: JavaScript (ES6+)
  * Styling: CSS
  * HTTP Client: Axios
  * Routing: React Router DOM (v6)
  * Testing: Vitest, React Testing Library (RTL)

### Backend (Server)

  * Runtime: Node.js (LTS)
  * Framework: Express.js
  * Database: SQLite3 (使用 `sqlite3` driver)
  * Testing: Vitest (Test Runner), Supertest (HTTP assertions)
  * Utilities: Nodemon (dev), Cors, Body-parser

-----

## 2. Project Directory Structure (目录结构规范)

在生成文件时，必须严格遵循此树状结构。

```text
/root
├── /backend
│   ├── /src
│   │   ├── /database
│   │   │   ├── init_db.js
│   │   │   ├── db.js
│   │   │   └── operations.js
│   │   ├── /routes
│   │   │   └── api.js
│   │   ├── /utils
│   │   │   └── response.js
│   │   └── index.js
│   ├── /test
│   │   └── ...                  # 结构与 src 镜像，命名遵循 *.test.*
│   ├── database.db
│   └── package.json
│
├── /frontend
│   ├── /src
│   │   ├── /api
│   │   │   └── index.js
│   │   ├── /components
│   │   ├── /pages
│   │   │   └── HomePage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── /test
│   │   └── ...                  # 结构与 src 镜像，命名遵循 *.test.*
│   └── package.json
│
└── metadata.md
```

### Testing File Placement & Naming (测试文件放置与命名)

- 所有测试文件必须位于与 `src` 同级的 `test` 目录下，且目录结构与 `src` 镜像对应。
- 测试文件命名必须与被测文件名称相同，并在扩展名前添加 `.test`。
- 示例：
  - 被测文件：`frontend/src/pages/HomePage.jsx` → 测试文件：`frontend/test/pages/HomePage.test.jsx`
  - 被测文件：`backend/src/routes/api.js` → 测试文件：`backend/test/routes/api.test.js`

### Testing Runners (测试运行)

- Frontend：使用 `vitest` 与 `@testing-library/react`，命令：`npm run test`
- Backend：使用 `vitest` 与 `supertest`，命令：`npm run test`
