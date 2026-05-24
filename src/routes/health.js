const express = require("express");
const pool = require("../db/pool");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      database: "unreachable",
      message: error.message
    });
  }
});

module.exports = router;
