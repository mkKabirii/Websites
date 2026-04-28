const Quotation = require("../model/quotationModel");
const Client = require("../model/clientModel");
const User = require("../model/userModel");
const Chat = require("../model/chatModel");
const Message = require("../model/messageModel");
const fs = require("fs");
const path = require("path");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const {
  buildQuotationEmail,
  buildProposalStatusEmail,
} = require("../utils/emailTemplates");
const { getIO } = require("../utils/socketService");
const { enqueueEmail } = require("../utils/emailQueue");
const {
  createNotification,
  notifyAdmins,
  notifyUsers,
} = require("../utils/notificationService");
const { ensureClientAdminChat, ensureGroupChat } = require("../utils/chatService");

const getRoleName = (user) => user?.designation?.roleName || user?.role || "";

// Helper function to generate a temporary password
const generateTempPassword = () => {
  const length = 12;
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Get all quotations (role-based)
exports.getQuotations = catchAsync(async (req, res) => {
  const user = req.user;
  let query = {};

  if (user.role === "client") {
    // Clients see only their quotations
    const client = await Client.findOne({ userId: user._id });
    if (!client) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }
    query.clientId = client._id;
  } else if (user.role === "worker") {
    // Workers cannot access quotations
    return res.status(403).json({
      success: false,
      message: "Workers cannot access quotations",
    });
  }
  // Main Admin sees all (empty query)

  const quotations = await Quotation.find(query)
    .populate("clientId", "name email company")
    .populate("mainAdminId", "username email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: quotations,
  });
});

// Get single quotation
exports.getQuotationById = catchAsync(async (req, res) => {
  const quotation = await Quotation.findById(req.params.quotationId)
    .populate("clientId", "name email company")
    .populate("mainAdminId", "username email");

  if (!quotation) {
    return res.status(404).json({
      success: false,
      message: "Quotation not found",
    });
  }

  res.status(200).json({
    success: true,
    data: quotation,
  });
});

// Create quotation
exports.createQuotation = catchAsync(async (req, res) => {
  // Verify Main Admin
  if (getRoleName(req.user) !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only Main Admin can create quotations",
    });
  }

  const {
    clientId,
    items,
    description,
    notes,
    title,
    subTitle,
    shortDescription,
    longDescription,
    image,
    currency = "PKR",
  } = req.body;

  // Resolve client from either Client _id or linked User _id.
  let client = await Client.findById(clientId);
  if (!client) {
    client = await Client.findOne({ userId: clientId });
  }

  // Verify client exists
  if (!client) {
    return res.status(404).json({
      success: false,
      message: "Client not found for provided clientId/userId",
    });
  }

  // Calculate total and advance
  const totalAmount = items.reduce(
    (sum, item) => sum + item.qty * item.rate,
    0,
  );
  const advanceRequired = totalAmount * 0.5;

  const quotation = await Quotation.create({
    clientId: client._id,
    mainAdminId: req.user._id,
    title: title || "Untitled Quotation",
    subTitle: subTitle || "",
    shortDescription: shortDescription || "",
    longDescription: longDescription || "",
    image: image || null,
    quotationDetails: {
      items,
      totalAmount,
      advanceRequired,
      description: description || longDescription,
      currency: currency,
    },
    notes,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  createNotification({
    title: "Quotation created",
    message: `${quotation.title} was created for ${client.name || client.email}.`,
    type: "quotation",
    recipientRole: "admin",
    actor: req.user._id,
    entityId: quotation._id,
    entityType: "Quotation",
    link: "/chat",
    metadata: {
      clientId: client._id,
      quotationStatus: quotation.status,
    },
  }).catch((notificationError) => {
    console.error("Quotation notification failed:", notificationError.message);
  });

  res.status(201).json({
    success: true,
    message: "Quotation created successfully",
    data: quotation,
  });
});

// Update quotation (before client signature)
exports.updateQuotation = catchAsync(async (req, res) => {
  // Verify Main Admin
  if (getRoleName(req.user) !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only Main Admin can update quotations",
    });
  }

  const quotation = await Quotation.findById(req.params.quotationId);

  if (!quotation) {
    return res.status(404).json({
      success: false,
      message: "Quotation not found",
    });
  }

  // Only allow updates if pending
  if (quotation.status !== "pending") {
    return res.status(400).json({
      success: false,
      message: "Can only update quotations in pending status",
    });
  }

  const { items, description, notes } = req.body;

  // Recalculate if items changed
  if (items) {
    const totalAmount = items.reduce(
      (sum, item) => sum + item.qty * item.rate,
      0,
    );
    quotation.quotationDetails.items = items;
    quotation.quotationDetails.totalAmount = totalAmount;
    quotation.quotationDetails.advanceRequired = totalAmount * 0.5;
  }

  if (description) quotation.quotationDetails.description = description;
  if (notes) quotation.notes = notes;

  await quotation.save();

  res.status(200).json({
    success: true,
    message: "Quotation updated successfully",
    data: quotation,
  });
});

// Send quotation to client
exports.sendQuotation = catchAsync(async (req, res) => {
  // Verify user is admin or worker
  const allowedRoles = ["admin", "worker"];
  if (!allowedRoles.includes(getRoleName(req.user))) {
    return res.status(403).json({
      success: false,
      message: "Only Admin or Worker can send quotations",
    });
  }

  const quotation = await Quotation.findByIdAndUpdate(
    req.params.quotationId,
    { status: "sent" },
    { new: true },
  );

  if (!quotation) {
    return res.status(404).json({
      success: false,
      message: "Quotation not found",
    });
  }

  try {
    const client = await Client.findById(quotation.clientId);
    if (client?.email) {
      const sentTemplate = buildQuotationEmail("sent", {
        partnerName: client.name || client.username,
        portalLink:
          process.env.PORTAL_LINK ||
          process.env.CLIENT_PANEL_URL ||
          "https://wgtecsol.com/",
      });

      enqueueEmail({
        to: client.email,
        subject: sentTemplate.subject,
        message: sentTemplate.message,
      });
    }

    const recipients = [client?.userId].filter(Boolean);
    if (recipients.length) {
      notifyUsers(recipients, {
        title: "Quotation available",
        message: "A project quotation is ready for your review and signature.",
        type: "quotation",
        recipientRole: "client",
        actor: req.user._id,
        entityId: quotation._id,
        entityType: "Quotation",
        link: "/dashboard/chat",
        metadata: {
          quotationStatus: quotation.status,
          clientId: client?._id,
        },
      }).catch((notificationError) => {
        console.error("Quotation client notification failed:", notificationError.message);
      });
    }
  } catch (emailError) {
    console.error("Error sending quotation sent email:", emailError.message);
  }

  res.status(200).json({
    success: true,
    message: "Quotation sent to client",
    data: quotation,
  });
});

// Submit signed quotation (client)
exports.submitSignedQuotation = catchAsync(async (req, res) => {
  const quotation = await Quotation.findById(req.params.quotationId);

  if (!quotation) {
    return res.status(404).json({
      success: false,
      message: "Quotation not found",
    });
  }

  // Verify client owns this quotation.
  // Supports both auth modes:
  // 1) req.user is Client document (decoded.type === 'client')
  // 2) req.user is User document (client user account)
  const client = await Client.findById(quotation.clientId);
  const requesterId = req.user?._id?.toString?.();
  const quotationClientId = client?._id?.toString?.();
  const quotationClientUserId = client?.userId?.toString?.();
  const requesterEmail = req.user?.email?.toLowerCase?.();
  const quotationClientEmail = client?.email?.toLowerCase?.();

  const isOwnerByClientId = Boolean(
    requesterId && quotationClientId && requesterId === quotationClientId,
  );
  const isOwnerByUserId = Boolean(
    requesterId &&
    quotationClientUserId &&
    requesterId === quotationClientUserId,
  );
  const isOwnerByEmail = Boolean(
    requesterEmail &&
    quotationClientEmail &&
    requesterEmail === quotationClientEmail,
  );

  if (!(isOwnerByClientId || isOwnerByUserId || isOwnerByEmail)) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized - You can only submit your own quotations",
    });
  }

  // Save signature from data URL
  let signatureUrl = null;
  if (req.body.signature && req.body.signature.startsWith("data:image/")) {
    try {
      const signatureData = req.body.signature.replace(
        /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
        "",
      );
      const filename = `signature_${quotation._id}_${Date.now()}.png`;
      const uploadDir = path.join(__dirname, "../uploads/signatures");

      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, Buffer.from(signatureData, "base64"));
      signatureUrl = `/uploads/signatures/${filename}`;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Failed to save signature",
      });
    }
  }

  // Optional fallback: if signature is uploaded as a file field
  if (!signatureUrl && req.files?.signature?.[0]) {
    signatureUrl = `/uploads/documents/${req.files.signature[0].filename}`;
  }

  // Update quotation with submission
  quotation.clientSubmission = {
    signature: signatureUrl,
    nationalIdFront: req.files?.nationalIdFront
      ? `/uploads/documents/${req.files.nationalIdFront[0].filename}`
      : null,
    nationalIdBack: req.files?.nationalIdBack
      ? `/uploads/documents/${req.files.nationalIdBack[0].filename}`
      : null,
    paymentProof: req.files?.paymentProof
      ? `/uploads/documents/${req.files.paymentProof[0].filename}`
      : null,
    submittedAt: new Date(),
  };
  quotation.status = "signed";

  await quotation.save();

  try {
    if (client?.email) {
      const signedTemplate = buildQuotationEmail("signed_submitted", {
        partnerName: client.name || client.username,
        portalLink:
          process.env.PORTAL_LINK ||
          process.env.CLIENT_PANEL_URL ||
          "https://wgtecsol.com/",
      });

      enqueueEmail({
        to: client.email,
        subject: signedTemplate.subject,
        message: signedTemplate.message,
      });
    }
  } catch (emailError) {
    console.error(
      "Error sending quotation submitted email:",
      emailError.message,
    );
  }

  notifyAdmins({
    title: "Quotation signed",
    message: `${client?.name || client?.email || "Client"} submitted a signed quotation.`,
    type: "quotation",
    actor: req.user._id,
    entityId: quotation._id,
    entityType: "Quotation",
    link: "/chat",
    metadata: {
      quotationStatus: quotation.status,
      clientId: client?._id,
    },
  }).catch((notificationError) => {
    console.error("Quotation signed notification failed:", notificationError.message);
  });

  // Create chat notification message so admin sees client submission in chat
  const participantCandidates = [client.userId, client._id].filter(Boolean);
  const chat = await Chat.findOne({
    chatType: "admin_work",
    participants: { $in: participantCandidates },
  }).sort({ updatedAt: -1 });

  if (chat) {
    const senderType = req.userType === "client" ? "Client" : "User";
    const quotationMessage = new Message({
      chatId: chat._id,
      senderId: req.user._id,
      senderType,
      messageType: "quotation",
      content: `Client submitted signed quotation: ${quotation.title || "Quotation"}`,
      quotationData: {
        _id: quotation._id.toString(),
        title: quotation.title,
        subTitle: quotation.subTitle,
        shortDescription: quotation.shortDescription,
        longDescription: quotation.longDescription,
        image: quotation.image,
        postedOn: quotation.createdAt,
        items: quotation.quotationDetails?.items || [],
        currency: quotation.quotationDetails?.currency || "PKR",
        totalAmount: quotation.quotationDetails?.totalAmount || 0,
        advanceRequired: quotation.quotationDetails?.advanceRequired || 0,
        createdBy: quotation.mainAdminId,
        createdAt: quotation.createdAt,
        status: "signed",
      },
      readBy: [{ userId: req.user._id, readAt: new Date() }],
    });

    await quotationMessage.save();

    // Populate sender for clients/admins consuming real-time updates
    let populatedMessage = quotationMessage;
    if (senderType === "Client") {
      populatedMessage = await quotationMessage.populate({
        path: "senderId",
        model: "Client",
        select: "_id username email profileImage name",
      });
    } else {
      populatedMessage = await quotationMessage.populate({
        path: "senderId",
        model: "User",
        select: "_id username email profileImage fullname",
      });
    }

    chat.lastMessage = quotationMessage._id;
    chat.lastMessageTime = new Date();

    const otherParticipants = (chat.participants || []).filter(
      (p) => p.toString() !== req.user._id.toString(),
    );
    otherParticipants.forEach((participantId) => {
      const current = chat.unreadCount.get(participantId.toString()) || 0;
      chat.unreadCount.set(participantId.toString(), current + 1);
    });

    await chat.save();

    // Real-time emit so admin sees submission immediately in open chat
    const io = getIO();
    if (io) {
      io.to(`chat_${chat._id}`).emit("message_received", {
        _id: populatedMessage._id,
        chatId: chat._id,
        senderId: populatedMessage.senderId,
        senderType,
        messageType: "quotation",
        content: quotationMessage.content,
        quotationData: quotationMessage.quotationData,
        createdAt: quotationMessage.createdAt,
        readBy: quotationMessage.readBy,
      });
    }
  }

  res.status(200).json({
    success: true,
    message: "Quotation submitted successfully",
    data: quotation,
  });
});

// Confirm client submission proofs and notify client in chat
exports.confirmSubmission = catchAsync(async (req, res) => {
  if (getRoleName(req.user) !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only Main Admin can confirm submissions",
    });
  }

  const { note } = req.body || {};

  const quotation = await Quotation.findById(req.params.quotationId);
  if (!quotation) {
    return res.status(404).json({
      success: false,
      message: "Quotation not found",
    });
  }

  if (!quotation.clientSubmission?.submittedAt) {
    return res.status(400).json({
      success: false,
      message: "Client submission not found for this quotation",
    });
  }

  if (quotation.submissionConfirmation?.confirmedAt) {
    return res.status(400).json({
      success: false,
      message: "Submission is already confirmed",
    });
  }

  quotation.submissionConfirmation = {
    confirmedBy: req.user._id,
    confirmedAt: new Date(),
    note: typeof note === "string" ? note.trim() : "",
  };
  await quotation.save();

  const client = await Client.findById(quotation.clientId);
  if (client) {
    const participantCandidates = [client.userId, client._id].filter(Boolean);
    const chat = await Chat.findOne({
      chatType: "admin_work",
      participants: { $in: participantCandidates },
    }).sort({ updatedAt: -1 });

    if (chat) {
      const confirmationText = `Your quotation submission for "${quotation.title || "Quotation"}" has been confirmed by admin.`;

      const confirmationMessage = new Message({
        chatId: chat._id,
        senderId: req.user._id,
        senderType: "User",
        messageType: "text",
        content: confirmationText,
        readBy: [{ userId: req.user._id, readAt: new Date() }],
      });

      await confirmationMessage.save();

      const populatedMessage = await confirmationMessage.populate({
        path: "senderId",
        model: "User",
        select: "_id username email profileImage fullname",
      });

      chat.lastMessage = confirmationMessage._id;
      chat.lastMessageTime = new Date();

      const otherParticipants = (chat.participants || []).filter(
        (p) => p.toString() !== req.user._id.toString(),
      );
      otherParticipants.forEach((participantId) => {
        const current = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), current + 1);
      });

      await chat.save();

      const io = getIO();
      if (io) {
        io.to(`chat_${chat._id}`).emit("message_received", {
          _id: populatedMessage._id,
          chatId: chat._id,
          senderId: populatedMessage.senderId,
          senderType: "User",
          messageType: "text",
          content: confirmationMessage.content,
          createdAt: confirmationMessage.createdAt,
          readBy: confirmationMessage.readBy,
        });
      }
    }
  }

  res.status(200).json({
    success: true,
    message: "Submission confirmed and client notified",
    data: quotation,
  });
});

// Approve quotation and assign worker
exports.approveQuotation = catchAsync(async (req, res) => {
  // Verify Main Admin
  if (getRoleName(req.user) !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only Main Admin can approve quotations",
    });
  }

  const { workerId, department } = req.body;
  const quotation = await Quotation.findById(req.params.quotationId).populate(
    "clientId",
  );

  if (!quotation) {
    return res.status(404).json({
      success: false,
      message: "Quotation not found",
    });
  }

  if (quotation.status !== "signed") {
    return res.status(400).json({
      success: false,
      message: "Quotation must be signed before approval",
    });
  }

  // Verify worker exists
  const worker = await User.findById(workerId);
  if (!worker) {
    return res.status(404).json({
      success: false,
      message: "Worker not found",
    });
  }

  // Get client details
  const client = await Client.findById(quotation.clientId);
  if (!client) {
    return res.status(404).json({
      success: false,
      message: "Client not found",
    });
  }

  // Check if client already has a user account
  let clientUser = await User.findById(client.userId);

  if (!clientUser) {
    // Generate temporary password for new client account
    const tempPassword = generateTempPassword();

    // Create new client user account
    clientUser = await User.create({
      email: client.email,
      password: tempPassword, // Will be hashed by the pre-save hook
      username: client.email.split("@")[0], // Use email prefix as username
      fullname: client.name,
      role: "client",
      isActive: true,
    });

    // ✅ ALSO SAVE PASSWORD TO CLIENT MODEL
    client.password = tempPassword; // Will be hashed by clientModel middleware

    // Update client record with the new user ID
    client.userId = clientUser._id;
    await client.save();

    // Send email with login credentials to client
    try {
      const acceptedTemplate = buildProposalStatusEmail("Accepted", {
        partnerName: client.name || client.username,
        partnerId: client._id,
        partnerEmail: client.email,
        partnerPassword: tempPassword,
        portalLink:
          process.env.PORTAL_LINK ||
          process.env.CLIENT_PANEL_URL ||
          "https://wgtecsol.com/",
      });

      enqueueEmail({
        to: client.email,
        subject: acceptedTemplate.subject,
        message: acceptedTemplate.message,
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Continue even if email fails - account is created
    }
  }

  // Update quotation
  quotation.status = "approved";
  quotation.adminApproval = {
    approvedBy: req.user._id,
    approvedAt: new Date(),
    assignedWorker: workerId,
    assignedDepartment: department,
  };
  await quotation.save();

  // Update client with worker assignment
  await Client.findByIdAndUpdate(
    quotation.clientId,
    {
      assignedWorker: workerId,
      assignedDepartment: department,
    },
    { new: true },
  );

  // Add client to worker's assigned clients
  await User.findByIdAndUpdate(workerId, {
    $addToSet: { assignedClients: client._id },
    assignedDepartment: department,
  });

  await ensureClientAdminChat({
    client,
    clientUser,
    adminId: req.user._id,
  });
  const groupChat = await ensureGroupChat({
    workerId,
    clientId: client._id,
    adminId: req.user._id,
  });

  const inProgressTemplate = buildProposalStatusEmail("In Progress", {
    partnerName: client.name || client.username,
    partnerId: client._id,
    partnerEmail: client.email,
    projectId: quotation._id,
    assignedWorker: worker.fullname || worker.username || worker.email,
    startDate: new Date(),
    portalLink:
      process.env.PORTAL_LINK ||
      process.env.CLIENT_PANEL_URL ||
      "https://wgtecsol.com/",
  });

  enqueueEmail({
    to: client.email,
    subject: inProgressTemplate.subject,
    message: inProgressTemplate.message,
  });

  notifyUsers([workerId, clientUser?._id].filter(Boolean), {
    title: "Project activated",
    message: `${client.name || client.email}'s project is now in progress.`,
    type: "task",
    recipientRole: "worker",
    actor: req.user._id,
    entityId: quotation._id,
    entityType: "Quotation",
    link: groupChat?._id ? `/chat?chatId=${groupChat._id}` : "/chat",
    metadata: {
      quotationStatus: quotation.status,
      clientId: client._id,
      workerId,
      groupChatId: groupChat?._id,
    },
  }).catch((notificationError) => {
    console.error("Quotation approval notification failed:", notificationError.message);
  });

  createNotification({
    title: "Worker assigned",
    message: `${worker.fullname || worker.username || worker.email} was assigned to ${client.name || client.email}.`,
    type: "task",
    recipientRole: "admin",
    actor: req.user._id,
    entityId: quotation._id,
    entityType: "Quotation",
    link: groupChat?._id ? `/chat?chatId=${groupChat._id}` : "/chat",
    metadata: {
      clientId: client._id,
      workerId,
      groupChatId: groupChat?._id,
    },
  }).catch((notificationError) => {
    console.error("Worker assignment notification failed:", notificationError.message);
  });

  res.status(200).json({
    success: true,
    message: "Quotation approved, worker assigned, and client account created",
    data: quotation,
  });
});

// Reject quotation
exports.rejectQuotation = catchAsync(async (req, res) => {
  // Verify Main Admin
  if (req.user.designation?.roleName !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only Main Admin can reject quotations",
    });
  }

  const { reason } = req.body;
  const quotation = await Quotation.findByIdAndUpdate(
    req.params.quotationId,
    {
      status: "rejected",
      rejectionReason: reason,
      rejectedAt: new Date(),
      rejectedBy: req.user._id,
    },
    { new: true },
  );

  if (!quotation) {
    return res.status(404).json({
      success: false,
      message: "Quotation not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Quotation rejected",
    data: quotation,
  });
});

// Delete quotation
exports.deleteQuotation = catchAsync(async (req, res) => {
  // Verify Main Admin
  if (req.user.designation?.roleName !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only Main Admin can delete quotations",
    });
  }

  const quotation = await Quotation.findByIdAndDelete(req.params.quotationId);

  if (!quotation) {
    return res.status(404).json({
      success: false,
      message: "Quotation not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Quotation deleted successfully",
  });
});
