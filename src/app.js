const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const { requireAuth } = require("./auth");
const authRoutes = require("./routes/auth");
const healthRoutes = require("./routes/health");
const itemRoutes = require("./routes/items");
const productRoutes = require("./routes/products");
const dashboardRoutes = require("./routes/dashboard");
const orderRoutes = require("./routes/orders");
const stockMovementRoutes = require("./routes/stockMovements");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api", (req, res) => {
  res.json({
    name: "Petshop Inventory API",
    status: "running"
  });
});

app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/items", requireAuth, itemRoutes);
app.use("/api/products", requireAuth, productRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/orders", requireAuth, orderRoutes);
app.use("/api/stock-movements", requireAuth, stockMovementRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found."
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    message: "Something went wrong."
  });
});

module.exports = app;
