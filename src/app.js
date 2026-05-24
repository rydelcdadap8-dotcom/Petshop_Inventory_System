const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const healthRoutes = require("./routes/health");
const itemRoutes = require("./routes/items");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "Node.js Aiven Render API",
    status: "running"
  });
});

app.use("/health", healthRoutes);
app.use("/api/items", itemRoutes);

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
