const pool = require("./pool");
const { hashPassword } = require("../auth");

const defaultUsers = [
  {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "admin123",
    role: "admin"
  },
  {
    username: process.env.USER_USERNAME || "user",
    password: process.env.USER_PASSWORD || "user123",
    role: "user"
  }
];

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  for (const user of defaultUsers) {
    await pool.query(
      `
        INSERT INTO app_users (username, password_hash, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (username) DO NOTHING
      `,
      [user.username, hashPassword(user.password), user.role]
    );
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
      price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
      supplier TEXT,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS sku TEXT,
      ADD COLUMN IF NOT EXISTS barcode TEXT,
      ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'pcs',
      ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
      ADD COLUMN IF NOT EXISTS low_stock_limit INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_limit >= 0);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS products_name_idx ON products (name);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS products_sku_idx ON products (sku);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      movement_type TEXT NOT NULL CHECK (movement_type IN ('stock_in', 'stock_out', 'adjustment')),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      previous_quantity INTEGER NOT NULL CHECK (previous_quantity >= 0),
      new_quantity INTEGER NOT NULL CHECK (new_quantity >= 0),
      remarks TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS stock_movements_product_idx ON stock_movements (product_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
      total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
      payment_method TEXT NOT NULL CHECK (payment_method IN ('gcash', 'cod')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'delivery', 'completed', 'cancelled')),
      customer_name TEXT,
      customer_phone TEXT,
      delivery_address TEXT,
      order_note TEXT,
      purchase_insight JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE customer_orders
      ADD COLUMN IF NOT EXISTS customer_name TEXT,
      ADD COLUMN IF NOT EXISTS customer_phone TEXT,
      ADD COLUMN IF NOT EXISTS delivery_address TEXT,
      ADD COLUMN IF NOT EXISTS order_note TEXT;
  `);

  await pool.query(`
    ALTER TABLE customer_orders
      DROP CONSTRAINT IF EXISTS customer_orders_status_check;
  `);

  await pool.query(`
    ALTER TABLE customer_orders
      ADD CONSTRAINT customer_orders_status_check
      CHECK (status IN ('pending', 'preparing', 'delivery', 'completed', 'cancelled'));
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS customer_orders_user_idx ON customer_orders (user_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS customer_orders_status_idx ON customer_orders (status);
  `);
}

module.exports = ensureSchema;
