const express = require("express");

const {
  createSession,
  destroySession,
  findUserByUsername,
  requireAuth,
  verifyPassword
} = require("../auth");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required."
      });
    }

    const user = await findUserByUsername(username);

    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({
        message: "Invalid username or password."
      });
    }

    const token = createSession(user);

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({
    user: req.user
  });
});

router.post("/logout", requireAuth, (req, res) => {
  const token = (req.get("authorization") || "").split(" ")[1];
  destroySession(token);
  res.status(204).send();
});

module.exports = router;
