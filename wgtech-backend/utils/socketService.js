const socketIO = require("socket.io");
const Chat = require("../model/chatModel");
const Message = require("../model/messageModel");
const AutoReply = require("../model/autoReplyModel");
const User = require("../model/userModel");
const Client = require("../model/clientModel");
const Notification = require("../model/notificationModel");
const { enqueueEmail } = require("./emailQueue");
const { buildChatNotificationEmail } = require("./emailTemplates");
const { ensureDefaultWebsiteAutoReplies } = require("./defaultAutoReplies");

let connectedUsers = {};
let userSocketMap = {};
let ioInstance = null;
const pendingAutoReplyByChat = new Map();

const deriveNameFromUrl = (url, fallback) => {
  try {
    const raw = String(url || "")
      .split("?")[0]
      .split("#")[0];
    const lastPart = raw.split("/").pop();
    const decoded = decodeURIComponent(lastPart || "").trim();
    if (!decoded) return fallback;
    return decoded;
  } catch (error) {
    return fallback;
  }
};

const initializeSocket = (server, corsOptions) => {
  const io = socketIO(server, {
    cors: corsOptions,
    transports: ["websocket", "polling"],
  });

  ioInstance = io;

  // Middleware for authentication
  io.use((socket, next) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      next();
    } else {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    console.log(`User ${userId} connected with socket ID: ${socket.id}`);

    connectedUsers[userId] = true;
    userSocketMap[userId] = socket.id;
    socket.join(`user_${userId}`);

    // Emit online status to all connected clients
    io.emit("user_online", { userId, status: "online" });

    // ======================== CHAT EVENTS ========================

    // Join chat room
    socket.on("join_chat", (data, callback) => {
      const { chatId, userId } = data;
      socket.join(`chat_${chatId}`);
      console.log(`User ${userId} joined chat ${chatId}`);

      // Send acknowledgment if callback provided
      if (callback && typeof callback === "function") {
        callback({ success: true, roomId: `chat_${chatId}` });
      }

      // Notify others in chat
      io.to(`chat_${chatId}`).emit("user_joined", {
        userId,
        timestamp: new Date(),
      });
    });

    // Leave chat room
    socket.on("leave_chat", (data) => {
      const { chatId, userId } = data;
      socket.leave(`chat_${chatId}`);
      console.log(`User ${userId} left chat ${chatId}`);

      io.to(`chat_${chatId}`).emit("user_left", {
        userId,
        timestamp: new Date(),
      });
    });

    // Receive message
    socket.on("send_message", async (data) => {
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
        } = data;

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

        console.log(
          "📨 Received message - ChatID:",
          chatId,
          "From:",
          senderId,
          "Content:",
          content,
        );

        // Validate required fields
        if (!chatId || !senderId || !content) {
          console.error("❌ Invalid message data:", data);
          socket.emit("message_error", { error: "Missing required fields" });
          return;
        }

        // Determine sender type (User or Client)
        let senderType = "User";
        let sender = await User.findById(senderId);

        if (!sender) {
          // Try Client collection if not found in User
          sender = await Client.findById(senderId);
          if (sender) {
            senderType = "Client";
          } else {
            console.error(
              "❌ Sender not found in either User or Client collection:",
              senderId,
            );
            socket.emit("message_error", { error: "Sender not found" });
            return;
          }
        }

        const existingChat = await Chat.findById(chatId);
        if (!existingChat) {
          console.error("❌ Chat not found:", chatId);
          socket.emit("message_error", { error: "Chat not found" });
          return;
        }

        if (
          existingChat.chatType === "website" &&
          existingChat.assignedAdmin &&
          String(senderId) === String(existingChat.assignedAdmin)
        ) {
          clearPendingAutoReply(chatId, io);
        }

        if (!existingChat.assignedAdmin) {
          let fallbackAdmin = await User.findOne({
            isActive: true,
            role: "admin",
          }).select("_id");
          if (!fallbackAdmin) {
            fallbackAdmin = await User.findOne({ isActive: true }).select(
              "_id",
            );
          }

          if (fallbackAdmin?._id) {
            existingChat.assignedAdmin = fallbackAdmin._id;
            existingChat.participants = Array.from(
              new Set([
                ...existingChat.participants.map((id) => String(id)),
                String(fallbackAdmin._id),
              ]),
            ).map((id) => id);
            await existingChat.save();
            await ensureDefaultWebsiteAutoReplies(fallbackAdmin._id);
          }
        }

        // Admin command: /bot <message> updates the primary welcome auto-reply.
        if (
          existingChat.chatType === "website" &&
          existingChat.assignedAdmin &&
          String(senderId) === String(existingChat.assignedAdmin) &&
          typeof content === "string" &&
          content.trim().toLowerCase().startsWith("/bot ")
        ) {
          const nextMessage = content.trim().slice(5).trim();
          if (!nextMessage) {
            socket.emit("message_error", {
              error: "Bot message cannot be empty",
            });
            return;
          }

          await ensureDefaultWebsiteAutoReplies(existingChat.assignedAdmin);

          await AutoReply.findOneAndUpdate(
            {
              adminId: existingChat.assignedAdmin,
              title: "Website Welcome Assistant",
            },
            { message: nextMessage, isActive: true },
            { new: true },
          );

          const confirmation = new Message({
            chatId,
            senderId: existingChat.assignedAdmin,
            senderType: "User",
            messageType: "text",
            content: "Bot welcome reply updated successfully.",
            readBy: [
              { userId: existingChat.assignedAdmin, readAt: new Date() },
            ],
          });

          await confirmation.save();
          const populatedConfirmation = await confirmation.populate({
            path: "senderId",
            model: "User",
            select: "-password -otp -verificationToken",
          });

          // Only notify the sender socket; this command should not broadcast to clients.
          socket.emit("message_received", {
            _id: populatedConfirmation._id,
            chatId,
            senderId: populatedConfirmation.senderId,
            messageType: "text",
            content: populatedConfirmation.content,
            createdAt: populatedConfirmation.createdAt,
          });

          return;
        }

        // Save message to database
        const messagePayload = {
          chatId,
          senderId,
          senderType,
          messageType: messageType || "text",
          content,
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          imageUrl: imageUrl || null,
          documentUrl: documentUrl || null,
          documentName: documentName || null,
          readBy: [{ userId: senderId, readAt: new Date() }],
        };

        // Add quotationData if present
        if (quotationData) {
          messagePayload.quotationData = quotationData;
        }

        const message = new Message(messagePayload);

        await message.save();
        console.log(
          "✅ Message saved:",
          message._id,
          "senderType:",
          senderType,
        );

        // Update chat
        const chat = await Chat.findByIdAndUpdate(
          chatId,
          {
            lastMessage: message._id,
            lastMessageTime: new Date(),
          },
          { new: true },
        );

        if (!chat) {
          console.error("❌ Chat not found:", chatId);
          return;
        }

        console.log("✅ Chat updated:", chatId);

        // Update unread count
        const otherParticipants = chat.participants.filter(
          (p) => p.toString() !== senderId.toString(),
        );

        otherParticipants.forEach((participantId) => {
          const current = chat.unreadCount.get(participantId.toString()) || 0;
          chat.unreadCount.set(participantId.toString(), current + 1);
        });

        await chat.save();

        // Populate message with correct model based on senderType
        let populatedMessage = message;
        if (senderType === "Client") {
          populatedMessage = await message.populate({
            path: "senderId",
            model: "Client",
            select: "_id username email profileImage",
          });
        } else {
          populatedMessage = await message.populate({
            path: "senderId",
            model: "User",
            select: "_id username email profileImage",
          });
        }

        console.log("📤 Broadcasting message to room: chat_" + chatId);

        // Build message response
        const messageResponse = {
          _id: populatedMessage._id,
          chatId,
          senderId: populatedMessage.senderId,
          senderType,
          messageType: messageType || "text",
          content,
          fileUrl,
          fileName,
          imageUrl,
          documentUrl,
          documentName,
          createdAt: populatedMessage.createdAt,
          readBy: populatedMessage.readBy,
        };

        // Add quotationData if present
        if (quotationData) {
          messageResponse.quotationData = quotationData;
        }

        // Emit message to chat room
        io.to(`chat_${chatId}`).emit("message_received", messageResponse);

        createChatMessageNotifications({
          io,
          chat,
          senderId,
          senderType,
          senderName:
            senderType === "Client"
              ? sender.name || sender.username || "Client"
              : sender.fullname || sender.username || "Team member",
          content,
        }).catch((error) => {
          console.error("Chat notification persistence error:", error.message);
        });

        notifyChatMessageByEmail({
          chat,
          senderId,
          senderType,
          content,
        }).catch((error) => {
          console.error("Chat notification email error:", error.message);
        });

        // For website chat, auto-reply only for client/visitor messages.
        if (
          senderType === "Client" &&
          chat.assignedAdmin &&
          !chat.isGroupChat &&
          String(senderId) !== String(chat.assignedAdmin)
        ) {
          handleAutoReply(chat.assignedAdmin, chatId, content, io);
        }
      } catch (error) {
        console.error("❌ Error sending message:", error);
        socket.emit("message_error", { error: error.message });
      }
    });

    // Typing indicator
    socket.on("typing", (data) => {
      const { chatId, userId } = data;
      io.to(`chat_${chatId}`).emit("user_typing", {
        userId,
        isTyping: true,
      });
    });

    socket.on("stop_typing", (data) => {
      const { chatId, userId } = data;
      io.to(`chat_${chatId}`).emit("user_typing", {
        userId,
        isTyping: false,
      });
    });

    // Mark message as read
    socket.on("message_read", async (data) => {
      try {
        const { messageId, userId } = data;

        await Message.findByIdAndUpdate(messageId, {
          $push: {
            readBy: {
              userId,
              readAt: new Date(),
            },
          },
        });

        const message = await Message.findById(messageId).populate("chatId");

        io.to(`chat_${message.chatId}`).emit("message_read_receipt", {
          messageId,
          userId,
          readAt: new Date(),
        });
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    });

    // Edit message
    socket.on("edit_message", async (data) => {
      try {
        const { messageId, content, senderId, chatId } = data;

        const message = await Message.findByIdAndUpdate(
          messageId,
          {
            content,
            editedAt: new Date(),
            $push: {
              editHistory: {
                content: (await Message.findById(messageId)).content,
                editedAt: new Date(),
              },
            },
          },
          { new: true },
        );

        io.to(`chat_${chatId}`).emit("message_edited", {
          messageId,
          content,
          editedAt: message.editedAt,
        });
      } catch (error) {
        console.error("Error editing message:", error);
      }
    });

    // Delete message
    socket.on("delete_message", async (data) => {
      try {
        const { messageId, chatId } = data;

        await Message.findByIdAndUpdate(messageId, {
          deleted: true,
          content: "[This message was deleted]",
        });

        io.to(`chat_${chatId}`).emit("message_deleted", {
          messageId,
        });
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    });

    // ======================== STATUS UPDATE EVENTS ========================

    // Send status update
    socket.on("send_status_update", async (data) => {
      try {
        const {
          chatId,
          senderId,
          projectId,
          oldStatus,
          newStatus,
          description,
        } = data;

        // Detect sender type
        let senderType = "User";
        let sender = await User.findById(senderId);
        if (!sender) {
          sender = await Client.findById(senderId);
          if (sender) senderType = "Client";
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

        // Emit to chat
        io.to(`chat_${chatId}`).emit("status_update_received", {
          messageId: message._id,
          projectId,
          oldStatus,
          newStatus,
          description,
          timestamp: new Date(),
        });

        // Notify client with system notification
        const chat = await Chat.findById(chatId);
        const clientSocketId = userSocketMap[chat.clientId];

        if (clientSocketId) {
          io.to(clientSocketId).emit("status_notification", {
            title: "Project Status Updated",
            message: `Your project status has been updated to: ${newStatus}`,
            projectId,
            status: newStatus,
          });
        }
      } catch (error) {
        console.error("Error sending status update:", error);
      }
    });

    // ======================== CALL EVENTS ========================

    // Initiate call
    socket.on("initiate_call", (data) => {
      try {
        const { callerId, receiverId, chatId, callType } = data;
        const receiverSocketId = userSocketMap[receiverId];

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("incoming_call", {
            callerId,
            callerSocketId: socket.id,
            chatId,
            callType,
            timestamp: new Date(),
          });
        } else {
          socket.emit("call_failed", {
            message: "Receiver is not online",
          });
        }
      } catch (error) {
        console.error("Error initiating call:", error);
      }
    });

    // Answer call
    socket.on("answer_call", (data) => {
      try {
        const { callerId, receiverId, chatId } = data;
        const callerSocketId = userSocketMap[callerId];

        if (callerSocketId) {
          io.to(callerSocketId).emit("call_answered", {
            receiverId,
            receiverSocketId: socket.id,
            chatId,
          });
        }
      } catch (error) {
        console.error("Error answering call:", error);
      }
    });

    // Reject call
    socket.on("reject_call", (data) => {
      try {
        const { callerId } = data;
        const callerSocketId = userSocketMap[callerId];

        if (callerSocketId) {
          io.to(callerSocketId).emit("call_rejected", {
            message: "Call was rejected",
          });
        }
      } catch (error) {
        console.error("Error rejecting call:", error);
      }
    });

    // End call
    socket.on("end_call", (data) => {
      try {
        const { otherUserId, chatId, callDuration } = data;
        const otherUserSocketId = userSocketMap[otherUserId];

        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit("call_ended", {
            message: "Call ended",
            callDuration,
          });
        }

        io.to(`chat_${chatId}`).emit("call_ended_notification", {
          callDuration,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error ending call:", error);
      }
    });

    // ======================== DISCONNECT EVENT ========================

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);

      delete connectedUsers[userId];
      delete userSocketMap[userId];

      // Emit offline status
      io.emit("user_offline", { userId, status: "offline" });
    });
  });

  return io;
};

// Helper function to handle auto-replies
const handleAutoReply = async (adminId, chatId, userMessage, io) => {
  try {
    const adminHasTakenOver = await hasAdminTakenOverChat(chatId, adminId);
    if (adminHasTakenOver) {
      clearPendingAutoReply(chatId, io);
      return;
    }

    await ensureDefaultWebsiteAutoReplies(adminId);

    const autoReplies = await AutoReply.find({
      adminId,
      isActive: true,
    });

    const lowerMessage = userMessage.toLowerCase();

    let matchedReply = false;

    for (const autoReply of autoReplies) {
      const triggered = autoReply.triggerKeywords.some((keyword) =>
        lowerMessage.includes(keyword.toLowerCase()),
      );

      if (triggered) {
        matchedReply = true;
        // Check daily limit
        if (
          autoReply.maxUsesPerDay &&
          autoReply.usageCount >= autoReply.maxUsesPerDay
        ) {
          const lastUsedDate = new Date(autoReply.lastUsedAt);
          const now = new Date();

          if (
            lastUsedDate.toDateString() === now.toDateString() &&
            autoReply.usageCount >= autoReply.maxUsesPerDay
          ) {
            continue; // Skip this auto-reply if limit reached today
          }
        }

        // Send auto-reply with delay
        scheduleAutoReply({
          chatId,
          adminId,
          io,
          replyText: autoReply.message,
          responseDelaySeconds: autoReply.responseDelay,
          onAfterSend: async () => {
            autoReply.usageCount += 1;
            autoReply.lastUsedAt = new Date();
            await autoReply.save();
          },
        });

        break; // Only send one auto-reply
      }
    }

    // Fallback onboarding reply for first user message if nothing matched.
    if (!matchedReply) {
      const totalMessages = await Message.countDocuments({
        chatId,
        deleted: false,
      });
      if (totalMessages <= 1) {
        const welcomeReply = autoReplies.find(
          (reply) => reply.title === "Website Welcome Assistant",
        );

        if (welcomeReply) {
          scheduleAutoReply({
            chatId,
            adminId,
            io,
            replyText: welcomeReply.message,
            responseDelaySeconds: welcomeReply.responseDelay,
            onAfterSend: async () => {
              welcomeReply.usageCount += 1;
              welcomeReply.lastUsedAt = new Date();
              await welcomeReply.save();
            },
          });
        }
      }
    }
  } catch (error) {
    console.error("Error handling auto-reply:", error);
  }
};

const notifyChatMessageByEmail = async ({
  chat,
  senderId,
  senderType,
  content,
}) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const participants = Array.isArray(chat?.participants)
    ? chat.participants.map((id) => String(id))
    : [];
  if (participants.length === 0) return;

  const users = await User.find({ _id: { $in: participants } }).select(
    "_id email role username fullname",
  );
  if (!users.length) return;

  const senderUser =
    senderType === "User"
      ? users.find((user) => String(user._id) === String(senderId)) ||
        (await User.findById(senderId).select(
          "_id email role username fullname",
        ))
      : null;

  const senderClient =
    senderType === "Client"
      ? await Client.findById(senderId).select("_id name username email userId")
      : null;

  const admins = users.filter((user) => user.role === "admin");
  const workers = users.filter((user) => user.role === "worker");
  const clients = users.filter((user) => user.role === "client");

  const primaryClient = clients[0] || null;
  const senderName =
    senderType === "Client"
      ? senderClient?.name || senderClient?.username || "Client"
      : senderUser?.fullname || senderUser?.username || "Team Member";

  const isGroupChat = Boolean(chat?.isGroupChat || users.length > 2);
  const senderRole = senderUser?.role;

  let notificationType = null;
  let recipientEmails = [];

  if (!isGroupChat && senderType === "Client") {
    notificationType = "client_to_admin";
    recipientEmails = admins.map((admin) => admin.email).filter(Boolean);
  } else if (!isGroupChat && senderType === "User" && senderRole === "admin") {
    notificationType = "admin_to_client";
    if (primaryClient?.email) recipientEmails = [primaryClient.email];
  } else if (isGroupChat && senderType === "Client") {
    notificationType = "client_to_group";
    recipientEmails = [...admins, ...workers]
      .map((user) => user.email)
      .filter(Boolean);
  } else if (isGroupChat && senderType === "User" && senderRole === "worker") {
    notificationType = "worker_to_group";
    recipientEmails = [...admins, ...clients]
      .map((user) => user.email)
      .filter(Boolean);
  } else if (isGroupChat && senderType === "User" && senderRole === "admin") {
    notificationType = "admin_to_group";
    recipientEmails = [...workers, ...clients]
      .map((user) => user.email)
      .filter(Boolean);
  }

  if (!notificationType || recipientEmails.length === 0) return;

  const senderEmail =
    senderType === "Client" ? senderClient?.email : senderUser?.email;
  const uniqueRecipients = [...new Set(recipientEmails)].filter(
    (email) =>
      email &&
      String(email).toLowerCase() !== String(senderEmail || "").toLowerCase(),
  );
  if (uniqueRecipients.length === 0) return;

  const portalLink =
    process.env.PORTAL_LINK ||
    process.env.CLIENT_PANEL_URL ||
    process.env.ADMIN_PANEL_URL ||
    "https://wgtecsol.com/";
  const chatLink = `${portalLink.replace(/\/$/, "")}/chat?chatId=${chat._id}`;

  const template = buildChatNotificationEmail(notificationType, {
    clientName:
      senderType === "Client"
        ? senderName
        : primaryClient?.fullname || primaryClient?.username || "Client",
    partnerName:
      primaryClient?.fullname || primaryClient?.username || senderName,
    projectId: chat?.projectId || "N/A",
    messageTime: new Date().toLocaleString("en-GB"),
    messagePreview: String(content || "").slice(0, 220),
    chatLink,
    workerName: senderName,
  });

  uniqueRecipients.forEach((email) => {
    enqueueEmail({
      to: email,
      subject: template.subject,
      message: template.message,
    });
  });
};

const createChatMessageNotifications = async ({
  io,
  chat,
  senderId,
  senderType,
  senderName,
  content,
}) => {
  const recipients = (chat?.participants || []).filter(
    (participantId) => String(participantId) !== String(senderId),
  );
  if (!recipients.length) return;

  const preview = String(content || "").slice(0, 120);
  const notifications = await Promise.all(
    recipients.map((recipient) =>
      Notification.create({
        title: `New message from ${senderName}`,
        message: preview,
        type: "chat_message",
        recipient,
        recipientRole: "user",
        actor: senderId,
        actorModel: senderType === "Client" ? "Client" : "User",
        entityId: chat._id,
        entityType: "Chat",
        link: `/chat?chatId=${chat._id}`,
        metadata: {
          chatId: chat._id,
          isGroupChat: Boolean(chat.isGroupChat),
        },
      }),
    ),
  );

  notifications.forEach((notification) => {
    io.to(`user_${notification.recipient}`).emit("notification:new", {
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link: notification.link,
      entityId: notification.entityId,
      entityType: notification.entityType,
      recipient: notification.recipient,
      createdAt: notification.createdAt,
      metadata: notification.metadata || {},
    });
  });
};

const clearPendingAutoReply = (chatId, io) => {
  const pending = pendingAutoReplyByChat.get(String(chatId));
  if (!pending) return;

  if (pending.timer) {
    clearTimeout(pending.timer);
  }

  pendingAutoReplyByChat.delete(String(chatId));

  if (pending.adminId) {
    io.to(`chat_${chatId}`).emit("user_typing", {
      chatId,
      userId: String(pending.adminId),
      isTyping: false,
    });
  }
};

const hasAdminTakenOverChat = async (chatId, adminId) => {
  const manualAdminMessage = await Message.exists({
    chatId,
    senderId: adminId,
    senderType: "User",
    deleted: { $ne: true },
    isAutoReply: { $ne: true },
    content: { $ne: "Bot welcome reply updated successfully." },
  });

  return Boolean(manualAdminMessage);
};

const scheduleAutoReply = ({
  chatId,
  adminId,
  io,
  replyText,
  responseDelaySeconds,
  onAfterSend,
}) => {
  clearPendingAutoReply(chatId, io);

  io.to(`chat_${chatId}`).emit("user_typing", {
    chatId,
    userId: String(adminId),
    isTyping: true,
  });

  const minDelaySeconds = 2;
  const replyDelay =
    Math.max(Number(responseDelaySeconds || 0), minDelaySeconds) * 1000;

  const timer = setTimeout(async () => {
    try {
      const adminStillManual = await hasAdminTakenOverChat(chatId, adminId);
      if (adminStillManual) {
        io.to(`chat_${chatId}`).emit("user_typing", {
          chatId,
          userId: String(adminId),
          isTyping: false,
        });
        pendingAutoReplyByChat.delete(String(chatId));
        return;
      }

      const autoReplyMessage = new Message({
        chatId,
        senderId: adminId,
        senderType: "User",
        messageType: "text",
        content: replyText,
        isAutoReply: true,
        readBy: [{ userId: adminId, readAt: new Date() }],
      });

      await autoReplyMessage.save();

      const chat = await Chat.findById(chatId);
      if (chat) {
        chat.lastMessage = autoReplyMessage._id;
        chat.lastMessageTime = new Date();

        const recipients = chat.participants.filter(
          (participantId) => String(participantId) !== String(adminId),
        );

        recipients.forEach((participantId) => {
          const current = chat.unreadCount.get(participantId.toString()) || 0;
          chat.unreadCount.set(participantId.toString(), current + 1);
        });

        await chat.save();
      }

      const populatedMessage = await autoReplyMessage.populate({
        path: "senderId",
        model: "User",
        select: "-password -otp -verificationToken",
      });

      io.to(`chat_${chatId}`).emit("message_received", {
        _id: populatedMessage._id,
        chatId,
        senderId: populatedMessage.senderId,
        messageType: "text",
        content: replyText,
        isAutoReply: true,
        createdAt: populatedMessage.createdAt,
      });

      io.to(`chat_${chatId}`).emit("user_typing", {
        chatId,
        userId: String(adminId),
        isTyping: false,
      });

      pendingAutoReplyByChat.delete(String(chatId));

      if (typeof onAfterSend === "function") {
        await onAfterSend();
      }
    } catch (error) {
      console.error("Error sending scheduled auto-reply:", error);
      io.to(`chat_${chatId}`).emit("user_typing", {
        chatId,
        userId: String(adminId),
        isTyping: false,
      });
      pendingAutoReplyByChat.delete(String(chatId));
    }
  }, replyDelay);

  pendingAutoReplyByChat.set(String(chatId), {
    timer,
    adminId,
  });
};

const getIO = () => ioInstance;

module.exports = {
  initializeSocket,
  connectedUsers,
  userSocketMap,
  getIO,
};
