const { Pool } = require("pg");
const env = require("../config/env");

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is required. Add your Aiven PostgreSQL connection string.");
}

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.pgSsl
    ? {
        rejectUnauthorized: false
      }
    : false
});

module.exports = pool;
