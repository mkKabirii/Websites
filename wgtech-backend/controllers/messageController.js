const Message = require("../model/messageModel");
const Chat = require("../model/chatModel");
const AutoReply = require("../model/autoReplyModel");
const ProjectStatus = require("../model/projectStatusModel");
const User = require("../model/userModel");
const Client = require("../model/clientModel");

const getRole = (user) => {
  const storedRole = String(user?.role || "").toLowerCase();
  const designationRole = String(user?.designation?.roleName || "").toLowerCase();
  return storedRole && storedRole !== "user" ? storedRole : designationRole || storedRole;
};

const canAccessChat = (chat, req) => {
  const role = getRole(req.user);
  if (role === "admin") return true;
  const requesterId = String(req.user?._id || "");
  const isParticipant = (chat?.participants || []).some(
    (id) => String(id) === requesterId,
  );
  if (!isParticipant) return false;
  if (role === "worker") return Boolean(chat.isGroupChat);
  return true;
};

const deriveNameFromUrl = (url, fallback) => {
  try {
    const raw = String(url || "").split("?")[0].split("#")[0];
    const lastPart = raw.split("/").pop();
    const decoded = decodeURIComponent(lastPart || "").trim();
    if (!decoded) return fallback;
    return decoded;
  } catch (error) {
    return fallback;
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    let {
      chatId,
      senderId,
      messageType,
      content,
      fileUrl,
      fileName,
      imageUrl,
      documentUrl,
      documentName,
      quotationData,
    } = req.body;

    if (messageType === "document") {
      const safeDocumentName =
        documentName ||
        fileName ||
        (content && String(content).trim()) ||
        deriveNameFromUrl(documentUrl || fileUrl, "Document");
      documentName = safeDocumentName;
      content = safeDocumentName;
    }

    if (messageType === "file") {
      const safeFileName =
        fileName ||
        documentName ||
        (content && String(content).trim()) ||
        deriveNameFromUrl(fileUrl || documentUrl, "File");
      fileName = safeFileName;
      content = safeFileName;
    }

    if (messageType === "image" && (!content || !String(content).trim())) {
      content = fileName || deriveNameFromUrl(imageUrl || fileUrl, "Image");
    }

    if (String(senderId) !== String(req.user?._id)) {
      return res.status(403).json({
        success: false,
        message: "Sender does not match authenticated user",
      });
    }

    const existingChat = await Chat.findById(chatId);
    if (!existingChat || !canAccessChat(existingChat, req)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to send messages in this chat",
      });
    }

    // Determine sender type (User or Client)
    let senderType = "User";
    let sender = await User.findById(senderId);
    
    if (!sender) {
      sender = await Client.findById(senderId);
      if (sender) {
        senderType = "Client";
      }
    }

    const message = new Message({
      chatId,
      senderId,
      senderType,
      messageType,
      content,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      imageUrl: imageUrl || null,
      documentUrl: documentUrl || null,
      documentName: documentName || null,
      quotationData: quotationData || null,
      readBy: [{ userId: senderId, readAt: new Date() }],
    });

    await message.save();

    // Update chat's last message
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      {
        lastMessage: message._id,
        lastMessageTime: new Date(),
      },
      { new: true }
    );

    // Update unread count for all other participants
    const otherParticipants = chat.participants.filter(
      (p) => p.toString() !== senderId.toString()
    );

    otherParticipants.forEach((participantId) => {
      const current = chat.unreadCount.get(participantId.toString()) || 0;
      chat.unreadCount.set(participantId.toString(), current + 1);
    });

    await chat.save();

    // Populate with correct model based on senderType
    let populatedMessage = message;
    if (senderType === "Client") {
      populatedMessage = await message.populate({
        path: "senderId",
        model: "Client",
        select: "_id username email profileImage"
      });
    } else {
      populatedMessage = await message.populate({
        path: "senderId",
        model: "User",
        select: "_id username email profileImage"
      });
    }

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get messages for chat
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const chat = await Chat.findById(chatId);
    if (!chat || !canAccessChat(chat, req)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this chat",
      });
    }

    const messages = await Message.find({
      chatId,
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    // Manually populate each message with correct model based on senderType
    const populatedMessages = await Promise.all(
      messages.map(async (msg) => {
        if (!msg.senderId) return msg;
        
        if (msg.senderType === "Client") {
          return await msg.populate({
            path: "senderId",
            model: "Client",
            select: "_id username email profileImage"
          });
        } else {
          return await msg.populate({
            path: "senderId",
            model: "User",
            select: "_id username email profileImage"
          });
        }
      })
    );

    const total = await Message.countDocuments({
      chatId,
      deleted: false,
    });

    res.status(200).json({
      success: true,
      data: populatedMessages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Edit message
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content, senderId } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.senderId.toString() !== senderId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to edit this message",
      });
    }

    // Add to edit history
    message.editHistory.push({
      content: message.content,
      editedAt: message.updatedAt,
    });

    message.content = content;
    message.editedAt = new Date();

    await message.save();

    const populatedMessage = await message.populate("senderId", "_id _id username email profileImage");

    res.status(200).json({
      success: true,
      data: populatedMessage,
      message: "Message edited successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { senderId } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.senderId.toString() !== senderId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this message",
      });
    }

    message.deleted = true;
    message.content = "[This message was deleted]";
    await message.save();

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add reaction to message
exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, emoji } = req.body;

    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        $push: {
          reactions: {
            userId,
            emoji,
          },
        },
      },
      { new: true }
    ).populate("senderId", "_id username email profileImage");

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove reaction from message
exports.removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        $pull: {
          reactions: {
            userId,
          },
        },
      },
      { new: true }
    ).populate("senderId", "_id username email profileImage");

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    await Message.updateMany(
      {
        chatId,
        senderId: { $ne: userId },
        readBy: { $not: { $elemMatch: { userId } } },
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date(),
          },
        },
      }
    );

    const chat = await Chat.findById(chatId);
    chat.unreadCount.delete(userId.toString());
    await chat.save();

    res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Send status update message
exports.sendStatusUpdate = async (req, res) => {
  try {
    const {
      chatId,
      senderId,
      projectId,
      oldStatus,
      newStatus,
      description,
    } = req.body;

    // Determine sender type (User or Client)
    let senderType = "User";
    let sender = await User.findById(senderId);
    
    if (!sender) {
      sender = await Client.findById(senderId);
      if (sender) {
        senderType = "Client";
      }
    }

    // Create status update message
    const message = new Message({
      chatId,
      senderId,
      senderType,
      messageType: "status_update",
      content: `Project status updated: ${oldStatus} → ${newStatus}`,
      statusUpdate: {
        projectId,
        oldStatus,
        newStatus,
        description,
      },
      readBy: [{ userId: senderId, readAt: new Date() }],
    });

    await message.save();

    // Update chat
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      {
        lastMessage: message._id,
        lastMessageTime: new Date(),
      },
      { new: true }
    );

    // Create project status record
    const projectStatus = new ProjectStatus({
      projectId,
      clientId: chat.clientId,
      status: newStatus,
      previousStatus: oldStatus,
      updatedBy: senderId,
      reason: description,
      chatNotificationSent: true,
    });

    await projectStatus.save();

    // Populate with correct model based on senderType
    let populatedMessage = message;
    if (senderType === "Client") {
      populatedMessage = await message.populate({
        path: "senderId",
        model: "Client",
        select: "_id username email profileImage"
      });
    } else {
      populatedMessage = await message.populate({
        path: "senderId",
        model: "User",
        select: "_id username email profileImage"
      });
    }

    res.status(201).json({
      success: true,
      data: populatedMessage,
      message: "Status update sent",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
