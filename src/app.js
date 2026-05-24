const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const healthRoutes = require("./routes/health");
const itemRoutes = require("./routes/items");
const productRoutes = require("./routes/products");

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
app.use("/api/items", itemRoutes);
app.use("/api/products", productRoutes);

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
