const badRequestHandler = (err,req,res,next) => {
    if(err.status === 400) {
        res.
        status(400)
        .send({
            statusCode: 400,
            message: err.message,
            errors: err.errorList.map((e) => e.msg),

        })
    } else {
        next(err)
    }
}


module.exports = badRequestHandler