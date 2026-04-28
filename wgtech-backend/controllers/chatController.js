const Chat = require("../model/chatModel");
const Message = require("../model/messageModel");
const AutoReply = require("../model/autoReplyModel");
const User = require("../model/userModel");
const Client = require("../model/clientModel");
const Proposal = require("../model/proposalsModel");
const ProjectStatus = require("../model/projectStatusModel");
const { ensureDefaultWebsiteAutoReplies } = require("../utils/defaultAutoReplies");

// Utility to safely resolve client + user pairing for accepted proposals
const resolveClientUser = async (proposalEmail) => {
  const client = await Client.findOne({ email: proposalEmail });
  let user = null;

  if (client?.userId) {
    user = await User.findById(client.userId);
  }

  if (!user) {
    user = await User.findOne({ email: proposalEmail });
    if (user && client && !client.userId) {
      client.userId = user._id;
      await client.save();
    }
  }

  return { client, user };
};

// Build accepted-client chat DTOs
const buildAcceptedClientEntries = async () => {
  const proposals = await Proposal.find({ status: "Accepted" })
    .select("_id fullname email company budget messages")
    .lean();

  return Promise.all(
    proposals.map(async (proposal) => {
      const { client, user } = await resolveClientUser(proposal.email);

      // Find existing admin_work chat for this client user (if any)
      let chat = null;
      const participantId = user?._id || client?._id;
      if (participantId) {
        chat = await Chat.findOne({
          chatType: "admin_work",
          participants: participantId,
        })
          .populate("clientId", "username email profileImage")
          .populate("assignedAdmin", "username email profileImage")
          .populate("lastMessage")
          .lean();
      }

      return {
        proposalId: proposal._id,
        proposalTitle: proposal.messages || proposal.company || "Project",
        proposalEmail: proposal.email,
        clientId: client?._id || null,
        clientUserId: user?._id || null,
        clientName:
          client?.name || proposal.fullname || user?.fullname || user?.username,
        clientUsername: client?.username || user?.username || proposal.email,
        clientProfileImage: client?.profilePicture || client?.profileImage || null,
        chat,
        progressMedia: client?.progressMedia || [],
        documents: client?.documents || [],
        comments: client?.comments || [],
      };
    })
  );
};

// Build client list entries (all clients in Client collection)
const buildAllClientEntries = async () => {
  const clients = await Client.find({}).lean();

  return Promise.all(
    clients.map(async (client) => {
      const user = client.userId
        ? await User.findById(client.userId)
        : await User.findOne({ email: client.email });

      const participantId = user?._id || client._id;

      let chat = null;
      if (participantId) {
        chat = await Chat.findOne({
          chatType: "admin_work",
          participants: participantId,
        })
          .populate("clientId", "username email profileImage")
          .populate("assignedAdmin", "username email profileImage")
          .populate("lastMessage")
          .lean();
      }

      return {
        clientId: client._id,
        clientUserId: user?._id || null,
        clientName: client.name || client.username || client.email,
        clientUsername: client.name || client.username || client.email,
        proposalEmail: client.email,
        proposalId: null,
        proposalTitle: client.projectName || "Client Project",
        clientProfileImage: client.profilePicture || client.profileImage || null,
        chat,
        progressMedia: client.progressMedia || [],
        documents: client.documents || [],
        comments: client.comments || [],
      };
    })
  );
};

// Get all chats for a user
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { chatType } = req.query;

    // Get user to check if they're a worker
    const user = await User.findById(userId)
      .populate("designation", "roleName")
      .populate("assignedClients");

    const isWorker = user?.designation?.roleName === "worker";

    let query = { isActive: true };
    
    if (isWorker) {
      // Workers see ONLY group chats where they're participants
      query.isGroupChat = true;
      query.participants = userId;
    } else {
      // Non-workers (admin) see all their chats
      query.$or = [
        { participants: userId },
        { clientRef: userId },
        { clientId: userId },
      ];
    }

    if (chatType && !isWorker) {
      query.chatType = chatType;
    }

    const chats = await Chat.find(query)
      .populate("clientId", "username email profileImage")
      .populate("assignedAdmin", "username email profileImage")
      .populate("lastMessage")
      .populate("projectId", "title status")
      .sort({ lastMessageTime: -1 })
      .exec();

    res.status(200).json({
      success: true,
      data: chats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single chat
exports.getChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    const chat = await Chat.findById(chatId)
      .populate("clientId", "username email profileImage")
      .populate("assignedAdmin", "username email profileImage")
      .populate("participants", "username email profileImage")
      .populate("projectId", "title status")
      .exec();

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Mark messages as read
    await Message.updateMany(
      {
        chatId: chatId,
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

    // Update unread count
    if (chat.unreadCount.has(userId.toString())) {
      chat.unreadCount.delete(userId.toString());
      await chat.save();
    }

    res.status(200).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create new chat
exports.createChat = async (req, res) => {
  try {
    const { clientId, chatType, assignedAdmin, projectId } = req.body;

    // Check if chat already exists
    let chat = await Chat.findOne({
      clientId,
      chatType,
      projectId: projectId || null,
    });

    if (chat) {
      return res.status(200).json({
        success: true,
        data: chat,
        message: "Chat already exists",
      });
    }

    const participants = [clientId];
    
    // Auto-assign an admin if none provided for website chats.
    let admin = assignedAdmin;
    if (!admin && chatType === "website") {
      let firstAdmin = await User.findOne({ isActive: true, role: "admin" }).select("_id");
      if (!firstAdmin) {
        firstAdmin = await User.findOne({ isActive: true }).select("_id");
      }
      if (firstAdmin) {
        admin = firstAdmin._id;
        participants.push(admin);
      }
    } else if (assignedAdmin) {
      participants.push(assignedAdmin);
    }

    chat = new Chat({
      participants,
      chatType,
      clientId,
      assignedAdmin: admin || null,
      projectId: projectId || null,
      unreadCount: new Map(),
    });

    await chat.save();

    // Seed default website support replies for this admin when the first website chat appears.
    if (chat.chatType === "website" && admin) {
      await ensureDefaultWebsiteAutoReplies(admin);
    }

    await chat.populate("clientId", "username email profileImage");
    await chat.populate("assignedAdmin", "username email profileImage");

    res.status(201).json({
      success: true,
      data: chat,
      message: "Chat created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// List website support chats for admin navigation chat
exports.listWebsiteSupportChats = async (req, res) => {
  try {
    const userId = req.user?._id;
    const isWorker = req.user?.designation?.roleName === "worker";

    if (isWorker) {
      return res.status(200).json({ success: true, data: [] });
    }

    const query = {
      isActive: true,
      chatType: "website",
    };

    // Keep chats scoped to the current admin when assignment exists.
    if (userId) {
      query.$or = [{ assignedAdmin: userId }, { participants: userId }];
    }

    const chats = await Chat.find(query)
      .populate("clientId", "username email profileImage")
      .populate("assignedAdmin", "username email profileImage")
      .populate("lastMessage")
      .sort({ lastMessageTime: -1 })
      .lean();

    const entries = chats.map((chat) => ({
      proposalId: null,
      proposalTitle: "Website Support",
      proposalEmail: chat?.clientId?.email || null,
      clientId: null,
      clientUserId: chat?.clientId?._id || null,
      clientName: chat?.clientId?.username || chat?.clientId?.email || "Website Visitor",
      clientUsername: chat?.clientId?.username || chat?.clientId?.email || "Website Visitor",
      clientProfileImage: chat?.clientId?.profileImage || null,
      chat,
      progressMedia: [],
      documents: [],
      comments: [],
      isGroupChat: false,
    }));

    res.status(200).json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Assign admin to chat
exports.assignAdminToChat = async (req, res) => {
  try {
    const { chatId, adminId } = req.body;

    const chat = await Chat.findByIdAndUpdate(
      chatId,
      {
        assignedAdmin: adminId,
        $addToSet: { participants: adminId },
      },
      { new: true }
    )
      .populate("clientId", "username email profileImage")
      .populate("assignedAdmin", "username email profileImage")
      .exec();

    res.status(200).json({
      success: true,
      data: chat,
      message: "Admin assigned successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get unread count for user
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.params.userId;

    const chats = await Chat.find({
      participants: userId,
      isActive: true,
    });

    let totalUnread = 0;
    const unreadByChat = {};

    chats.forEach((chat) => {
      const count = chat.unreadCount.get(userId.toString()) || 0;
      unreadByChat[chat._id] = count;
      totalUnread += count;
    });

    res.status(200).json({
      success: true,
      data: {
        totalUnread,
        unreadByChat,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Archive chat
exports.archiveChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    const chat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $addToSet: { archivedBy: userId },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: chat,
      message: "Chat archived successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create group chat when client is assigned to worker
exports.createGroupChat = async (req, res) => {
  try {
    const { workerId, clientId, adminId } = req.body;

    if (!workerId || !clientId || !adminId) {
      return res.status(400).json({
        success: false,
        message: "workerId, clientId, and adminId are required",
      });
    }

    // Get user/client details for group name
    const worker = await User.findById(workerId).select("fullname username email");
    const client = await Client.findById(clientId) || await User.findById(clientId);
    const admin = await User.findById(adminId).select("fullname username email");

    if (!worker || !client || !admin) {
      return res.status(404).json({
        success: false,
        message: "Worker, Client, or Admin not found",
      });
    }

    // Check if group chat already exists
    let existingChat = await Chat.findOne({
      isGroupChat: true,
      participants: { $all: [workerId, clientId, adminId] },
    });

    if (existingChat) {
      return res.status(200).json({
        success: true,
        data: existingChat,
        message: "Group chat already exists",
      });
    }

    // Create new group chat
    const clientName = client.name || client.fullname || client.username || client.email;
    const workerName = worker.fullname || worker.username;

    const groupChat = new Chat({
      participants: [workerId, clientId, adminId],
      chatType: "admin_work",
      clientId: clientId, // Primary client for compatibility
      assignedAdmin: adminId,
      isGroupChat: true,
      groupName: `${clientName} - ${workerName}`,
      groupDescription: `Collaboration between Admin, Worker, and Client`,
      groupAdmins: [adminId, workerId],
      unreadCount: new Map([
        [workerId.toString(), 0],
        [clientId.toString(), 0],
        [adminId.toString(), 0],
      ]),
    });

    await groupChat.save();

    const populatedChat = await Chat.findById(groupChat._id)
      .populate("participants", "username email fullname profileImage")
      .populate("groupAdmins", "username email fullname")
      .populate("lastMessage");

    res.status(201).json({
      success: true,
      data: populatedChat,
      message: "Group chat created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// List accepted proposals with client info and existing/placeholder chat
exports.listAcceptedClientChats = async (req, res) => {
  try {
    const entries = await buildAcceptedClientEntries();
    
    // Also fetch group chats for the current user
    const userId = req.user?._id;
    let groupChats = [];
    if (userId) {
      groupChats = await Chat.find({
        isGroupChat: true,
        participants: userId,
        isActive: true
      })
        .populate("clientId", "username email profileImage")
        .populate("assignedAdmin", "username email profileImage")
        .populate("lastMessage")
        .lean();
    }
    
    // Transform group chats to match the entry format
    const groupChatEntries = groupChats.map(chat => ({
      proposalId: null,
      proposalTitle: chat.groupName || "Group Chat",
      proposalEmail: null,
      clientId: chat.clientId?._id || null,
      clientUserId: null,
      clientName: chat.groupName || "Group Chat",
      clientUsername: chat.groupName || "Group Chat",
      clientProfileImage: null,
      chat: chat,
      progressMedia: [],
      documents: [],
      comments: [],
      isGroupChat: true
    }));
    
    // Combine entries with group chats
    const allEntries = [...entries, ...groupChatEntries];
    
    res.status(200).json({ success: true, data: allEntries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// List all clients (Client collection) with chat info
exports.listClientChats = async (req, res) => {
  try {
    const entries = await buildAllClientEntries();
    
    // Also fetch group chats for the current user
    const userId = req.user?._id;
    let groupChats = [];
    if (userId) {
      groupChats = await Chat.find({
        isGroupChat: true,
        participants: userId,
        isActive: true
      })
        .populate("clientId", "username email profileImage")
        .populate("assignedAdmin", "username email profileImage")
        .populate("lastMessage")
        .lean();
    }
    
    // Transform group chats to match the entry format
    const groupChatEntries = groupChats.map(chat => ({
      clientId: chat.clientId?._id || null,
      clientUserId: null,
      clientName: chat.groupName || "Group Chat",
      clientUsername: chat.groupName || "Group Chat",
      clientProfileImage: null,
      chat: chat,
      progressMedia: [],
      documents: [],
      comments: [],
      isGroupChat: true
    }));
    
    // Combine entries with group chats
    const allEntries = [...entries, ...groupChatEntries];
    
    res.status(200).json({ success: true, data: allEntries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ensure a chat exists for a given client (by clientUserId or clientId)
exports.ensureChatForClient = async (req, res) => {
  try {
    const { clientUserId, clientId, chatType = "admin_work", projectId = null } = req.body;

    if (!clientUserId && !clientId) {
      return res.status(400).json({
        success: false,
        message: "clientUserId or clientId is required",
      });
    }

    let resolvedClient = null;
    let resolvedUser = null;

    if (clientId) {
      resolvedClient = await Client.findById(clientId);
      if (!resolvedClient) {
        return res.status(404).json({ success: false, message: "Client not found" });
      }
    }

    if (clientUserId) {
      resolvedUser = await User.findById(clientUserId);
    }

    // Fallback resolve by email if user is missing
    if (!resolvedUser && resolvedClient?.email) {
      resolvedUser = await User.findOne({ email: resolvedClient.email });
      if (resolvedUser && resolvedClient && !resolvedClient.userId) {
        resolvedClient.userId = resolvedUser._id;
        await resolvedClient.save();
      }
    }

    // If no user exists for this client, create a lightweight user record for chat
    if (!resolvedUser && resolvedClient) {
      resolvedUser = await User.findOne({ email: resolvedClient.email });

      if (!resolvedUser) {
        const generatedPassword = Math.random().toString(36).slice(2, 10);
        resolvedUser = await User.create({
          email: resolvedClient.email,
          username: resolvedClient.username || resolvedClient.email,
          fullname: resolvedClient.name || resolvedClient.username || resolvedClient.email,
          password: generatedPassword,
          role: "client",
          isGuest: false,
        });
      }

      // persist the linkage for future lookups
      resolvedClient.userId = resolvedUser._id;
      await resolvedClient.save();
    }

    const participantId = resolvedUser?._id || resolvedClient?._id;

    if (!participantId) {
      return res.status(404).json({ success: false, message: "Client identity not found" });
    }

    let chat = await Chat.findOne({
      chatType,
      participants: participantId,
      projectId: projectId || null,
    });

    let created = false;
    if (!chat) {
      const participants = [participantId];

      // Only append admin/worker ids; client tokens should not duplicate the client id here.
      if (req.userType === "user" && req.user?._id) {
        participants.push(req.user._id);
      }

      chat = await Chat.create({
        participants,
        chatType,
        clientId: resolvedUser?._id || participantId,
        clientRef: resolvedClient?._id || null,
        assignedAdmin: req.userType === "user" && req.user?._id ? req.user._id : null,
        projectId: projectId || null,
        unreadCount: new Map(),
      });
      created = true;
    }

    await chat.populate("clientId", "username email profileImage");
    await chat.populate("assignedAdmin", "username email profileImage");

    res.status(created ? 201 : 200).json({
      success: true,
      data: chat,
      message: created ? "Chat created" : "Chat already exists",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get archived chats
exports.getArchivedChats = async (req, res) => {
  try {
    const userId = req.params.userId;

    const chats = await Chat.find({
      archivedBy: userId,
    })
      .populate("clientId", "username email profileImage")
      .populate("assignedAdmin", "username email profileImage")
      .populate("lastMessage")
      .sort({ lastMessageTime: -1 })
      .exec();

    res.status(200).json({
      success: true,
      data: chats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
