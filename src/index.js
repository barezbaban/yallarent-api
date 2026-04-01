const app = require('./app');
const { port } = require('./config/env');
const { runMigrations } = require('./db/migrate');

runMigrations()
  .then(() => {
    app.listen(port, () => {
      console.log(`YallaRent API running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to run migrations:', err);
    process.exit(1);
  });
