const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    mainAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Quotation Metadata
    title: {
      type: String,
      default: "Untitled Quotation",
    },
    subTitle: String,
    shortDescription: String,
    longDescription: String,
    image: String, // URL to quotation image

    // Quotation Details
    quotationDetails: {
      items: [
        {
          name: String,
          qty: Number,
          rate: Number,
          description: String,
        },
      ],
      totalAmount: Number,
      advanceRequired: Number, // 50% of total
      description: String,
      currency: {
        type: String,
        default: "PKR",
      },
    },

    // Status Tracking
    status: {
      type: String,
      enum: ["pending", "sent", "signed", "approved", "rejected", "paid"],
      default: "pending",
    },

    // Client Submission (after signing)
    clientSubmission: {
      signature: String, // URL to saved signature image
      nationalIdFront: String,
      nationalIdBack: String,
      paymentProof: String,
      submittedAt: Date,
    },

    // Admin confirmation after reviewing client proofs
    submissionConfirmation: {
      confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      confirmedAt: Date,
      note: String,
    },

    // Admin Approval
    adminApproval: {
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvedAt: Date,
      assignedWorker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      assignedDepartment: String,
    },

    // Rejection Info
    rejectionReason: String,
    rejectedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Dates
    expiryDate: Date,
    notes: String,
  },
  {
    timestamps: true,
    collection: "quotations",
  }
);

// Create indexes for performance
quotationSchema.index({ clientId: 1 });
quotationSchema.index({ status: 1 });
quotationSchema.index({ mainAdminId: 1 });
quotationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Quotation", quotationSchema);
