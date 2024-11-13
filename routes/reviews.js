const express = require("express");
const ReviewsModel = require("../models/ReviewsModel");
const UsersModel = require("../models/UsersModel");
const DestinationModel = require("../models/DestinationModel");
const checkUserRole = require("../middlewares/checkUserRole");
const verifyToken = require("../middlewares/verifyToken");
const verifyReviewOwnership = require("../middlewares/verifyReviewOwnerShip");
const reviews = express.Router();

reviews.get("/reviews", async (req, res, next) => {
  try {
    const reviews = await ReviewsModel.find().populate({ path: "user", select: "name surname" }).populate({path: "destination", select: "name" });
    if (reviews.length === 0) {
      return res
        .status(404)
        .send({ statusCode: 404, message: "No reviews found" });
    }

    
    return res.status(200).json({
      statusCode: 200,
      message: `${reviews.length} reviews found successfully`,
      data: reviews, 
    });
  } catch (error) {
    next(error);
  }
});

reviews.get("/reviews/:reviewId", async (req, res, next) => {
  const { reviewId } = req.params;
  try {
    const review = await ReviewsModel.findById(reviewId).populate({ path: "user", select: "name surname" });;
    if (!review) {
      res
        .status(404)
        .send({
          statusCode: 404,
          message: "No reviews found with the given id",
        });
    }

    res
      .status(200)
      .send({ statusCode: 200, message: "Review found successfully", review });
  } catch (error) {
    next(error);
  }
});

reviews.post("/reviews/create", async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const user = await UsersModel.findOne({ _id: req.body.user });
    const destination = await DestinationModel.findOne({
      _id: req.body.destination,
    });

    const newReview = new ReviewsModel({
      user: user._id,
      destination: destination._id,
      rating: rating,
      comment: comment,
    });

    const savedReview = await newReview.save();
    await DestinationModel.updateOne(
      { _id: destination._id },
      { $push: { reviews: savedReview } }
    );
    await UsersModel.updateOne(
      { _id: user._id },
      { $push: { reviews: savedReview } }
    );

    res
      .status(201)
      .send({
        statusCode: 201,
        message: "Review created successfully",
        savedReview,
      });
  } catch (error) {
    next(error);
  }
});

reviews.patch("/reviews/update/:reviewId", verifyToken, verifyReviewOwnership, async (req, res, next) => {
    const { reviewId } = req.params;
  
    try {
      const updatedData = req.body;
      const options = { new: true };  
  
      const result = await ReviewsModel.findByIdAndUpdate(reviewId, updatedData, options);
  
      if (!result) {
        return res.status(404).json({ statusCode: 404, message: "Review not found" });
      }
  
      res.status(200).json({ statusCode: 200, message: "Review updated successfully", result });
    } catch (error) {
      next(error);
    }
  });
  
  

  reviews.delete("/reviews/delete/:reviewId", verifyToken , verifyReviewOwnership, async (req, res, next) => {
    const { reviewId } = req.params;
    try {
      await ReviewsModel.findByIdAndDelete(reviewId);
      res.status(200).send({ statusCode: 200, message: "Review deleted successfully" });
    } catch (error) {
      next(error);
    }
  });
  

module.exports = reviews;
