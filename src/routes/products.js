const express = require("express");
const pool = require("../db/pool");

const router = express.Router();

function normalizeProduct(body) {
  return {
    name: typeof body.name === "string" ? body.name.trim() : "",
    category: typeof body.category === "string" ? body.category.trim() : "",
    sku: typeof body.sku === "string" ? body.sku.trim() : "",
    barcode: typeof body.barcode === "string" ? body.barcode.trim() : "",
    unit: typeof body.unit === "string" ? body.unit.trim() : "pcs",
    quantity: Number(body.quantity),
    costPrice: Number(body.costPrice ?? body.cost_price ?? 0),
    price: Number(body.price),
    lowStockLimit: Number(body.lowStockLimit ?? body.low_stock_limit ?? 5),
    supplier: typeof body.supplier === "string" ? body.supplier.trim() : "",
    description: typeof body.description === "string" ? body.description.trim() : ""
  };
}

function validateProduct(product) {
  if (!product.name) return "Product name is required.";
  if (!product.category) return "Category is required.";
  if (!product.unit) return "Unit is required.";
  if (!Number.isInteger(product.quantity) || product.quantity < 0) {
    return "Quantity must be a whole number of 0 or more.";
  }
  if (!Number.isFinite(product.costPrice) || product.costPrice < 0) {
    return "Cost price must be 0 or more.";
  }
  if (!Number.isFinite(product.price) || product.price < 0) {
    return "Selling price must be 0 or more.";
  }
  if (!Number.isInteger(product.lowStockLimit) || product.lowStockLimit < 0) {
    return "Low stock limit must be a whole number of 0 or more.";
  }

  return null;
}

function productColumns() {
  return `
    id,
    name,
    category,
    sku,
    barcode,
    unit,
    quantity,
    cost_price,
    price,
    low_stock_limit,
    supplier,
    description,
    created_at,
    updated_at
  `;
}

router.get("/", async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";

    const filters = [];
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      filters.push(`(
        name ILIKE $${values.length}
        OR supplier ILIKE $${values.length}
        OR sku ILIKE $${values.length}
        OR barcode ILIKE $${values.length}
      )`);
    }

    if (category) {
      values.push(category);
      filters.push(`category = $${values.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const result = await pool.query(
      `
        SELECT ${productColumns()}
        FROM products
        ${whereClause}
        ORDER BY updated_at DESC
      `,
      values
    );

    res.json({
      products: result.rows
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const result = await pool.query(
      `
        SELECT ${productColumns()}
        FROM products
        WHERE id = $1
      `,
      [req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        message: "Product not found."
      });
    }

    return res.json({
      product: result.rows[0]
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const product = normalizeProduct(req.body);
    const validationError = validateProduct(product);

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    const result = await pool.query(
      `
        INSERT INTO products (
          name,
          category,
          sku,
          barcode,
          unit,
          quantity,
          cost_price,
          price,
          low_stock_limit,
          supplier,
          description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING ${productColumns()}
      `,
      [
        product.name,
        product.category,
        product.sku || null,
        product.barcode || null,
        product.unit,
        product.quantity,
        product.costPrice,
        product.price,
        product.lowStockLimit,
        product.supplier || null,
        product.description || null
      ]
    );

    return res.status(201).json({
      product: result.rows[0]
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const product = normalizeProduct(req.body);
    const validationError = validateProduct(product);

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    const result = await pool.query(
      `
        UPDATE products
        SET
          name = $1,
          category = $2,
          sku = $3,
          barcode = $4,
          unit = $5,
          quantity = $6,
          cost_price = $7,
          price = $8,
          low_stock_limit = $9,
          supplier = $10,
          description = $11,
          updated_at = NOW()
        WHERE id = $12
        RETURNING ${productColumns()}
      `,
      [
        product.name,
        product.category,
        product.sku || null,
        product.barcode || null,
        product.unit,
        product.quantity,
        product.costPrice,
        product.price,
        product.lowStockLimit,
        product.supplier || null,
        product.description || null,
        req.params.id
      ]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        message: "Product not found."
      });
    }

    return res.json({
      product: result.rows[0]
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        message: "Product not found."
      });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/stock", async (req, res, next) => {
  const client = await pool.connect();

  try {
    const movementType = typeof req.body.movementType === "string" ? req.body.movementType : "";
    const quantity = Number(req.body.quantity);
    const remarks = typeof req.body.remarks === "string" ? req.body.remarks.trim() : "";

    if (!["stock_in", "stock_out", "adjustment"].includes(movementType)) {
      return res.status(400).json({
        message: "Movement type must be stock_in, stock_out, or adjustment."
      });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        message: "Stock quantity must be a whole number greater than 0."
      });
    }

    await client.query("BEGIN");

    const current = await client.query(
      "SELECT quantity FROM products WHERE id = $1 FOR UPDATE",
      [req.params.id]
    );

    if (!current.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Product not found."
      });
    }

    const previousQuantity = Number(current.rows[0].quantity);
    let newQuantity = previousQuantity;

    if (movementType === "stock_in") {
      newQuantity = previousQuantity + quantity;
    }

    if (movementType === "stock_out") {
      newQuantity = previousQuantity - quantity;
    }

    if (movementType === "adjustment") {
      newQuantity = quantity;
    }

    if (newQuantity < 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Stock out quantity cannot be higher than current stock."
      });
    }

    const productResult = await client.query(
      `
        UPDATE products
        SET quantity = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING ${productColumns()}
      `,
      [newQuantity, req.params.id]
    );

    const movementResult = await client.query(
      `
        INSERT INTO stock_movements (
          product_id,
          movement_type,
          quantity,
          previous_quantity,
          new_quantity,
          remarks
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, product_id, movement_type, quantity, previous_quantity, new_quantity, remarks, created_at
      `,
      [req.params.id, movementType, quantity, previousQuantity, newQuantity, remarks || null]
    );

    await client.query("COMMIT");

    return res.json({
      product: productResult.rows[0],
      movement: movementResult.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
});

module.exports = router;
