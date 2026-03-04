const jwt = require("jsonwebtoken");

const createToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      anonName: user.anon_name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      email: payload.email,
      anonName: payload.anonName,
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { createToken, requireAuth };
