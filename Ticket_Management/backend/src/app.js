const express = require('express');
const app = express();
app.use(express.json());

const contactsRouter = require('./routes/contacts');
const seatsRouter = require('./routes/seats');
const ordersRouter = require('./routes/orders');

app.use('/api/v1/contacts', contactsRouter);
app.use('/api/v1/seats', seatsRouter);
app.use('/api/v1/orders', ordersRouter);

module.exports = { app };