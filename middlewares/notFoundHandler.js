const notFoundHandler = (err, req, res, next) => {
    if (err.status === 404) {
        res
        .status(404)
        .send({
            statusCode: 404,
            message: err.message || 'Resource not found',
            errors: err.errorList ? err.errorList.map((e) => e.msg) : [],
        });
    } else {
        next(err);
    }
};

module.exports = notFoundHandler;