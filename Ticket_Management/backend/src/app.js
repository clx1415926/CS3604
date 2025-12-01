const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());

const contactsRouter = require('./routes/contacts');
const seatsRouter = require('./routes/seats');
const ordersRouter = require('./routes/orders');

app.use('/api/v1/contacts', contactsRouter);
app.use('/api/v1/seats', seatsRouter);
app.use('/api/v1/orders', ordersRouter);

// Serve built frontend statically
const distDir = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distDir));
app.get('/', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

module.exports = { app };