const pool = require("./pool");
const ensureSchema = require("./schema");

ensureSchema()
  .then(() => {
    console.log("Database is ready.");
  })
  .catch((error) => {
    console.error("Database setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
