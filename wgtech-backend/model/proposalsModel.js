const mongoose = require("mongoose");
const { Schema } = mongoose;

const proposalSchema = new Schema(
  {
    proposalId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    // Existing fields ke saath yeh add karo:
    nationalId: {
      type: String,
      default: null,
    },
    document: {
      type: String, // file ka URL/path save hoga
      default: null,
    },
    company: {
      type: String,
      trim: true,
      default: null,
    },
    services: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Service",
      default: [],
    },
    subServices: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "SubService",
      default: [],
    },
    budget: {
      type: String,
      default: null,
    },
    messages: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "In Progress", "Completed"],
      default: "Pending",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "proposals", // collection ka naam
  },
);

// Ensure collection is created
mongoose.model("Proposal", proposalSchema).createCollection();

const Proposal =
  mongoose.models.Proposal || mongoose.model("Proposal", proposalSchema);
module.exports = Proposal;
