const express = require("express");
const pool = require("../db/pool");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    if (req.user.role === "user") {
      const result = await pool.query(`
        SELECT
          COUNT(*)::INTEGER AS total_products,
          COUNT(*) FILTER (WHERE quantity > 0)::INTEGER AS available_products,
          COUNT(DISTINCT category)::INTEGER AS total_categories
        FROM products
      `);

      return res.json({
        summary: result.rows[0],
        recentMovements: []
      });
    }

    const result = await pool.query(`
      SELECT
        COUNT(*)::INTEGER AS total_products,
        COALESCE(SUM(quantity), 0)::INTEGER AS total_stock,
        COALESCE(SUM(quantity * price), 0)::NUMERIC(12, 2) AS inventory_value,
        COUNT(*) FILTER (WHERE quantity <= low_stock_limit)::INTEGER AS low_stock_products
      FROM products
    `);

    const recentMovements = await pool.query(`
      SELECT
        sm.id,
        sm.product_id,
        p.name AS product_name,
        sm.movement_type,
        sm.quantity,
        sm.previous_quantity,
        sm.new_quantity,
        sm.remarks,
        sm.created_at
      FROM stock_movements sm
      JOIN products p ON p.id = sm.product_id
      ORDER BY sm.created_at DESC
      LIMIT 10
    `);

    return res.json({
      summary: result.rows[0],
      recentMovements: recentMovements.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
