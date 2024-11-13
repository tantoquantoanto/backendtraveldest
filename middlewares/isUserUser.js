

const isUserUser = (req, res, next) => {
    if (req.userRole !== "user") {
        return res.status(403).json({ statusCode: 403, message: "Access denied, users only" });
    }
    next();
};

module.exports = isUserUser;