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

// Redirect root to development server (5174) with session ID
app.get('/', (req, res) => {
  const sid = req.query.sid || '';
  const redirectUrl = sid 
    ? `http://localhost:5174/?sid=${encodeURIComponent(sid)}`
    : 'http://localhost:5174/';
  console.log(`[Backend] Redirecting / to ${redirectUrl}`);
  res.redirect(redirectUrl);
});

// Serve built frontend statically (only for production builds if needed)
// const distDir = path.join(__dirname, '../../frontend/dist');
// app.use(express.static(distDir));

module.exports = { app };