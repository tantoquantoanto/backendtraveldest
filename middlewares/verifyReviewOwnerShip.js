const ReviewsModel = require("../models/ReviewsModel");


const verifyReviewOwnership = async (req, res, next) => {
    try {
      const review = await ReviewsModel.findById(req.params.reviewId);
      if (!review) {
        return res.status(404).send({ statusCode: 404, message: "Review not found" });
      }
  
      // Controllo se l'id dell'utente corrisponde a quello dell'utente che ha lasciato la recensione
      if (review.user.toString() !== req.user.id) {
        return res.status(403).send({ statusCode: 403, message: "You are not authorized to access this review" });
      }
  
      next();
    } catch (error) {
      console.error(error); 
      return res.status(500).send({ statusCode: 500, message: "Server error while verifying review ownership" });
    }
  };
  
  module.exports = verifyReviewOwnership;
  