const express = require("express");
const DestinationModel = require("../models/DestinationModel");
const destinations = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const internalStorage = require("../middlewares/multer/internalStorage");
const cloudStorage = require("../middlewares/multer/cloudinary");
const checkUserRole = require("../middlewares/checkUserRole");
const isUserAdmin = require("../middlewares/isUserAdmin");
const isUserUser = require("../middlewares/isUserUser");
const sendApprovalEmail = require("../middlewares/sendApprovalEmail")
const UsersModel = require("../models/UsersModel");


destinations.put(
  "/destinations/approve/:destinationId",
  checkUserRole,
  isUserAdmin,
  async (req, res, next) => {
    const { destinationId } = req.params;
    const approval = req.body;

    try {
      const updatedDestination = await DestinationModel.findByIdAndUpdate(
        destinationId,
        approval,
        { new: true }
      ).populate({ path: "user", select: "name surname email" }); 

      if (updatedDestination) {
        const message = approval.approved
          ? "Destinazione approvata con successo"
          : "Destinazione scartata con successo";

       
        const user = updatedDestination.user;
        if (user) {
          const emailContent = {
            email: user.email,
            name: user.name,
          };

          try {
            await sendApprovalEmail({
              email: emailContent.email,
              name: emailContent.name,
              approved: approval.approved,
            });
          } catch (error) {
            console.error("Errore nell'invio dell'email:", error);
          
          }
        }

        res.status(200).json({ message, updatedDestination });
      } else {
        res.status(404).json({ message: "Destinazione non trovata" });
      }
    } catch (error) {
      next(error);
    }
  }
);


const cloud = multer({ storage: cloudStorage });

const upload = multer({
  storage: internalStorage,
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = ["image/png", "image/jpeg", "image/webp"];
    console.log(file.mimetype);
    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("This type of file is not allowed"), false);
    }
  },
});

destinations.post(
  "/destinations/upload/cloud",
  cloud.single("img"),
  async (req, res, next) => {
    try {
      res.status(200).json({ img: req.file.path });
    } catch (error) {
      next(error);
    }
  }
);

destinations.post(
  "/destinations/upload",
  upload.single("img"),
  async (req, res, next) => {
    const url = `${req.protocol}://${req.get("host")}`;
    try {
      const imgUrl = req.file.filename;

      res.status(200).json({
        img: `${url}/uploads/${imgUrl}`,
      });
    } catch (error) {
      console.log(error.message);
    }
  }
);
// fetch per destinations approved

destinations.get("/destinations",  async (req, res, next) => {
  const { page = 1, pageSize = 12 } = req.query;

  const query =  { approved: true };

  try {
    const totalDestinations = await DestinationModel.countDocuments(query);
    const totalPages = Math.ceil(totalDestinations / pageSize);
    const destinations = await DestinationModel.find(query)
      .limit(pageSize)
      .skip((page - 1) * pageSize)
      .populate({ path: "reviews" })
      .populate({ path: "user", select: "name surname email" });

    if (destinations.length === 0) {
      return res
        .status(404)
        .send({ statusCode: 404, message: "No destinations found" });
    }

    res.status(200).send({
      statusCode: 200,
      message: `${destinations.length} destinations found successfully`,
      totalDestinations: totalDestinations,
      totalPages: totalPages,
      destinations,
    });
  } catch (error) {
    next(error);
  }
});


// route per le not approved, solo per gli admin


destinations.get("/destinations/notapproved", checkUserRole, isUserAdmin, async (req, res, next) => {
  const { page = 1, pageSize = 12 } = req.query;

  const query =  { approved: false };

  try {
    const totalDestinations = await DestinationModel.countDocuments(query);
    const totalPages = Math.ceil(totalDestinations / pageSize);
    const destinations = await DestinationModel.find(query)
      .limit(pageSize)
      .skip((page - 1) * pageSize)
      .populate({ path: "reviews" })
      .populate({ path: "user", select: "name surname" });

    if (destinations.length === 0) {
      return res
        .status(404)
        .send({ statusCode: 404, message: "No destinations found" });
    }

    res.status(200).send({
      statusCode: 200,
      message: `${destinations.length} destinations found successfully`,
      totalDestinations: totalDestinations,
      totalPages: totalPages,
      destinations,
    });
  } catch (error) {
    next(error);
  }
});



destinations.get("/destinations/:destinationId",   async (req, res, next) => {
  const { destinationId } = req.params;

   
  try {
    const destination = await DestinationModel.findById(destinationId)
      .populate({ path: "reviews" })
      .populate({
        path: "reviews",
        populate: {
          path: "user",
          select: "name surname",
        },
      });
    if (!destination) {
      res.status(404).send({
        statusCode: 404,
        message: "No destination found with the given id",
      });
    }
    res.status(200).send({
      statusCode: 200,
      message: "Destination found successfully",
      destination,
    });
  } catch (error) {
    next(error);
  }
});

destinations.get("/destinations/category/:category", async (req, res, next) => {
  const { category } = req.params;
  try {
    const destinations = await DestinationModel.find({
      category: { $regex: new RegExp(category, "i") }, // Case insensitive
    });
    if (destinations.length === 0) {
      return res.status(404).send({
        statusCode: 404,
        message: "No destinations found for the given category",
      });
    }
    res.status(200).send({
      statusCode: 200,
      message: "Destinations found successfully",
      destinations,
    });
  } catch (error) {
    next(error);
  }
});

destinations.get(
  "/destinations/name/:name", 
  checkUserRole,
  async (req, res, next) => {
    const { name } = req.params;
    const { page = 1, pageSize = 6 } = req.query;

    const keywordsRegex = new RegExp(name.split(" ").map(word => `(?=.*${word.trim()})`).join(""), "i");

    const query = {
      ...(req.userRole !== "admin" ? { approved: true } : {}),
      name: keywordsRegex
    };

    try {
      const totalDestinations = await DestinationModel.countDocuments(query);
      const totalPages = Math.ceil(totalDestinations / pageSize);

      const destinations = await DestinationModel.find(query)
        .limit(pageSize)
        .skip((page - 1) * pageSize)
        .populate({ path: "reviews" })
        .populate({ path: "user", select: "name surname" });

      if (destinations.length === 0) {
        return res.status(404).send({
          statusCode: 404,
          message: "No destinations found with the given name",
        });
      }

      res.status(200).send({
        statusCode: 200,
        message: "Destinations found successfully",
        totalDestinations,
        totalPages,
        destinations,
      });
    } catch (error) {
      next(error);
    }
  }
);



destinations.post("/destinations/create", async (req, res, next) => {
  try {
    const { name, description, location, category, img } = req.body;
    const newDestination = new DestinationModel({
      name: name,
      description: description,
      location: location,
      category: category,
      img: img,
      approved: false,
    });

    const savedDestination = await newDestination.save();

    res.status(201).send(savedDestination);
  } catch (error) {
    next(error);
  }
});

destinations.patch(
  "/destinations/update/:destinationId",
  checkUserRole,
  isUserAdmin,
  async (req, res, next) => {
    const { destinationId } = req.params;
    try {
      const updatedData = req.body;
      const options = { new: true };

      const result = await DestinationModel.findByIdAndUpdate(
        destinationId,
        updatedData,
        options
      );

      if (!result) {
        return res
          .status(404)
          .send({ statusCode: 404, message: "Destination not found" });
      }

      res.status(200).send({
        statusCode: 200,
        message: "Destination updated successfully",
        destination: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

destinations.patch("/destinations/updateModel", async (req, res, next) => {
  await DestinationModel.updateMany(
    { approved: { $exists: false } },
    { $set: { approved: false } }
  );
});

destinations.delete(
  "/destinations/delete/:destinationId",
  checkUserRole,
  isUserAdmin,
  async (req, res, next) => {
    const { destinationId } = req.params;

    try {
      const deletedDestination = await DestinationModel.findByIdAndDelete(
        destinationId
      );
      if (!deletedDestination) {
        return res
          .status(404)
          .send({ statusCode: 404, message: "Destination not found" });
      }
      res.status(200).send({
        statusCode: 200,
        message: "Destination deleted successfully",
        destinationId,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = destinations;
