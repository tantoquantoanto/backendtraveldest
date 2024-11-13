const mongoose = require("mongoose");

const ReviewsModel = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 

    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination', 
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5, 
    },
    comment: {
      type: String,
      required: true, 
    },
  },
  { timestamps: true, strict: true }
);

module.exports = mongoose.model('Review', ReviewsModel, 'reviews');