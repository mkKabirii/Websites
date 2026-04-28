const express = require("express");
const quotationsController = require("../controllers/quotationsController");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/documents");
    // Create directory if it doesn't exist
    const fs = require("fs");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Protect all routes
router.use(protect);

// Get all quotations (role-based)
router.get("/", quotationsController.getQuotations);

// Get single quotation
router.get("/:quotationId", quotationsController.getQuotationById);

// Create quotation
router.post("/", quotationsController.createQuotation);

// Update quotation
router.put("/:quotationId", quotationsController.updateQuotation);

// Send quotation to client
router.post("/:quotationId/send", quotationsController.sendQuotation);

// Client submit signed quotation
router.post(
  "/:quotationId/submit",
  upload.fields([
    { name: "signature", maxCount: 1 },
    { name: "nationalIdFront", maxCount: 1 },
    { name: "nationalIdBack", maxCount: 1 },
    { name: "paymentProof", maxCount: 1 },
  ]),
  quotationsController.submitSignedQuotation
);

// Admin confirms submission proofs and notifies client
router.put("/:quotationId/confirm", quotationsController.confirmSubmission);

// Approve quotation and assign worker
router.put("/:quotationId/approve", quotationsController.approveQuotation);

// Reject quotation
router.put("/:quotationId/reject", quotationsController.rejectQuotation);

// Delete quotation
router.delete("/:quotationId", quotationsController.deleteQuotation);

module.exports = router;
