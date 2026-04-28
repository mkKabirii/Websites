const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createProposal,
  getAllProposals,
  getProposalById,
  updateProposal,
  updateProposalStatus,
  deleteProposal,
  sendProposalEmail 
} = require("../controllers/proposalsController");

const router = express.Router();

router.post("/", createProposal);
router.get("/", protect, getAllProposals);
router.get("/:id", protect, getProposalById);
router.put("/:id", protect, updateProposal);
router.patch("/:id/status", protect, updateProposalStatus);
router.delete("/:id", protect, deleteProposal);
router.post("/:id/send-email", protect, sendProposalEmail);

module.exports = router;

