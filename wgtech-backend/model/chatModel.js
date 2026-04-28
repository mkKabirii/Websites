const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    chatType: {
      type: String,
      enum: ["website", "admin_work"], // website chat or admin work chat
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // The client/user initiating the chat
    },
    // Link back to Client collection (for accepted proposal context)
    clientRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // For admin work chat, who's handling it
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proposal", // Reference to proposal/project
      default: null,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastMessageTime: {
      type: Date,
      default: null,
    },
    unreadCount: {
      type: Map,
      of: Number, // userId -> unread count
      default: new Map(),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    archivedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Group chat fields
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      default: null,
    },
    groupDescription: {
      type: String,
      default: null,
    },
    groupAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    collection: "chats",
  }
);

// Index for faster queries
chatSchema.index({ clientId: 1, chatType: 1 });
chatSchema.index({ assignedAdmin: 1 });
chatSchema.index({ participants: 1 });
chatSchema.index({ isGroupChat: 1 });
chatSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);
