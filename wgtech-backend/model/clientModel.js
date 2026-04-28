const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      unique: false,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    phone: String,
    company: String,
    address: String,

    // Project Information
    projectName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "On Hold", "Completed"],
      default: "Not Started",
    },
    budget: Number,
    description: String,

    // Worker Assignment
    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedDepartment: {
      type: String,
      default: null,
    },

    // Progress Media
    progressMedia: [
      {
        type: {
          type: String,
          enum: ["image", "video"],
        },
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    // Documents
    documents: [
      {
        name: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    // Comments
    comments: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        authorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        authorName: String,
        text: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        visibility: {
          type: String,
          enum: ["all", "admin_only", "worker_only"],
          default: "all",
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: "clients",
  }
);

// ✅ Password hashing middleware
const bcrypt = require("bcryptjs");

clientSchema.pre("save", async function (next) {
  // Only hash if password is modified
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Create indexes for performance
clientSchema.index({ assignedWorker: 1 });
clientSchema.index({ assignedDepartment: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ createdAt: -1 });
// ✅ userId should be unique ONLY when not null (sparse index)
clientSchema.index({ userId: 1 }, { unique: true, sparse: true });
clientSchema.index({ email: 1 });
clientSchema.index({ username: 1 });

module.exports = mongoose.models.Client || mongoose.model("Client", clientSchema);
