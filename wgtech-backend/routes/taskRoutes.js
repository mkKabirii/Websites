const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getTasks,
  createTask,
  updateTask,
  addTaskUpdate,
} = require("../controllers/taskController");

const router = express.Router();

router.use(protect);

router.get("/", getTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.post("/:id/updates", addTaskUpdate);

module.exports = router;
