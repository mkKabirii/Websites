const express = require("express");
const clientsController = require("../controllers/clientsController");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/progress");
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

// Get all clients
router.get("/", clientsController.getClients);

// Get single client
router.get("/:clientId", clientsController.getClientById);

// Create new client
router.post("/", clientsController.createClient);

// Update client details
router.put("/:clientId", clientsController.updateClient);

// Assign worker to client
router.put("/:clientId/assign-worker", clientsController.assignWorker);

// Upload progress media
router.post(
  "/:clientId/media",
  upload.single("file"),
  clientsController.uploadProgressMedia
);

// Upload document
router.post(
  "/:clientId/documents",
  upload.single("file"),
  clientsController.uploadDocument
);

// Add comment
router.post("/:clientId/comments", clientsController.addComment);

// ✅ Generate/Reset client password (admin only)
router.post("/:clientId/generate-password", clientsController.generateClientPassword);

// Delete client
router.delete("/:clientId", clientsController.deleteClient);

module.exports = router;
