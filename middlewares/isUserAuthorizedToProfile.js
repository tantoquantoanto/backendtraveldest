const jwt = require("jsonwebtoken");

const isUserAuthorizedToProfile = (req, res, next) => {
    const authorizationHeader = req.header("Authorization");
    const token = authorizationHeader && authorizationHeader.split(" ")[1];

    if (!token) {
        return res.status(403).send({ statusCode: 403, message: "Sorry, you are unauthorized" });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.userId;

        // Verifico se l'ID utente nella richiesta corrisponde a quello nel token
        if (userId !== req.params.userId) {
            return res.status(403).send({ statusCode: 403, message: "You cannot access this profile" });
        }

        next();
    } catch (error) {
        return res.status(403).send({ statusCode: 403, message: "Invalid or expired token" });
    }
};

module.exports = isUserAuthorizedToProfile;
