const mongoose = require("mongoose");
const Client = require("../model/clientModel");
const User = require("../model/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Get all clients with role-based filtering
exports.getClients = catchAsync(async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Please login first.",
    });
  }

  let query = {}; // Query for Client collection (not User)
  const userRole = user.designation?.roleName || user.role;

  // Role-based filtering
  if (userRole === "worker") {
    // Workers only see clients assigned to them
    query.assignedWorker = user._id;
  } else if (userRole === "client") {
    // Clients cannot access this endpoint
    return res.status(403).json({
      success: false,
      message: "Clients cannot access this endpoint",
    });
  }
  // Main Admin sees all clients (query = {})

  console.log("🔎 Querying clients from Client collection with filter:", query);

  // Pagination
  const limit = parseInt(req.query.limit) || 100;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const clients = await Client.find(query)
    .populate("userId", "email username fullname")
    .populate("assignedWorker", "username email profileImage")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Client.countDocuments(query);

  console.log(`✅ Found ${clients.length} clients`);
  clients.forEach((c, idx) => {
    console.log(`   ${idx + 1}. ${c.name} (${c.email})`);
  });

  res.status(200).json({
    success: true,
    data: clients,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// Get single client
exports.getClientById = catchAsync(async (req, res) => {
  const client = await Client.findById(req.params.clientId)
    .populate("assignedWorker", "username email profileImage")
    .populate("userId", "email username");

  if (!client) {
    return res.status(404).json({
      success: false,
      message: "Client not found",
    });
  }

  res.status(200).json({
    success: true,
    data: client,
  });
});

// Create new client
exports.createClient = catchAsync(async (req, res) => {
  const { userId, name, email, phone, company, projectName, budget, description } = req.body;

  // Check if client already exists for this user
  const existingClient = await Client.findOne({ userId });
  if (existingClient) {
    return res.status(400).json({
      success: false,
      message: "Client already exists for this user",
    });
  }

  const client = await Client.create({
    userId,
    name,
    email,
    phone,
    company,
    projectName,
    budget,
    description,
  });

  res.status(201).json({
    success: true,
    message: "Client created successfully",
    data: client,
  });
});

// Update client details
exports.updateClient = catchAsync(async (req, res) => {
  const { status, description, budget, notes } = req.body;

  const client = await Client.findByIdAndUpdate(
    req.params.clientId,
    {
      status,
      description,
      budget,
      notes,
    },
    { new: true, runValidators: true }
  );

  if (!client) {
    return res.status(404).json({
      success: false,
      message: "Client not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Client updated successfully",
    data: client,
  });
});

// Assign worker to client
exports.assignWorker = catchAsync(async (req, res) => {
  // Verify Main Admin
  if (req.user.designation?.roleName !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only Main Admin can assign workers",
    });
  }

  const { workerId, department } = req.body;

  // Verify worker exists
  const worker = await User.findById(workerId);
  if (!worker) {
    return res.status(404).json({
      success: false,
      message: "Worker not found",
    });
  }

  // Update client
  const client = await Client.findByIdAndUpdate(
    req.params.clientId,
    {
      assignedWorker: workerId,
      assignedDepartment: department,
    },
    { new: true }
  ).populate("assignedWorker", "username email profileImage");

  if (!client) {
    return res.status(404).json({
      success: false,
      message: "Client not found",
    });
  }

  // Update worker's assigned clients
  await User.findByIdAndUpdate(
    workerId,
    {
      $addToSet: { assignedClients: client._id },
      assignedDepartment: department,
    },
    { new: true }
  );

  // Ensure group chat exists for Admin + Worker + Client after assignment
  try {
    const Chat = require("../model/chatModel");

    const adminId = req.user._id;
    const participantClientId = client.userId || client._id;

    let existingGroupChat = await Chat.findOne({
      isGroupChat: true,
      chatType: "admin_work",
      participants: { $all: [workerId, participantClientId, adminId] },
    });

    if (!existingGroupChat) {
      const workerName = worker.fullname || worker.username || worker.email;
      const clientName = client.name || client.username || client.email;

      existingGroupChat = await Chat.create({
        participants: [workerId, participantClientId, adminId],
        chatType: "admin_work",
        clientId: participantClientId,
        clientRef: client._id,
        assignedAdmin: adminId,
        isGroupChat: true,
        groupName: `${clientName} - ${workerName}`,
        groupDescription: "Collaboration between Admin, Worker, and Client",
        groupAdmins: [adminId, workerId],
        unreadCount: new Map([
          [String(workerId), 0],
          [String(participantClientId), 0],
          [String(adminId), 0],
        ]),
      });
    }
  } catch (chatError) {
    console.error("Failed to ensure group chat after worker assignment:", chatError.message);
  }

  res.status(200).json({
    success: true,
    message: "Worker assigned successfully",
    data: client,
  });
});

// Upload progress media
exports.uploadProgressMedia = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  const mediaUrl = `/uploads/progress/${req.file.filename}`;
  const mediaEntry = {
    type: req.body.type || "image",
    url: mediaUrl,
    uploadedAt: new Date(),
    uploadedBy: req.user._id,
  };

  const client = await Client.findByIdAndUpdate(
    req.params.clientId,
    {
      $push: { progressMedia: mediaEntry },
    },
    { new: true }
  );

  if (!client) {
    return res.status(404).json({
      success: false,
      message: "Client not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Media uploaded successfully",
    data: mediaEntry,
  });
});

// Upload document
exports.uploadDocument = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  const { documentName } = req.body;
  const documentUrl = `/uploads/documents/${req.file.filename}`;

  const client = await Client.findByIdAndUpdate(
    req.params.clientId,
    {
      $push: {
        documents: {
          name: documentName,
          url: documentUrl,
          uploadedAt: new Date(),
          uploadedBy: req.user._id,
        },
      },
    },
    { new: true }
  );

  if (!client) {
    return res.status(404).json({
      success: false,
      message: "Client not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Document uploaded successfully",
    data: {
      name: documentName,
      url: documentUrl,
    },
  });
});

// Add comment
exports.addComment = catchAsync(async (req, res) => {
  const { text, visibility } = req.body;

  const comment = {
    _id: new mongoose.Types.ObjectId(),
    authorId: req.user._id,
    authorName: req.user.username,
    text,
    timestamp: new Date(),
    visibility: visibility || "all",
  };

  const client = await Client.findByIdAndUpdate(
    req.params.clientId,
    {
      $push: { comments: comment },
    },
    { new: true }
  );

  if (!client) {
    return res.status(404).json({
      success: false,
      message: "Client not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Comment added successfully",
    data: comment,
  });
});

// Delete client
exports.deleteClient = catchAsync(async (req, res) => {
  // Verify Main Admin
  if (req.user.designation?.roleName !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only Main Admin can delete clients",
    });
  }

  const client = await Client.findByIdAndDelete(req.params.clientId);

  if (!client) {
    return res.status(404).json({
      success: false,
      message: "Client not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Client deleted successfully",
  });
});

// ✅ Generate/Reset client password (admin only)
exports.generateClientPassword = catchAsync(async (req, res) => {
  // Verify Main Admin
  if (req.user.designation?.roleName !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only Main Admin can generate client passwords",
    });
  }

  const client = await Client.findById(req.params.clientId);
  if (!client) {
    return res.status(404).json({
      success: false,
      message: "Client not found",
    });
  }

  // Generate temporary password
  const tempPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Update client with new password (will be hashed by pre-save hook)
  client.password = tempPassword;
  await client.save();

  // Also update username if not set
  if (!client.username) {
    client.username = client.email.split("@")[0];
    await client.save();
  }

  res.status(200).json({
    success: true,
    message: "Password generated successfully",
    data: {
      clientId: client._id,
      email: client.email,
      username: client.username || client.email.split("@")[0],
      tempPassword: tempPassword,
      note: "Please share this password with the client via secure channel",
    },
  });
});
