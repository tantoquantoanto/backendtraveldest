const unauthorizedHandler = (err, req, res, next) => {
    if (err.status === 401) {
        res
        .status(401)
        .send({
            statusCode: 401,
            message: err.message || 'Unauthorized',
            errors: err.errorList ? err.errorList.map((e) => e.msg) : [],
        });
    } else {
        next(err);
    }
};

module.exports = unauthorizedHandler;