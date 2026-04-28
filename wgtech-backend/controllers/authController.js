const User = require("../model/userModel");
const Client = require("../model/clientModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { ensureClientAdminChat } = require("../utils/chatService");

// ─── REGISTER (CLIENT ONLY) ──────────────────────
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, username, password, company, projectName, phone } = req.body;

  // 1. Check karo email pehle se exist karta hai?
  const existingClient = await Client.findOne({ email });
  if (existingClient) {
    return next(new AppError("Email already registered", 400));
  }

  // 2. Check karo username pehle se exist karta hai?
  const existingUsername = await Client.findOne({ username });
  if (existingUsername) {
    return next(new AppError("Username already taken", 400));
  }

  // 3. Password encrypt karo (middleware will handle it)
  // 4. Client banao DB mein
  const client = await Client.create({
    name,
    email,
    username,
    password,
    company: company || "",
    projectName: projectName || "",
    phone: phone || "",
  });

  // 5. JWT token banao
  const token = jwt.sign(
    { id: client._id, type: "client" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  ensureClientAdminChat({ client }).catch((chatError) => {
    console.error("Auto chat creation failed:", chatError.message);
  });

  // 6. Response bhejo
  res.status(201).json({
    status: "success",
    data: {
      token,
      client: {
        _id: client._id,
        name: client.name,
        email: client.email,
        username: client.username,
        company: client.company,
        projectName: client.projectName,
      },
    },
  });
});

// ─── LOGIN (CLIENT ONLY) ──────────────────────────
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Client dhundo email se (from CLIENT collection, not User)
  const client = await Client.findOne({ email }).select("+password");
  if (!client) {
    // ⚠️ 404 return karo — frontend issi se decide karta hai register karna hai
    return next(new AppError("No client account found with this email", 404));
  }

  // 2. Password check karo
  const isMatch = await bcrypt.compare(password, client.password);
  if (!isMatch) {
    return next(new AppError("Incorrect password", 401));
  }

  // 3. Token banao
  const token = jwt.sign(
    { id: client._id, type: "client" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  // 4. Response bhejo
  res.status(200).json({
    status: "success",
    data: {
      token,
      client: {
        _id: client._id,
        name: client.name,
        email: client.email,
        username: client.username,
        company: client.company,
        projectName: client.projectName,
        status: client.status,
        assignedWorker: client.assignedWorker,
      },
    },
  });
});

// ─── GUEST CLIENT LOGIN ───────────────────────────
exports.guestLogin = catchAsync(async (req, res, next) => {
  const { name, company } = req.body;
  const MAX_RETRIES = 3;
  let retryCount = 0;

  const createGuestAttempt = async () => {
    if (retryCount >= MAX_RETRIES) {
      return next(new AppError("Failed to create guest account after multiple attempts", 500));
    }

    console.log(`🔓 Guest login request (attempt ${retryCount + 1}/${MAX_RETRIES}):`, { name, company });

    // Create a truly unique guest ID using UUID-like approach
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const uniqueId = `${timestamp}-${random}`;
    
    const guestEmail = `guest-${uniqueId}@example.com`;
    const guestUsername = `guest-${uniqueId}`;
    const guestPassword = Math.random().toString(36).substr(2, 20);

    console.log("🔓 Generated unique guest:", { email: guestEmail, username: guestUsername });

    try {
      // Try to find existing guest (unlikely but safe)
      let client = await Client.findOne({ email: guestEmail });

      if (!client) {
        // Create new guest client
        client = await Client.create({
          name: name || "Guest Client",
          username: guestUsername,
          email: guestEmail,
          password: guestPassword,
          company: company || "Guest Company",
          projectName: "Guest Project",
        });
        console.log("✅ New guest client created:", client._id);
      } else {
        console.log("ℹ️ Guest client already exists:", client._id);
      }

      // Generate token
      const token = jwt.sign(
        { id: client._id, type: "client" },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      console.log("🔑 Guest token generated");

      res.status(200).json({
        success: true,
        token,
        user: {
          _id: client._id,
          name: client.name,
          username: client.username,
          email: client.email,
          company: client.company,
        },
        client: {
          _id: client._id,
          name: client.name,
          username: client.username,
          email: client.email,
          company: client.company,
        },
      });
    } catch (error) {
      console.error(`❌ Guest login error (attempt ${retryCount + 1}):`, error.message);
      // If duplicate key, retry with new unique ID (up to MAX_RETRIES)
      if (error.code === 11000 && retryCount < MAX_RETRIES - 1) {
        retryCount++;
        console.log(`🔄 Duplicate detected, retrying (${retryCount}/${MAX_RETRIES - 1})...`);
        return createGuestAttempt();
      }
      next(error);
    }
  };

  return createGuestAttempt();
});
