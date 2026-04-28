const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createApplication,
  getAllApplications,
  getApplicationById,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
  getApplicationsByStatus,
} = require("../controllers/applicationsController");

const router = express.Router();

// Public Routes
router.post("/", createApplication); // Anyone can submit application

// Protected Routes (Admin only)
router.get("/", protect, getAllApplications);
router.get("/status/:status", protect, getApplicationsByStatus);
router.get("/:id", protect, getApplicationById);
router.put("/:id", protect, updateApplication);
router.put("/status/:id", protect, updateApplicationStatus);
router.delete("/:id", protect, deleteApplication);

module.exports = router;

