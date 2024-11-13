const express = require("express");
const sgMail = require("@sendgrid/mail");
const emails = express.Router();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

emails.post("/sendEmail", async (req,res,next) => {
    try{
        const {email, subject, text} = req.body
    const msg = {
        to: email,
        from: process.env.SENDGRID_SENDER,
        subject,
        text,
      }
      await sgMail.send(msg);

      res.status(200).send({statusCode:200, message: "Email sent successfully"})
    }
    catch(error) {
        next(error)
    }


})

module.exports = emails;