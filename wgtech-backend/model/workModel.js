const mongoose = require("mongoose");

const workSchema = new mongoose.Schema(
  {
    workCategory: {
      type: String,
      required: true,
      trim: true,
    },
    categoryDescription: {
      type: String,
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
    },
    subServiceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubService",
        default: null,
      },
    ],
    works: [
      {
        image: {
          type: [String],
          required: true,
        },
        title: {
          type: String,
          required: true,
          trim: true,
        },
        url: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        purpose:{
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ["Active", "Inactive", "active", "inactive"],
          default: "Active",
        }
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
    collection: "works",
  }
);

// Ensure collection is created
mongoose.model("Work", workSchema).createCollection();

module.exports = mongoose.model("Work", workSchema);
