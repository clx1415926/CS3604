# 12306 火车列次数据爬虫及更新指南

## 概述

本工具用于更新 `Ticket_Selection` 模块中的火车列次数据库。它支持从 12306 官网爬取（需配置）或生成模拟数据，并将数据更新到 SQLite 数据库中。

## 目录结构

*   脚本位置：`backend/scripts/crawl_trains.js`
*   日志文件：`backend/scripts/update_log.txt`
*   爬取数据：`backend/scripts/crawled_data.json`
*   数据库备份：`backend/backups/`
*   目标数据库：`../Ticket_Selection/backend/ticket_selection.db`

## 功能特性

1.  **数据获取**：支持模拟数据生成（默认）和真实接口请求（骨架代码）。
2.  **自动备份**：更新前自动备份目标数据库。
3.  **日志记录**：详细记录每一步的操作状态和错误信息。
4.  **事务安全**：使用数据库事务，确保更新原子性，失败自动回滚。

## 使用方法

### 1. 前置条件

确保已安装 Node.js 依赖：

```bash
cd Ticket_Management/backend
npm install
```

### 2. 运行更新脚本

```bash
node scripts/crawl_trains.js
```

### 3. 配置

在 `crawl_trains.js` 顶部可以修改配置：

*   `USE_MOCK`: 设置为 `true` 使用模拟数据，`false` 尝试真实爬取（注意反爬风险）。
*   `CITIES`: 需要爬取的城市列表。
*   `DAYS_TO_CRAWL`: 爬取的天数。

## 更新流程说明

1.  **备份**：脚本首先将 `ticket_selection.db` 复制到 `backups` 目录，文件名带有时间戳。
2.  **爬取/生成**：根据配置生成未来 15 天内主要城市间的列车数据。
3.  **验证**：检查数据是否为空。
4.  **更新**：
    *   开启事务。
    *   清空 `trains` 和 `train_seats` 表。
    *   插入新数据。
    *   提交事务。

## 故障排除

*   如果更新失败，请检查 `update_log.txt`。
*   数据库会自动回滚，原数据不受影响。
*   如果需要恢复旧数据，请从 `backups` 目录找到最近的 `.db` 文件，重命名并覆盖目标数据库。

## 注意事项

*   真实爬取功能 (`crawlReal`) 目前仅为骨架，未包含完整的 Cookie 和 IP 代理处理逻辑，直接使用可能会被 12306 封禁。建议在开发测试环境保持 `USE_MOCK = true`。
