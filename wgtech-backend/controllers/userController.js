const User = require("../model/userModel");
const Client = require("../model/clientModel");
const UserRole = require("../model/userRole");
const { successHandler, signToken } = require("../utils/helper");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { hashPassword, comparePassword } = require("../utils/helper");
const { schemaValidator } = require("../utils/schemaValidator");
const { createUserSchema } = require("../utils/validation");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  ensureClientAdminChat,
  syncWorkerClientAssignments,
} = require("../utils/chatService");
// const { generateToken } = require("../utils/jwt");

// const { generateToken } = require("../utils/jwt");

// âœ… Multer setup for profile picture
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads/profiles");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile_${Date.now()}${ext}`);
  },
});

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // âœ… 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WEBP allowed"), false);
    }
  },
}).single("profilePicture");

const normalizeRoleName = (roleName) => {
  const normalized = String(roleName || "").trim().toLowerCase();
  if (["admin", "main admin", "superadmin"].includes(normalized)) return "admin";
  if (normalized === "worker") return "worker";
  if (normalized === "client") return "client";
  return "user";
};

const getEffectiveRole = (user) => {
  const storedRole = String(user?.role || "").toLowerCase();
  const designationRole = String(user?.designation?.roleName || "").toLowerCase();
  return normalizeRoleName(
    storedRole && storedRole !== "user" ? storedRole : designationRole || storedRole,
  );
};

const resolveRoleFromDesignation = async (designation, fallback = "user") => {
  if (!designation) return normalizeRoleName(fallback);
  const userRole = await UserRole.findById(designation).select("roleName");
  return normalizeRoleName(userRole?.roleName || fallback);
};

// Create User (for backend - creates admin/worker)
// For clients, this endpoint now creates a CLIENT instead
const createUser = catchAsync(async (req, res, next) => {
  // âœ… Check what fields are provided to determine if it's a client or admin registration
  const { email, username, password, name, company, projectName, phone, role, designation, profileImage } = req.body;

  // If 'name' or 'company' or 'projectName' is provided â†’ CLIENT registration
  if (name || company || projectName) {
    // Create CLIENT
    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return next(new AppError("Email already registered", 400));
    }

    const existingUsername = await Client.findOne({ username });
    if (existingUsername) {
      return next(new AppError("Username already taken", 400));
    }

    const client = await Client.create({
      name: name || username,
      email,
      username,
      password, // Will be hashed by clientModel middleware
      company: company || "",
      projectName: projectName || "",
      phone: phone || "",
    });

    // Generate token
    const token = jwt.sign(
      { id: client._id, type: "client" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return successHandler(
      res,
      {
        client: {
          _id: client._id,
          name: client.name,
          email: client.email,
          username: client.username,
          company: client.company,
          projectName: client.projectName,
        },
        token,
      },
      "Client registered successfully",
      201
    );
  }

  // Otherwise it's a USER/ADMIN registration
  const [error, validatedData] = schemaValidator(req.body, createUserSchema);
  if (error) {
    return next(new AppError(error, 400));
  }

  if (getEffectiveRole(req.user) !== "admin") {
    return next(new AppError("Only admins can create admin panel users", 403));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("User with this email already exists", 400));
  }

  const effectiveRole = await resolveRoleFromDesignation(designation, role);
  const assignedClients =
    effectiveRole === "worker" && Array.isArray(req.body.assignedClients)
      ? req.body.assignedClients
      : [];

  // Create user (admin/worker)
  const user = await User.create({
    email,
    username,
    password,
    role: effectiveRole,
    designation,
    assignedClients,
  });

  if (effectiveRole === "worker" && assignedClients.length > 0 && req.user?._id) {
    await syncWorkerClientAssignments({
      workerId: user._id,
      clientIds: assignedClients,
      adminId: req.user._id,
    });
  }

  // Remove password from response
  user.password = undefined;

  // Populate assigned clients for response
  const populatedUser = await User.findById(user._id)
    .populate("designation", "roleName routes")
    .populate("assignedClients", "name email company");

  successHandler(res, populatedUser, "User created successfully", 201);
});

const loginUser = catchAsync(async (req, res, next) => {
  const { email, password, portal } = req.body;

  // âœ… NOW CHECK CLIENT MODEL FIRST (for client login)
  const client = await Client.findOne({ email }).select("+password");
  if (client) {
    // Client found - authenticate as client
    const isPasswordValid = await bcrypt.compare(password, client.password);
    if (!isPasswordValid) {
      return next(new AppError("Invalid password", 401));
    }

    if (portal === "admin") {
      return next(new AppError("Client accounts cannot access Admin Panel", 403));
    }

    // Generate token with client type
    const token = jwt.sign(
      { id: client._id, type: "client" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    ensureClientAdminChat({ client }).catch((chatError) => {
      console.error("Auto chat creation failed:", chatError.message);
    });

    return successHandler(
      res,
      {
        client: {
          _id: client._id,
          name: client.name,
          email: client.email,
          username: client.username,
          company: client.company,
          projectName: client.projectName,
          status: client.status,
          type: "client",
        },
        token,
      },
      "Client logged in successfully",
      200
    );
  }

  // âœ… IF NOT CLIENT, CHECK USER MODEL (for admin/worker login)
  const user = await User.findOne({ email }).populate("designation", "roleName routes status");
  if (!user) {
    return next(new AppError("No account found with this email", 404));
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    return next(new AppError("Invalid password", 400));
  }

  const effectiveRole = getEffectiveRole(user);
  user.role = effectiveRole;

  if (portal === "client" && effectiveRole !== "client") {
    return next(new AppError("Only client accounts can access Client Portal", 403));
  }

  if (portal === "admin" && !["admin", "worker"].includes(effectiveRole)) {
    return next(new AppError("Only admin or worker accounts can access Admin Panel", 403));
  }

  // Generate token with user type
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  if (effectiveRole === "client") {
    const client = await Client.findOne({ email: user.email });
    ensureClientAdminChat({ client, clientUser: user }).catch((chatError) => {
      console.error("Auto chat creation failed:", chatError.message);
    });
  }

  successHandler(res, { user, token }, "User logged in successfully", 200);
});

// Get All Users
const getAllUsers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, role, isActive } = req.query;

  let filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const users = await User.find(filter)
    .populate("designation", "roleName")
    .populate("assignedClients", "name email company")
    .select("-password")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(filter);

  successHandler(
    res,
    {
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    },
    "Users retrieved successfully",
  );
});

// Get User by ID
const getUserById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const requesterRole = getEffectiveRole(req.user);

  if (requesterRole !== "admin" && String(req.user?._id) !== String(id)) {
    return next(new AppError("You can only access your own profile", 403));
  }

  const user = await User.findById(id)
    .populate("designation", "roleName routes")
    .populate("assignedClients", "name email company")
    .select("-password");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  successHandler(res, user, "User retrieved successfully");
});

// Update User
const updateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  const adminId = req.user?._id;

  if (updateData.password) {
    updateData.password = await hashPassword(updateData.password);
  }

  if (updateData.designation || updateData.role) {
    updateData.role = await resolveRoleFromDesignation(
      updateData.designation,
      updateData.role,
    );
  }

  if (updateData.role && updateData.role !== "worker") {
    updateData.assignedClients = [];
  }

  const user = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("designation", "roleName routes")
    .populate("assignedClients", "name email company");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (Array.isArray(updateData.assignedClients)) {
    await syncWorkerClientAssignments({
      workerId: user._id,
      clientIds: updateData.assignedClients,
      adminId,
    });
  }

  user.password = undefined;

  successHandler(res, user, "User updated successfully");
});
// Delete User
const deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findByIdAndDelete(id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  successHandler(res, null, "User deleted successfully");
});

// GET /api/v1/users/profile
const getProfile = catchAsync(async (req, res, next) => {
  if (req.userType === "client") {
    const client = await Client.findById(req.user._id).select("-password");
    if (!client) return next(new AppError("Client not found", 404));
    return successHandler(
      res,
      {
        ...client.toObject(),
        fullname: client.name || client.username,
        role: "client",
        userType: "client",
      },
      "Profile fetched successfully",
    );
  }

  const user = await User.findById(req.user._id).select("-password");
  if (!user) return next(new AppError("User not found", 404));
  successHandler(res, user, "Profile fetched successfully");
});

// PUT /api/v1/users/profile
const updateProfile = catchAsync(async (req, res, next) => {
  const { fullname, email, password } = req.body;
  const updateData = { fullname, email };

  if (password) {
    const bcrypt = require("bcryptjs");
    updateData.password = await bcrypt.hash(password, 12);
  }

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  successHandler(res, user, "Profile updated successfully");
});

// module.exports = { ..., getProfile, updateProfile };
// Toggle User Status
const toggleUserStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  user.isActive = !user.isActive;
  await user.save();

  successHandler(
    res,
    user,
    `User ${user.isActive ? "activated" : "deactivated"} successfully`,
  );
});

// âœ… FORGOT PASSWORD â€” OTP Send
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new AppError("Email is required", 400));

  const user = await User.findOne({ email });
  if (!user) return next(new AppError("No account found with this email", 404));

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save OTP in user
  user.resetOtp = otp;
  user.resetOtpExpiry = otpExpiry;
  await user.save();

  // Send OTP email
  try {
    const EmailService = require("../utils/emailService");
    const emailService = new EmailService(email);
    await emailService.send({
      subject: "ðŸ” Password Reset OTP - WG Tech Solutions",
      message: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#111;color:#fff;border-radius:12px;">
          <h2 style="color:#9EFF00;">Password Reset Request</h2>
          <p>Hi <strong>${user.fullname || user.username}</strong>,</p>
          <p>Your OTP for password reset is:</p>
          <div style="background:#1a1a1a;border:2px solid #9EFF00;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
            <h1 style="color:#9EFF00;font-size:48px;letter-spacing:8px;margin:0;">${otp}</h1>
          </div>
          <p style="color:#aaa;">This OTP expires in <strong style="color:#fff;">10 minutes</strong>.</p>
          <p style="color:#aaa;">If you didn't request this, please ignore this email.</p>
          <hr style="border-color:#333;margin:20px 0;">
          <p style="color:#666;font-size:12px;">WG Tech Solutions Team</p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error("OTP email failed:", emailErr.message);
    return next(new AppError("Failed to send OTP email", 500));
  }

  successHandler(res, null, "OTP sent to your email");
});

// âœ… VERIFY OTP + RESET PASSWORD
const resetPassword = catchAsync(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return next(new AppError("Email, OTP and new password are required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) return next(new AppError("User not found", 404));

  // Check OTP
  if (user.resetOtp !== otp) {
    return next(new AppError("Invalid OTP", 400));
  }

  // Check expiry
  if (!user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
    return next(new AppError("OTP has expired. Please request a new one", 400));
  }

  user.password = newPassword;
  user.resetOtp = undefined;
  user.resetOtpExpiry = undefined;
  await user.save();

  successHandler(res, null, "Password reset successfully! Please login.");
});
// âœ… UPDATE PROFILE PICTURE
// const updateProfilePicture = catchAsync(async (req, res, next) => {
//   const multer = require("multer");
//   const path = require("path");
//   const fs = require("fs");

//   // Upload directory
//   const uploadDir = path.join(__dirname, "../uploads/profiles");
//   if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

//   const storage = multer.diskStorage({
//     destination: (req, file, cb) => cb(null, uploadDir),
//     filename: (req, file, cb) => {
//       const ext = path.extname(file.originalname);
//       cb(null, `profile_${req.user._id}${ext}`);
//     },
//   });

//   const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }).single("profilePicture");

//   upload(req, res, async (err) => {
//     if (err) return next(new AppError("Upload failed: " + err.message, 400));
//     if (!req.file) return next(new AppError("No file uploaded", 400));

//     const profilePicture = `/uploads/profiles/${req.file.filename}`;

//     const user = await User.findByIdAndUpdate(
//       req.user._id,
//       { profilePicture },
//       { new: true }
//     ).select("-password");

//     successHandler(res, user, "Profile picture updated successfully");
//   });
// });
const updateProfilePicture = (req, res, next) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) return next(new AppError("Upload failed: " + err.message, 400));
    if (!req.file) return next(new AppError("No file uploaded", 400));

    try {
      const profilePicture = `/uploads/profiles/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { profilePicture },
        { new: true },
      ).select("-password");

      successHandler(res, user, "Profile picture updated successfully");
    } catch (error) {
      next(new AppError("Database update failed", 500));
    }
  });
};
module.exports = {
  getProfile,
  createUser,
  updateProfile,
  loginUser,
  updateProfilePicture, // âœ…
  forgotPassword, // âœ…
  resetPassword, // âœ…
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
};
