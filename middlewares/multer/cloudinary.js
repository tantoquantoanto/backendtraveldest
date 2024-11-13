const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
})


const cloudStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "TRAVELSERVERUPLOADS",
        allowed_formats: ['jpg', 'png', 'gif' ,'mp4'],
        format: async(req, file) => 'png',
        public_id: (req, file) => file.name

    }
})


module.exports = cloudStorage;