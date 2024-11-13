const multer = require("multer")
const { v4: uuidv4 } = require('uuid');
const path = require("path")




const internalStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads")
    },
    filename: (req, file, cb) => {
        const uniqueSuffix =  `${Date.now()}-${Math.round(Math.random() * 1E9)}`
        const fileExtension = file.originalname.split(".").pop();
        cb(null, `${file.fieldname}-${uniqueSuffix}.${fileExtension}`)
    },
   
})


module.exports = internalStorage;