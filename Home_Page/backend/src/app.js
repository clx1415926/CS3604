const express = require('express');
const path = require('path');
const siteRouter = require('./routes/site');

const app = express();
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../../frontend')));
app.use(express.static(path.resolve(__dirname, '../../..')));
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../frontend/index.html'));
});
app.use('/api/site', siteRouter);

module.exports = { app };