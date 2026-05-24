const pool = require("./pool");

async function ensureSchema() {
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
}

module.exports = ensureSchema;
