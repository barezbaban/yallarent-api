const app = require('./app');
const { port, nodeEnv } = require('./config/env');
const { runMigrations } = require('./db/migrate');

async function start() {
  if (nodeEnv !== 'test') {
    await runMigrations();
  }
  app.listen(port, () => {
    console.log(`YallaRent API running on port ${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
