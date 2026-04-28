// server.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const path = require("path");

const errorMiddleware = require("./middleware/errorMiddleware");
const AppError = require("./utils/appError");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const subServiceRoutes = require("./routes/subServiceRoutes");
const userRoleRoutes = require("./routes/userRoleRoutes");
const aboutUsRoutes = require("./routes/aboutUsRoutes");
const advertisementRoutes = require("./routes/advertisementRoutes");
const faqRoutes = require("./routes/faqRoutes");
const opportunitiesRoutes = require("./routes/opportunitiesRoutes");
const ourStoryRoutes = require("./routes/ourStoryRoutes");
const ourTeamRoutes = require("./routes/ourTeamRoutes");
const teamRoleRoutes = require("./routes/teamRoleRoutes");
const workRoutes = require("./routes/workRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const resourcesRoutes = require("./routes/resourcesRoutes");
const eventsRoutes = require("./routes/eventsRoutes");
const proposalsRoutes = require("./routes/proposalsRoutes");
const phaseRoutes = require("./routes/phaseRoutes");
const homeRoutes = require("./routes/homeRoutes");
const applicationsRoutes = require("./routes/applicationsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const autoReplyRoutes = require("./routes/autoReplyRoutes");
const clientsRoutes = require("./routes/clientsRoutes");
const quotationsRoutes = require("./routes/quotationsRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

// ----------------------- MIDDLEWARES ----------------------- //

// Security headers
app.use(helmet());

// Logging (only in development)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// CORS
const allowedOrigins = ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true, // Allow cookies / auth headers
}));

// Body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Data sanitization
app.use(mongoSanitize());
app.use(xss());

// Compression
app.use(compression());

// ----------------------- STATIC FILES ----------------------- //
// Serve uploaded files
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// ✅ Naya — yeh replace karo
app.use("/uploads", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
}, express.static(path.join(__dirname, "uploads")));

// Create upload directories if they don't exist
const fs = require("fs");
const uploadDirs = ["uploads", "uploads/progress", "uploads/documents", "uploads/signatures"];
uploadDirs.forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// ----------------------- ROUTES ----------------------- //
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/subservices", subServiceRoutes);
app.use("/api/v1/userroles", userRoleRoutes);
app.use("/api/v1/aboutus", aboutUsRoutes);
app.use("/api/v1/advertisements", advertisementRoutes);
app.use("/api/v1/faqs", faqRoutes);
app.use("/api/v1/opportunities", opportunitiesRoutes);
app.use("/api/v1/ourstory", ourStoryRoutes);
app.use("/api/v1/team", ourTeamRoutes);
app.use("/api/v1/teamroles", teamRoleRoutes);
app.use("/api/v1/works", workRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/resources", resourcesRoutes);
app.use("/api/v1/events", eventsRoutes);
app.use("/api/v1/proposals", proposalsRoutes);
app.use("/api/v1/phases", phaseRoutes);
app.use("/api/v1/home", homeRoutes);
app.use("/api/v1/applications", applicationsRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/chats", chatRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/auto-replies", autoReplyRoutes);
app.use("/api/v1/clients", clientsRoutes);
app.use("/api/v1/quotations", quotationsRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/tasks", taskRoutes);

// ----------------------- UNHANDLED ROUTES ----------------------- //
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ----------------------- GLOBAL ERROR HANDLER ----------------------- //
app.use(errorMiddleware);

// ----------------------- EXPORT APP ----------------------- //
module.exports = app;
