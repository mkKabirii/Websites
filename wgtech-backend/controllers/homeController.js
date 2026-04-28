const Service = require("../model/serviceModel");
const Review = require("../model/reviewsModel");
const FAQ = require("../model/faqModel");
const Advertisement = require("../model/advertisementModel");
const Settings = require("../model/settingsModal");
const { successHandler } = require("../utils/helper");
const catchAsync = require("../utils/catchAsync");

// Get Home Data - Latest 3 Services, All Reviews, All FAQs
const getHomeData = catchAsync(async (req, res, next) => {
  // Get latest 3 services (sorted by createdAt descending)
  const services = await Service.find({ status: "Active" })
    .sort({ createdAt: -1 })
    .limit(3);

  // Get all reviews (active only)
  const reviews = await Review.find({ status: "active" }).sort({
    createdAt: -1,
  });

  // Get all FAQs
  const faqs = await FAQ.find().sort({ createdAt: -1 });

  // Get active advertisements with images
  const advertisements = await Advertisement.find({ status: "Active" })
    .select("image")
    .sort({ createdAt: -1 });

  const settings = await Settings.findOne().sort({ createdAt: -1 });
  const homeStats = settings?.homeStats || [];

  successHandler(
    res,
    {
      services,
      reviews,
      faqs,
      advertisements,
      homeStats,
    },
    "Home data retrieved successfully",
  );
});

module.exports = {
  getHomeData,
};
