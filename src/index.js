const http = require('http');
const app = require('./app');
const { port, nodeEnv } = require('./config/env');
const { runMigrations } = require('./db/migrate');
const { setupSocket } = require('./socket');

async function start() {
  if (nodeEnv !== 'test') {
    await runMigrations();
  }

  const server = http.createServer(app);
  setupSocket(server, app);

  server.listen(port, () => {
    console.log(`YallaRent API running on port ${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
