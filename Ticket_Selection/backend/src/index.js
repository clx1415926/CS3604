const express = require('express');
const cors = require('cors');
const stationsRouter = require('./routes/stations');
const ticketsRouter = require('./routes/tickets');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(stationsRouter);
app.use(ticketsRouter);

app.get('/', (req, res) => {
  res.status(200).send(`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"/><title>12306 车票查询后端</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto;line-height:1.6;padding:24px}a{color:#0b65c2;text-decoration:none}a:hover{text-decoration:underline}</style></head><body><h1>12306 车票查询后端</h1><p>服务正常运行于 <code>http://localhost:${port}</code>。</p><p>前端页面请访问：<a href="http://localhost:5173/index.html">http://localhost:5173/index.html</a></p><p>API 示例：<ul><li><code>/api/stations?keyword=上海</code></li><li><code>/api/tickets?fromStation=BJP&toStation=SHH&departDate=2025-11-11</code></li></ul></p></body></html>`);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;