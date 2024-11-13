const express = require("express");
const UsersModel = require("../models/UsersModel");
const login = express.Router();
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')



login.post("/login", async (req, res) => {
  try {
    const user = await UsersModel.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).send({
        statusCode: 404,
        message: "No users found with the given email",
      });
    }

    const isPasswordValid = await bcrypt.compare(req.body.password, user.password)
    if (!isPasswordValid) {
        return res
            .status(401)
            .send({
                statusCode: 401,
                message: 'Email or password not valid!'
            })
    }

    const token = jwt.sign({
        role: user.role,
        userName: user.username,
        dob: user.dob,
        userId: user._id,
        likedDestinations: user.likedDestinations,
        createdAt: user.createdAt
    }, process.env.JWT_SECRET, {
        expiresIn: '20m'
    })

    res
        .header('Authorization', token)
        .status(200)
        .send({
            statusCode: 200,
            message: 'Login successfully',
            token
        })
} catch (error) {
    next(error)
}
});

module.exports = login;


