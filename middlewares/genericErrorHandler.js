const genericErrorHandler = (err, req, res, next) => {
    res
    .status(err.status || 500)
    .send({
        statusCode: err.status || 500,
        message: err.message || 'Internal Server Error',
        errors: err.errorList ? err.errorList.map((e) => e.msg) : [],
    });
};

module.exports = genericErrorHandler;