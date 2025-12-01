const { app } = require('./app');
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Home_Page server listening on http://localhost:${PORT}`);
});