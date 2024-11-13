const jwt = require("jsonwebtoken");


const checkUserRole = (req, res, next) => {
    const authorizationHeader = req.header("Authorization");
    const token = authorizationHeader && authorizationHeader.split(" ")[1];

    
    if (!token) {
        req.userRole = "user"; 
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.userRole = decoded.role;

        next();
    } catch (error) {
        return res.status(401).send({ statusCode: 401, message: "Invalid token" });
    }
};

module.exports = checkUserRole;
