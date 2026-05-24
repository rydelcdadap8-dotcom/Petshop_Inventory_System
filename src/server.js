const app = require("./app");
const env = require("./config/env");
const ensureSchema = require("./db/schema");

async function startServer() {
  await ensureSchema();

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Server failed to start:", error.message);
  process.exit(1);
});
