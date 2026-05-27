const crypto = require("crypto");

const pool = require("./db/pool");

const TOKEN_TTL_MS = 1000 * 60 * 60 * 8;
const sessions = new Map();

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!password || !storedHash || !storedHash.includes(":")) return false;

  const [salt, hash] = storedHash.split(":");
  const candidate = hashPassword(password, salt).split(":")[1];
  if (hash.length !== candidate.length) return false;

  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString("hex");

  sessions.set(token, {
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    },
    expiresAt: Date.now() + TOKEN_TTL_MS
  });

  return token;
}

function destroySession(token) {
  if (token) sessions.delete(token);
}

function readToken(req) {
  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) return "";

  return token;
}

async function findUserByUsername(username) {
  const result = await pool.query(
    "SELECT id, username, password_hash, role FROM app_users WHERE username = $1",
    [username]
  );

  return result.rows[0] || null;
}

function requireAuth(req, res, next) {
  const token = readToken(req);
  const session = sessions.get(token);

  if (!session || session.expiresAt <= Date.now()) {
    if (token) sessions.delete(token);

    return res.status(401).json({
      message: "Please log in to continue."
    });
  }

  req.user = session.user;
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have access to perform this action."
      });
    }

    return next();
  };
}

module.exports = {
  createSession,
  destroySession,
  findUserByUsername,
  hashPassword,
  requireAuth,
  requireRole,
  verifyPassword
};
