const express = require("express");

const { requireRole } = require("../auth");
const pool = require("../db/pool");
const { buildPurchaseInsight } = require("../purchaseInsights");

const router = express.Router();
const orderStatuses = ["pending", "preparing", "completed", "cancelled"];
const paymentMethods = ["gcash", "cod"];

function orderColumns() {
  return `
    co.id,
    co.user_id,
    au.username,
    co.product_id,
    co.product_name,
    co.quantity,
    co.unit_price,
    co.total_amount,
    co.payment_method,
    co.status,
    co.purchase_insight,
    co.created_at,
    co.updated_at
  `;
}

function normalizeOrder(row) {
  return {
    ...row,
    unit_price: Number(row.unit_price || 0),
    total_amount: Number(row.total_amount || 0)
  };
}

router.get("/", async (req, res, next) => {
  try {
    const values = [];
    let whereClause = "";

    if (req.user.role !== "admin") {
      values.push(req.user.id);
      whereClause = "WHERE co.user_id = $1";
    }

    const result = await pool.query(
      `
        SELECT ${orderColumns()}
        FROM customer_orders co
        JOIN app_users au ON au.id = co.user_id
        ${whereClause}
        ORDER BY co.created_at DESC
        LIMIT 50
      `,
      values
    );

    return res.json({
      orders: result.rows.map(normalizeOrder)
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireRole("user"), async (req, res, next) => {
  const client = await pool.connect();

  try {
    const productId = Number(req.body.productId);
    const quantity = Number(req.body.quantity);
    const paymentMethod = typeof req.body.paymentMethod === "string" ? req.body.paymentMethod : "";

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        message: "Product is required."
      });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        message: "Order quantity must be a whole number greater than 0."
      });
    }

    if (!paymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        message: "Choose GCash or Cash on Delivery."
      });
    }

    await client.query("BEGIN");

    const productResult = await client.query(
      `
        SELECT id, name, category, unit, quantity, price
        FROM products
        WHERE id = $1
        FOR UPDATE
      `,
      [productId]
    );

    if (!productResult.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Product not found."
      });
    }

    const product = productResult.rows[0];
    const previousQuantity = Number(product.quantity);
    const newQuantity = previousQuantity - quantity;

    if (newQuantity < 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Order quantity cannot be higher than available stock."
      });
    }

    const unitPrice = Number(product.price || 0);
    const totalAmount = unitPrice * quantity;
    const purchaseInsight = buildPurchaseInsight(product);

    await client.query(
      "UPDATE products SET quantity = $1, updated_at = NOW() WHERE id = $2",
      [newQuantity, product.id]
    );

    const orderResult = await client.query(
      `
        INSERT INTO customer_orders (
          user_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          total_amount,
          payment_method,
          status,
          purchase_insight
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
        RETURNING *
      `,
      [
        req.user.id,
        product.id,
        product.name,
        quantity,
        unitPrice,
        totalAmount,
        paymentMethod,
        JSON.stringify(purchaseInsight)
      ]
    );

    await client.query(
      `
        INSERT INTO stock_movements (
          product_id,
          movement_type,
          quantity,
          previous_quantity,
          new_quantity,
          remarks
        )
        VALUES ($1, 'stock_out', $2, $3, $4, $5)
      `,
      [
        product.id,
        quantity,
        previousQuantity,
        newQuantity,
        `Customer order #${orderResult.rows[0].id} (${paymentMethod.toUpperCase()})`
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      order: normalizeOrder({
        ...orderResult.rows[0],
        username: req.user.username
      }),
      purchaseInsight
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
});

router.patch("/:id/status", requireRole("admin"), async (req, res, next) => {
  try {
    const status = typeof req.body.status === "string" ? req.body.status : "";

    if (!orderStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status must be pending, preparing, completed, or cancelled."
      });
    }

    const result = await pool.query(
      `
        UPDATE customer_orders
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `,
      [status, req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        message: "Order not found."
      });
    }

    return res.json({
      order: normalizeOrder(result.rows[0])
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
