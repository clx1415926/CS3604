const { app } = require('./app');
const port = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.status(200).send(`Ticket Management Backend Running on http://localhost:${port}`);
});

app.listen(port, () => {
  console.log(`Ticket Management backend is running on http://localhost:${port}`);
});