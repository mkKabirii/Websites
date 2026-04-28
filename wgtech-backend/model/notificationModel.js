const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "proposal",
        "proposal_status",
        "application",
        "application_status",
        "chat_message",
        "task",
        "quotation",
        "system",
      ],
      default: "system",
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ["admin", "worker", "client", "user", "all"],
      default: "admin",
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "actorModel",
      default: null,
    },
    actorModel: {
      type: String,
      enum: ["User", "Client"],
      default: "User",
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    entityType: {
      type: String,
      default: "",
      trim: true,
    },
    link: {
      type: String,
      default: "",
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: "notifications",
  },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, createdAt: -1 });
notificationSchema.index({ "readBy.userId": 1 });

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
