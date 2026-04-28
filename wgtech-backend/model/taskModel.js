const mongoose = require("mongoose");

const taskUpdateSchema = new mongoose.Schema(
  {
    note: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Blocked"],
      default: "Pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Blocked"],
      default: "Pending",
      index: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true,
    },
    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    updates: {
      type: [taskUpdateSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "tasks",
  },
);

taskSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Task || mongoose.model("Task", taskSchema);
