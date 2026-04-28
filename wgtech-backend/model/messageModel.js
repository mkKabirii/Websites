const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Can reference either User or Client - senderType determines which
    },
    senderType: {
      type: String,
      enum: ["User", "Client"],
      default: "User",
    },
    messageType: {
      type: String,
      enum: ["text", "file", "image", "document", "call", "status_update", "quotation"],
      default: "text",
    },
    content: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    documentUrl: {
      type: String,
      default: null,
    },
    documentName: {
      type: String,
      default: null,
    },
    callDuration: {
      type: Number,
      default: null, // in seconds
    },
    callType: {
      type: String,
      enum: ["voice", "video", null],
      default: null,
    },
    callStatus: {
      type: String,
      enum: ["initiated", "accepted", "rejected", "ended", "missed", null],
      default: null,
    },
    statusUpdate: {
      projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Proposal",
      },
      oldStatus: String,
      newStatus: {
        type: String,
        enum: ["Rejected", "Approved", "Completed", "Under Review"],
      },
      description: String,
    },
    quotationData: {
      _id: String,
      title: String,
      subTitle: String,
      shortDescription: String,
      longDescription: String,
      image: String,
      postedOn: Date,
      items: [
        {
          description: String,
          unitPrice: Number,
          quantity: Number,
        },
      ],
      currency: String,
      totalAmount: Number,
      advanceRequired: Number,
      createdBy: mongoose.Schema.Types.ObjectId,
      createdAt: Date,
    },
    isAutoReply: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    editHistory: [
      {
        content: String,
        editedAt: Date,
      },
    ],
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: Date,
      },
    ],
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: String,
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "messages",
  }
);

// Index for faster queries
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ createdAt: -1 });

// Pre-save middleware to ensure senderType is set
messageSchema.pre("save", function(next) {
  if (!this.senderType) {
    this.senderType = "User"; // Default to User for backward compatibility
  }
  next();
});

// Pre-find middleware to ensure senderType is set for existing documents
messageSchema.pre(/^find/, function(next) {
  if (!this.options.skipSenderTypeDefault) {
    // This runs before querying - we can't modify the results here
    // But we've set the default in schema, so it should be fine
  }
  next();
});

module.exports = mongoose.model("Message", messageSchema);
