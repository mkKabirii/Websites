const Review = require("../model/reviewsModel");
const { successHandler } = require("../utils/helper");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { schemaValidator } = require("../utils/schemaValidator");
const { createReviewSchema } = require("../utils/validation");
const { buildReviewSubmittedEmail } = require("../utils/emailTemplates");
const { enqueueEmail } = require("../utils/emailQueue");
const { notifyAdmins } = require("../utils/notificationService");

// Create Review
const createReview = catchAsync(async (req, res, next) => {
  const [error, validatedData] = schemaValidator(req.body, createReviewSchema);
  if (error) {
    return next(new AppError(error, 400));
  }

  const { userInfo, rating, review, status } = validatedData;

  const reviewData = await Review.create({
    userInfo,
    rating,
    review,
    status
  });

  try {
    if (userInfo?.email) {
      const reviewTemplate = buildReviewSubmittedEmail({
        partnerName: userInfo?.name || userInfo?.fullname || "Partner",
      });

      enqueueEmail({
        to: userInfo.email,
        subject: reviewTemplate.subject,
        message: reviewTemplate.message,
      });
    }
  } catch (emailError) {
    console.error("Error sending review feedback email:", emailError.message);
  }

  notifyAdmins({
    title: "New client review",
    message: `${userInfo?.name || userInfo?.email || "A client"} submitted feedback.`,
    type: "system",
    entityId: reviewData._id,
    entityType: "Review",
    link: "/reviews",
    metadata: {
      rating,
      email: userInfo?.email,
    },
  }).catch((notificationError) => {
    console.error("Review notification failed:", notificationError.message);
  });

  successHandler(res, reviewData, "Review created successfully", 201);
});

// Get All Reviews
const getAllReviews = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status, rating } = req.query;
  
  let filter = {};
  if (status) filter.status = status;
  if (rating) filter.rating = parseInt(rating);

  const reviews = await Review.find(filter)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await Review.countDocuments(filter);

  successHandler(res, {
    reviews,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total
  }, "Reviews retrieved successfully");
});

// Get Review by ID
const getReviewById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const review = await Review.findById(id);

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  successHandler(res, review, "Review retrieved successfully");
});

// Update Review
const updateReview = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const review = await Review.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  successHandler(res, review, "Review updated successfully");
});

// Delete Review
const deleteReview = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const review = await Review.findByIdAndDelete(id);

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  successHandler(res, null, "Review deleted successfully");
});

// Toggle Review Status
const toggleReviewStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const review = await Review.findById(id);
  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  review.status = review.status === 'active' ? 'inactive' : 'active';
  await review.save();

  successHandler(res, review, `Review ${review.status} successfully`);
});

// Get Active Reviews
const getActiveReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ status: 'active' })
    .sort({ createdAt: -1 });

  successHandler(res, reviews, "Active reviews retrieved successfully");
});

module.exports = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  toggleReviewStatus,
  getActiveReviews
};
