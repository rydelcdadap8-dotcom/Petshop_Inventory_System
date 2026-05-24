const express = require("express");
const pool = require("../db/pool");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(`
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
      LIMIT 50
    `);

    res.json({
      movements: result.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
