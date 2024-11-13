const express = require("express");
const users = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const {CloudinaryStorage} = require("multer-storage-cloudinary");
const internalStorage = require("../middlewares/multer/internalStorage")
const DestinationModel = require("../models/DestinationModel");
const UsersModel = require("../models/UsersModel");
const isUserAdmin = require("../middlewares/isUserAdmin");
const isUserAuthorizedToProfile = require("../middlewares/isUserAuthorizedToProfile");
const sendConfirmationEmail = require("../middlewares/sendConfirmationEmail");
const cloudStorage = require("../middlewares/multer/cloudinary");



const upload = multer({storage: internalStorage, 
    fileFilter: (req, file, cb) => {
        const allowedFileTypes = ["image/png", "image/jpeg"]
        console.log(file.mimetype)
        if (allowedFileTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('This type of file is not allowed'), false); 
        }
    }
})

const cloud = multer({ storage: cloudStorage });

users.post(
  "/users/upload/cloud",
  cloud.single("img"),
  async (req, res, next) => {
    try {
      res.status(200).json({ img: req.file.path });
    } catch (error) {
      next(error);
    }
  }
);


users.post("/users/upload", upload.single("img"), async (req,res,next) => {
    const url = `${req.protocol}://${req.get("host")}`
    try {
        const imgUrl = req.file.filename;
        res
        .status(201)
        .json({
            img: `${url}/uploads/${imgUrl}`
        })
        
    } catch (error) {
        next(error)
        
    }
})


// GET all users
users.get("/users", async (req, res, next) => {
  try {
    const { page, pageSize } = req.query;
    const users = await UsersModel.find()
      .limit(pageSize)
      .skip((page - 1) * pageSize);
    const totalDocuments = await UsersModel.countDocuments();
    const totalPages = Math.ceil(totalDocuments / pageSize);
    if (users.length === 0) {
      return res
        .status(404)
        .send({ statusCode: 404, message: "No users found" });
    }

    res
      .status(200)
      .send({
        statusCode: 200,
        message: `${users.length} users found successfully`,
        totalDocuments: totalDocuments,
        totalPages: totalPages,
        users,
      });
  } catch (error) {
    next(error);
  }
});

// GET user by ID
users.get("/users/:userId", isUserAuthorizedToProfile, async (req, res, next) => {
  const { userId } = req.params;
  try {
    const user = await UsersModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .send({ statusCode: 404, message: "No user found with the given id" });
    }

    res
      .status(200)
      .send({ statusCode: 200, message: "User found successfully", user });
  } catch (error) {
    next(error);
  }
});

// POST create new user
users.post("/users/create",  async (req, res, next) => {
  try {
    const { name, surname, username, email, password, isActive, role, img } =
      req.body;

    const newUser = new UsersModel({
      name,
      surname,
      username,
      email,
      password,
      isActive,
      role,
      img,
    });

    const savedUser = await newUser.save();
    await sendConfirmationEmail({ email: savedUser.email, name: savedUser.name });

    res.status(201).send({
      statusCode: 201,
      message: "User created successfully",
      savedUser,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH update user by ID
users.patch("/users/update/:userId", isUserAuthorizedToProfile, async (req, res, next) => {
  const { userId } = req.params;
  try {
    const updatedData = req.body;
    const options = { new: true };

    const result = await UsersModel.findByIdAndUpdate(
      userId,
      updatedData,
      options
    );
    if (!result) {
      return res
        .status(404)
        .send({ statusCode: 404, message: "User not found" });
    }

    res
      .status(200)
      .send({
        statusCode: 200,
        message: "User updated successfully",
        user: result
      });
  } catch (error) {
    next(error);
  }
});

// DELETE user by ID
users.delete("/users/delete/:userId", isUserAuthorizedToProfile, async (req, res, next) => {
  const { userId } = req.params;
  try {
    const deletedUser = await UsersModel.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res
        .status(404)
        .send({ statusCode: 404, message: "User not found" });
    }

    res
      .status(200)
      .send({ statusCode: 200, message: "User deleted successfully", userId });
  } catch (error) {
    next(error);
  }
});

users.post("/users/:userId/like/:destinationId", async (req, res, next) => {
  const { userId, destinationId } = req.params;
  try {
    const user = await UsersModel.findById(userId);
    if (!user) {
      return res.status(404).send({
        statusCode: 404,
        message: "User not found"
      });
    }

   
    if (!user.likedDestinations.includes(destinationId)) {
      user.likedDestinations.push(destinationId);  
      await user.save();
      return res.status(200).send({
        statusCode: 200,
        message: "Destination added to favorites",
        likedDestinations: user.likedDestinations
      });
    } else {
      return res.status(400).send({
        statusCode: 400,
        message: "Destination already in favorites"
      });
    }
  } catch (error) {
    next(error);
  }
});

users.delete("/users/:userId/like/:destinationId", async (req, res, next) => {
  const { userId, destinationId } = req.params;
  try {
    const user = await UsersModel.findById(userId);
    if (!user) {
      return res.status(404).send({
        statusCode: 404,
        message: "User not found"
      });
    }

    const index = user.likedDestinations.indexOf(destinationId);
    if (index !== -1) {
      user.likedDestinations.splice(index, 1);  
      await user.save();
      return res.status(200).send({
        statusCode: 200,
        message: "Destination removed from favorites",
        likedDestinations: user.likedDestinations
      });
    } else {
      return res.status(400).send({
        statusCode: 400,
        message: "Destination not found in favorites"
      });
    }
  } catch (error) {
    next(error);
  }
});


users.get("/users/:userId/liked-destinations", async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("User ID:", userId); 
    const user = await UsersModel.findById(userId).populate("likedDestinations");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ destinations: user.likedDestinations });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Error retrieving liked destinations" });
  }
});




module.exports = users;
