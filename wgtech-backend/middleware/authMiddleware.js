// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const UserModel = require("../model/userModel");
const ClientModel = require("../model/clientModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const protect = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("You are not logged in!", 401));
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError("Invalid or expired token", 401));
  }

  // ✅ Check if token is from CLIENT or USER
  let user;
  if (decoded.type === "client") {
    // Fetch from Client model
    user = await ClientModel.findById(decoded.id).select("-password");
    
    if (!user) return next(new AppError("Client no longer exists", 401));
    
    // Add type to req.user so controllers know it's a client
    req.userType = "client";
  } else {
    // Fetch from User model (for admin/workers)
    user = await UserModel.findById(decoded.id)
      .populate("designation", "roleName routes status")
      .select("-password");

    if (!user) return next(new AppError("User no longer exists", 401));

    if (!user.isActive)
      return next(new AppError("User not active. Please contact Admin", 401));
    
    req.userType = "user";
  }

  req.user = user;
  next();
});

const authorize = (roles) => {
  return catchAsync(async (req, res, next) => {
    const user = req.user;
    if (!roles.includes(user.role)) {
      return next(
        new AppError("You are not authorized to access this resource", 403)
      );
    }
    next();
  });
};


module.exports = { protect, authorize };
