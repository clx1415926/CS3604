const express = require('express');
const cors = require('cors');
const stationsRouter = require('./routes/stations');
const ticketsRouter = require('./routes/tickets');

const app = express();
const port = 3000;

app.use(cors());
app.use(ticketsRouter);
app.use(stationsRouter);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;