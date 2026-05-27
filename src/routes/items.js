const express = require("express");
const { requireRole } = require("../auth");
const pool = require("../db/pool");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, name, created_at FROM items ORDER BY created_at DESC"
    );

    res.json({
      items: result.rows
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRole("admin"), async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Name is required."
      });
    }

    const result = await pool.query(
      "INSERT INTO items (name) VALUES ($1) RETURNING id, name, created_at",
      [name.trim()]
    );

    return res.status(201).json({
      item: result.rows[0]
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
