const Proposal = require("../model/proposalsModel");
const { successHandler } = require("../utils/helper");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { schemaValidator } = require("../utils/schemaValidator");
const { buildProposalStatusEmail } = require("../utils/emailTemplates");
const User = require("../model/userModel");
const Client = require("../model/clientModel");
const { enqueueEmail } = require("../utils/emailQueue");
const {
  createNotification,
  notifyAdmins,
} = require("../utils/notificationService");
const { ensureClientAdminChat } = require("../utils/chatService");

const {
  createProposalSchema,
  updateProposalSchema,
  updateProposalStatusSchema,
  mongoIdSchema,
} = require("../utils/validation");

// Generate a username that avoids Client.username collisions
const generateUniqueUsername = async (baseUsername) => {
  let candidate = baseUsername;
  let counter = 1;
  while (await Client.exists({ username: candidate })) {
    candidate = `${baseUsername}${counter}`;
    counter += 1;
  }
  return candidate;
};

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

const generateUniqueProposalId = async () => {
  let proposalId;
  let isUnique = false;

  while (!isUnique) {
    proposalId = Math.floor(100000 + Math.random() * 900000);
    const existingProposal = await Proposal.findOne({ proposalId });
    if (!existingProposal) {
      isUnique = true;
    }
  }

  return proposalId;
};

// Fallback-friendly username generator
const buildBaseUsername = (proposal) => {
  if (proposal?.email) return proposal.email.split("@")[0];
  if (proposal?.fullname)
    return (
      proposal.fullname
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 20) || "client"
    );
  return "client";
};

//add here new one replace older save in sticknotes:
const createProposal = catchAsync(async (req, res, next) => {
  const [error, validatedData] = schemaValidator(
    req.body,
    createProposalSchema,
  );
  if (error) {
    return next(new AppError(error, 400));
  }

  const proposalId = await generateUniqueProposalId();

  const proposal = await Proposal.create({
    ...validatedData,
    proposalId,
  });

  let emailStatus = {
    sent: false,
    error: null,
  };

  // ✅ Email Send Confirmation (NO CREDENTIALS SENT - only sent when admin approves)
  try {
    const Settings = require("../model/settingsModal");
    const settings = await Settings.findOne();

    const senderEmail = settings?.senderEmail || null;

    const pendingTemplate = buildProposalStatusEmail("Pending", {
      partnerName: proposal.fullname,
      partnerId: proposal.proposalId,
      partnerEmail: proposal.email,
      portalLink:
        process.env.PORTAL_LINK ||
        process.env.CLIENT_PANEL_URL ||
        "https://wgtecsol.com/",
    });

    enqueueEmail({
      to: proposal.email,
      subject: pendingTemplate.subject,
      message: pendingTemplate.message,
      senderEmail,
    });

    emailStatus.sent = true;
  } catch (emailError) {
    emailStatus.error = emailError.message;
    console.error("📧 Email send failed:", {
      message: emailError.message,
      code: emailError.code,
      response: emailError.response,
    });
  }

  notifyAdmins({
    title: `New proposal from ${proposal.fullname || proposal.email}`,
    message:
      proposal.company || proposal.messages || "A new proposal was submitted.",
    type: "proposal",
    entityId: proposal._id,
    entityType: "Proposal",
    link: `/proposals/${proposal._id}`,
    metadata: {
      proposalId: proposal.proposalId,
      status: proposal.status,
      email: proposal.email,
    },
  }).catch((notificationError) => {
    console.error("Proposal notification failed:", notificationError.message);
  });

  successHandler(
    res,
    {
      ...proposal.toObject(),
      emailStatus,
    },
    emailStatus.sent
      ? "Proposal created successfully"
      : "Proposal created, but confirmation email could not be delivered",
    201,
  );
});

//     // ✅ Email bhejo add kia ha?
//   try {
//     const emailService = new EmailService(proposal.email);
//     await emailService.send({
//       subject: "✅ Proposal Received - WG Tech Solutions",
//       template: "proposalConfirmation",
//       templateData: {
//         fullname: proposal.fullname,
//         email: proposal.email,
//         budget: proposal.budget || "Not specified",
//         password: validatedData.password || "N/A", // ✅ FIX
//         // adminLink: "https://admin.wgtecsol.com",
//         adminLink: process.env.ADMIN_PANEL_URL || "http://localhost:5173", // ✅
//       },
//     });
//   } catch (emailError) {
//     console.error("📧 Email send failed:", emailError.message);
//   }

//   successHandler(res, proposal, "Proposal created successfully", 201);
// });

//add new here
const sendProposalEmail = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { email } = req.body;

  const proposal = await Proposal.findById(id);
  if (!proposal) return next(new AppError("Proposal not found", 404));

  const Settings = require("../model/settingsModal");
  const settings = await Settings.findOne();
  const targetEmail = email || proposal.email;
  const senderEmail = settings?.senderEmail || null;

  const pendingTemplate = buildProposalStatusEmail("Pending", {
    partnerName: proposal.fullname,
    partnerId: proposal.proposalId,
    partnerEmail: targetEmail,
    portalLink:
      process.env.PORTAL_LINK ||
      process.env.CLIENT_PANEL_URL ||
      "https://wgtecsol.com/",
  });

  enqueueEmail({
    to: targetEmail,
    subject: pendingTemplate.subject,
    message: pendingTemplate.message,
    senderEmail,
  });

  successHandler(res, null, "Email sent successfully");
});

const getAllProposals = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status, isActive, search } = req.query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (typeof isActive !== "undefined") {
    filter.isActive =
      typeof isActive === "string" ? isActive === "true" : Boolean(isActive);
  }

  if (search) {
    filter.$or = [
      { fullname: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
    ];
  }

  const proposals = await Proposal.find(filter)
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ createdAt: -1 });

  const total = await Proposal.countDocuments(filter);

  successHandler(
    res,
    {
      proposals,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
    },
    "Proposals retrieved successfully",
  );
});

const getProposalById = catchAsync(async (req, res, next) => {
  const [paramError, { id }] = schemaValidator(req.params, mongoIdSchema);
  if (paramError) {
    return next(new AppError(paramError, 400));
  }

  const proposal = await Proposal.findById(id);

  if (!proposal) {
    return next(new AppError("Proposal not found", 404));
  }

  successHandler(res, proposal, "Proposal retrieved successfully");
});

const updateProposal = catchAsync(async (req, res, next) => {
  const [paramError, { id }] = schemaValidator(req.params, mongoIdSchema);
  if (paramError) {
    return next(new AppError(paramError, 400));
  }

  const [error, validatedData] = schemaValidator(
    req.body,
    updateProposalSchema,
  );
  if (error) {
    return next(new AppError(error, 400));
  }

  // ✅ Pehle purana proposal fetch karo
  const oldProposal = await Proposal.findById(id);
  if (!oldProposal) {
    return next(new AppError("Proposal not found", 404));
  }

  const proposal = await Proposal.findByIdAndUpdate(id, validatedData, {
    new: true,
    runValidators: true,
  });

  if (!proposal) {
    return next(new AppError("Proposal not found", 404));
  }

  // ✅ Status change hua toh email bhejo
  if (validatedData.status && validatedData.status !== oldProposal.status) {
    console.log(
      `\n📧 Status changed: ${oldProposal.status} → ${validatedData.status}`,
    );
    console.log(`📧 Sending email to: ${proposal.email}`);

    try {
      const Settings = require("../model/settingsModal");
      const settings = await Settings.findOne();
      const senderEmail = settings?.senderEmail || null;

      // ✅ Accepted - account banao + credentials bhejo
      // if (validatedData.status === "Accepted") {
      //   const clientPassword = generateTempPassword();
      //   const bcrypt = require("bcryptjs");
      //   const hashedPassword = await bcrypt.hash(clientPassword, 12);

      //   // User check/create
      //   let clientUser = await User.findOne({
      //     email: proposal.email.toLowerCase()
      //   });

      //   if (!clientUser) {
      //     clientUser = await User.create({
      //       fullname: proposal.fullname,
      //       username: proposal.email.split("@")[0],
      //       email: proposal.email.toLowerCase(),
      //       password: hashedPassword,
      //       userType: "client",
      //       role: "client",
      //       isActive: true,
      //     });
      //     console.log("✅ Client user created:", clientUser.email);
      //   } else {
      //     // Password update karo
      //     clientUser.password = hashedPassword;
      //     await clientUser.save();
      //     console.log("✅ Client user password updated:", clientUser.email);
      //   }

      if (validatedData.status === "Accepted") {
        // ✅ Proposal se original password lo
        const clientPassword = proposal.password || generateTempPassword();
        console.log(
          "🔐 Password source:",
          proposal.password ? "From proposal form" : "Generated",
        );

        // User check/create
        let clientUser = await User.findOne({
          email: proposal.email.toLowerCase(),
        });

        if (!clientUser) {
          clientUser = await User.create({
            fullname: proposal.fullname,
            username: proposal.email.split("@")[0],
            email: proposal.email.toLowerCase(),
            password: clientPassword,
            userType: "client",
            role: "client",
            isActive: true,
          });
          console.log("✅ Client user created:", clientUser.email);
        } else {
          // Assign plain password; User model pre-save hook hashes once.
          clientUser.password = clientPassword;
          await clientUser.save();
          console.log("✅ Client user password updated:", clientUser.email);
        }

        // Keep Client collection in sync because login checks Client first.
        const baseUsername = buildBaseUsername(proposal);
        let client =
          (await Client.findOne({ userId: clientUser._id })) ||
          (await Client.findOne({ email: proposal.email })) ||
          (await Client.findOne({ username: baseUsername }));

        if (!client) {
          const safeUsername = await generateUniqueUsername(baseUsername);
          await Client.create({
            userId: clientUser._id,
            name: proposal.fullname,
            email: proposal.email,
            username: safeUsername,
            password: clientPassword,
            phone: proposal.phone || null,
            company: proposal.company || "Not specified",
            address: "To be updated",
            projectName: proposal.messages || "Proposal Project",
            status: "Not Started",
            budget: proposal.budget ? parseInt(proposal.budget) : 0,
            description: proposal.messages || proposal.company || "Project from proposal",
          });
        } else {
          client.userId = client.userId || clientUser._id;
          client.name = proposal.fullname;
          client.email = proposal.email || client.email;
          client.phone = proposal.phone || client.phone;
          client.company = proposal.company || client.company;
          client.projectName = proposal.messages || client.projectName || "Proposal Project";
          client.budget = proposal.budget ? parseInt(proposal.budget) : client.budget;
          client.description = proposal.messages || proposal.company || client.description;
          if (!client.username) {
            client.username = await generateUniqueUsername(baseUsername);
          }
          client.password = clientPassword;
          await client.save();
        }

        // Accepted email with credentials
        const acceptedTemplate = buildProposalStatusEmail("Accepted", {
          partnerName: proposal.fullname,
          partnerId: proposal.proposalId,
          partnerEmail: proposal.email,
          partnerPassword: clientPassword,
          portalLink: process.env.CLIENT_PANEL_URL || "https://wgtecsol.com/",
        });

        enqueueEmail({
          to: proposal.email,
          subject: acceptedTemplate.subject,
          message: acceptedTemplate.message,
          senderEmail,
        });

        console.log("✅ Accepted email with credentials queued!");
      } else {
        // ✅ Baaki statuses - normal email
        const statusTemplate = buildProposalStatusEmail(validatedData.status, {
          partnerName: proposal.fullname,
          partnerId: proposal.proposalId,
          partnerEmail: proposal.email,
          projectId: proposal.proposalId,
          assignedWorker: "Will be assigned shortly",
          startDate: new Date(),
          completionDate: new Date(),
          portalLink: process.env.CLIENT_PANEL_URL || "https://wgtecsol.com/",
        });

        enqueueEmail({
          to: proposal.email,
          subject: statusTemplate.subject,
          message: statusTemplate.message,
          senderEmail,
        });

        console.log(
          `✅ ${validatedData.status} email queued for: ${proposal.email}`,
        );
      }
    } catch (emailError) {
      console.error("❌ Email error:", emailError.message);
    }
  }

  successHandler(res, proposal, "Proposal updated successfully");
});

// const updateProposal = catchAsync(async (req, res, next) => {
//   const [paramError, { id }] = schemaValidator(req.params, mongoIdSchema);
//   if (paramError) {
//     return next(new AppError(paramError, 400));
//   }

//   const [error, validatedData] = schemaValidator(
//     req.body,
//     updateProposalSchema
//   );
//   if (error) {
//     return next(new AppError(error, 400));
//   }

//   const proposal = await Proposal.findByIdAndUpdate(id, validatedData, {
//     new: true,
//     runValidators: true,
//   });

//   if (!proposal) {
//     return next(new AppError("Proposal not found", 404));
//   }

//   successHandler(res, proposal, "Proposal updated successfully");
// });

const updateProposalStatus = catchAsync(async (req, res, next) => {
  const [paramError, { id }] = schemaValidator(req.params, mongoIdSchema);
  if (paramError) {
    return next(new AppError(paramError, 400));
  }

  const [error, validatedData] = schemaValidator(
    req.body,
    updateProposalStatusSchema,
  );
  if (error) {
    return next(new AppError(error, 400));
  }

  // ✅ First, fetch the current proposal before updating
  const currentProposal = await Proposal.findById(id);
  if (!currentProposal) {
    return next(new AppError("Proposal not found", 404));
  }

  console.log("\n📋 PROPOSAL STATUS UPDATE - DETAILED LOG:");
  console.log("=".repeat(60));
  console.log("⏰ Timestamp:", new Date().toISOString());
  console.log(
    "🔐 Auth Header Present:",
    req.headers.authorization ? "YES" : "🚨 NO",
  );
  console.log("Proposal ID:", id);
  console.log("Previous Status:", currentProposal.status);
  console.log("New Status Requested:", validatedData.status);
  console.log(
    "Status Comparison:",
    validatedData.status,
    "===",
    "Accepted",
    "?",
    validatedData.status === "Accepted",
  );
  console.log("Proposal ID:", id);
  console.log("Previous Status:", currentProposal.status);
  console.log("New Status Requested:", validatedData.status);
  console.log(
    "Status Comparison:",
    validatedData.status,
    "===",
    "Accepted",
    "?",
    validatedData.status === "Accepted",
  );

  const proposal = await Proposal.findByIdAndUpdate(
    id,
    { status: validatedData.status },
    { new: true, runValidators: true },
  );

  if (!proposal) {
    return next(new AppError("Proposal not found", 404));
  }

  let acceptanceResult = {
    statusUpdated: true,
    userCreated: false,
    clientCreated: false,
    emailSent: false,
    errors: [],
  };

  // ✅ When status changes to "Accepted", create user account, client record and send credentials
  if (validatedData.status === "Accepted") {
    console.log(
      "\n✅ ACCEPTANCE CONDITION MATCHED - PROCESSING ACCOUNT CREATION\n",
    );

    try {
      // ✅ Use password from proposal if provided, otherwise generate one
      const clientPassword = proposal.password || generateTempPassword();
      console.log(
        "🔐 Password source:",
        proposal.password ? "From proposal" : "Generated",
      );
      console.log("🔐 Password length:", clientPassword.length);

      // Check if user already exists
      let clientUser = await User.findOne({ email: proposal.email });

      if (!clientUser) {
        console.log("🔄 Creating NEW user account for:", proposal.email);

        // Create new client user account
        clientUser = await User.create({
          email: proposal.email,
          password: clientPassword, // Will be hashed by pre-save hook
          username: proposal.email.split("@")[0],
          fullname: proposal.fullname,
          role: "client",
          isActive: true,
        });

        console.log("✅ User account CREATED successfully");
        console.log("   User ID:", clientUser._id);
        acceptanceResult.userCreated = true;
      } else {
        console.log("🔄 User ALREADY EXISTS for:", proposal.email);
        console.log("🔄 Updating password...");

        // Update existing user with new password
        clientUser.password = clientPassword; // Will be hashed by pre-save hook
        await clientUser.save();

        console.log("✅ Password updated for existing user");
      }

      // ✅ Create or update Client record (handle duplicates by email/username)
      console.log("\n🔄 Creating/Checking Client record...");
      try {
        const baseUsername = buildBaseUsername(proposal);

        let client =
          (await Client.findOne({ userId: clientUser._id })) ||
          (await Client.findOne({ email: proposal.email })) ||
          (await Client.findOne({ username: baseUsername }));

        if (!client) {
          console.log("🔄 Client record does NOT exist - creating new...");

          const safeUsername = await generateUniqueUsername(baseUsername);

          client = await Client.create({
            userId: clientUser._id,
            name: proposal.fullname,
            email: proposal.email,
            username: safeUsername,
            password: clientPassword, // hashed by pre-save hook
            phone: proposal.phone || null,
            company: proposal.company || "Not specified",
            address: "To be updated",
            projectName: proposal.messages || "Proposal Project",
            status: "Not Started",
            budget: proposal.budget ? parseInt(proposal.budget) : 0,
            description:
              proposal.messages || proposal.company || "Project from proposal",
          });

          console.log("✅ Client record CREATED successfully");
          console.log("   Client ID:", client._id);
          acceptanceResult.clientCreated = true;
        } else {
          console.log("ℹ️  Client record already exists with ID:", client._id);
          // Update linkage and core fields; also ensure password and username are present
          client.userId = client.userId || clientUser._id;
          client.name = proposal.fullname;
          client.email = proposal.email || client.email;
          client.phone = proposal.phone || client.phone;
          client.company = proposal.company || client.company;
          client.projectName =
            proposal.messages || client.projectName || "Proposal Project";
          client.budget = proposal.budget
            ? parseInt(proposal.budget)
            : client.budget;
          client.description =
            proposal.messages || proposal.company || client.description;

          if (!client.username) {
            client.username = await generateUniqueUsername(baseUsername);
          }

          // Keep Client and User credentials in sync so client login works
          // against whichever collection is checked first.
          client.password = clientPassword;

          await client.save();
          console.log("✅ Client record UPDATED successfully");
          acceptanceResult.clientCreated = true;
        }
      } catch (clientError) {
        console.error("\n❌ ERROR CREATING CLIENT RECORD:");
        console.error("   Error:", clientError.message);
        console.error("   Details:", clientError);
        acceptanceResult.errors.push({
          step: "client_creation",
          error: clientError.message,
        });
        throw clientError;
      }

      // ✅ ALWAYS send email when status is "Accepted" with the password
      console.log("\n🔄 Sending credentials email...");
      try {
        const Settings = require("../model/settingsModal");
        const settings = await Settings.findOne();
        const senderEmail = settings?.senderEmail || null;

        console.log("✅ Email queued for:", proposal.email);

        const acceptedTemplate = buildProposalStatusEmail("Accepted", {
          partnerName: proposal.fullname,
          partnerId: proposal.proposalId,
          partnerEmail: proposal.email,
          partnerPassword: clientPassword,
          portalLink:
            process.env.PORTAL_LINK ||
            process.env.CLIENT_PANEL_URL ||
            "https://wgtecsol.com/",
        });

        enqueueEmail({
          to: proposal.email,
          subject: acceptedTemplate.subject,
          message: acceptedTemplate.message,
          senderEmail,
        });

        console.log(
          "✅ Credentials email queued successfully to:",
          proposal.email,
        );
        acceptanceResult.emailSent = true;
      } catch (emailError) {
        console.error("\n❌ ERROR SENDING EMAIL:");
        console.error("   Error:", emailError.message);
        console.error("   Code:", emailError.code);
        acceptanceResult.errors.push({
          step: "email_send",
          error: emailError.message,
        });
        // Continue - account and client are created even if email fails
      }

      const clientRecord =
        (await Client.findOne({ userId: clientUser._id })) ||
        (await Client.findOne({ email: proposal.email }));
      await ensureClientAdminChat({
        client: clientRecord,
        clientUser,
        adminId: req.user?._id,
        projectId: proposal._id,
      });
    } catch (userError) {
      console.error("\n❌ ERROR IN PROPOSAL ACCEPTANCE LOGIC:");
      console.error("   Error:", userError.message);
      console.error("   Stack:", userError.stack);
      acceptanceResult.errors.push({
        step: "acceptance_logic",
        error: userError.message,
      });
      // Continue - status is still updated
    }
  } else {
    console.log("\nℹ️  Status is not 'Accepted' - skipping account creation");
    console.log("   Current status:", validatedData.status);

    try {
      const Settings = require("../model/settingsModal");
      const settings = await Settings.findOne();
      const senderEmail = settings?.senderEmail || null;

      const statusTemplate = buildProposalStatusEmail(validatedData.status, {
        partnerName: proposal.fullname,
        partnerId: proposal.proposalId,
        partnerEmail: proposal.email,
        projectId: proposal.proposalId,
        assignedWorker: "Will be assigned shortly",
        startDate: new Date(),
        completionDate: new Date(),
        portalLink:
          process.env.PORTAL_LINK ||
          process.env.CLIENT_PANEL_URL ||
          "https://wgtecsol.com/",
      });

      enqueueEmail({
        to: proposal.email,
        subject: statusTemplate.subject,
        message: statusTemplate.message,
        senderEmail,
      });
    } catch (statusEmailError) {
      console.error(
        "❌ Error sending proposal status email:",
        statusEmailError.message,
      );
    }
  }

  createNotification({
    title: `Proposal ${proposal.status}`,
    message: `${proposal.fullname || proposal.email}'s proposal is now ${proposal.status}.`,
    type: "proposal_status",
    recipientRole: "admin",
    entityId: proposal._id,
    entityType: "Proposal",
    link: `/proposals/${proposal._id}`,
    metadata: {
      proposalId: proposal.proposalId,
      status: proposal.status,
      email: proposal.email,
    },
  }).catch((notificationError) => {
    console.error(
      "Proposal status notification failed:",
      notificationError.message,
    );
  });

  console.log("\n✅ FINAL RESULT:");
  console.log("   Proposal status updated to:", proposal.status);
  console.log("   User created:", acceptanceResult.userCreated);
  console.log("   Client created:", acceptanceResult.clientCreated);
  console.log("   Email sent:", acceptanceResult.emailSent);
  if (acceptanceResult.errors.length > 0) {
    console.log("   Errors occurred:", acceptanceResult.errors);
  }
  console.log("=".repeat(60) + "\n");

  successHandler(
    res,
    {
      proposal,
      acceptanceDetails: acceptanceResult,
    },
    "Proposal status updated successfully",
    200,
  );
});

const deleteProposal = catchAsync(async (req, res, next) => {
  const [paramError, { id }] = schemaValidator(req.params, mongoIdSchema);
  if (paramError) {
    return next(new AppError(paramError, 400));
  }

  const proposal = await Proposal.findByIdAndDelete(id);

  if (!proposal) {
    return next(new AppError("Proposal not found", 404));
  }

  successHandler(res, null, "Proposal deleted successfully");
});

module.exports = {
  createProposal,
  getAllProposals,
  getProposalById,
  updateProposal,
  updateProposalStatus,
  deleteProposal,
  sendProposalEmail, // ✅ YEH HAI?
};
