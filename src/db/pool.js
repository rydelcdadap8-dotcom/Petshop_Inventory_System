const { Pool } = require("pg");
const env = require("../config/env");

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is required. Add your Aiven PostgreSQL connection string.");
}

function getConnectionString() {
  const url = new URL(env.databaseUrl);

  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslcert");
  url.searchParams.delete("sslkey");
  url.searchParams.delete("sslrootcert");

  return url.toString();
}

const pool = new Pool({
  connectionString: getConnectionString(),
  ssl: env.pgSsl
    ? {
        rejectUnauthorized: false
      }
    : false
});

module.exports = pool;
