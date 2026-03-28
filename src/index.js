const app = require('./app');
const { port } = require('./config/env');

app.listen(port, () => {
  console.log(`YallaRent API running on port ${port}`);
});
