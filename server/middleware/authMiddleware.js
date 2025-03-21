const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1]; // Token extract karo
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Token verify karo
      req.user = await User.findById(decoded.id).select("-password"); // User ka data lao (password ke bina)
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

// ✅ Directly export protect function
module.exports = protect;
