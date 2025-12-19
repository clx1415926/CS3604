const { app } = require('./app');
const port = process.env.PORT || 3001;
const host = process.env.HOST || '127.0.0.1';

const server = app.listen(port, host, () => {
  console.log(`Ticket Management backend is running on http://${host}:${port}`);
});

server.on('error', (err) => {
  if (err && (err.code === 'EACCES' || err.code === 'EADDRINUSE')) {
    const altPort = Number(port) + 10;
    const altServer = app.listen(altPort, host, () => {
      console.log(`Ticket Management backend is running on http://${host}:${altPort}`);
    });
    altServer.on('error', () => {});
    return;
  }
  throw err;
});
