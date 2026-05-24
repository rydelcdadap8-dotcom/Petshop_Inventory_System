const express = require("express");
const pool = require("../db/pool");

const router = express.Router();

function normalizeProduct(body) {
  return {
    name: typeof body.name === "string" ? body.name.trim() : "",
    category: typeof body.category === "string" ? body.category.trim() : "",
    quantity: Number(body.quantity),
    price: Number(body.price),
    supplier: typeof body.supplier === "string" ? body.supplier.trim() : "",
    description: typeof body.description === "string" ? body.description.trim() : ""
  };
}

function validateProduct(product) {
  if (!product.name) return "Product name is required.";
  if (!product.category) return "Category is required.";
  if (!Number.isInteger(product.quantity) || product.quantity < 0) {
    return "Quantity must be a whole number of 0 or more.";
  }
  if (!Number.isFinite(product.price) || product.price < 0) {
    return "Price must be 0 or more.";
  }

  return null;
}

router.get("/", async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";

    const filters = [];
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      filters.push(`(name ILIKE $${values.length} OR supplier ILIKE $${values.length})`);
    }

    if (category) {
      values.push(category);
      filters.push(`category = $${values.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const result = await pool.query(
      `
        SELECT id, name, category, quantity, price, supplier, description, created_at, updated_at
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
        SELECT id, name, category, quantity, price, supplier, description, created_at, updated_at
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
        INSERT INTO products (name, category, quantity, price, supplier, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, category, quantity, price, supplier, description, created_at, updated_at
      `,
      [
        product.name,
        product.category,
        product.quantity,
        product.price,
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
          quantity = $3,
          price = $4,
          supplier = $5,
          description = $6,
          updated_at = NOW()
        WHERE id = $7
        RETURNING id, name, category, quantity, price, supplier, description, created_at, updated_at
      `,
      [
        product.name,
        product.category,
        product.quantity,
        product.price,
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

module.exports = router;
