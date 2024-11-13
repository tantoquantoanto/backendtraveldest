const jwt = require("jsonwebtoken")

const verifyToken = (req, res, next) => {
    const authorizationHeader = req.header("Authorization")
    const token = authorizationHeader && authorizationHeader.split(" ")[1];
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.userId };  
      next();
    } catch (error) {
      res.status(401).send({ statusCode: 401, message: "Invalid or expired token" });
    }
  };
  
  module.exports = verifyToken