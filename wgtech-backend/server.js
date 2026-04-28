


const http = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const { initializeSocket } = require("./utils/socketService");

// Set default NODE_ENV if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: path.join(__dirname, "./config.prod.env") });
} else {
  dotenv.config({ path: path.join(__dirname, "./config.dev.env") });
}

const app = require("./app");
const DB = process.env.DATABASE_URL;

if (!DB) {
  console.error("❌ DATABASE_URL is not defined in environment variables.");
  process.exit(1);
}

mongoose
  .connect(DB, {
    retryWrites: true,
    w: "majority",
    serverSelectionTimeoutMS: 15000,
  })
  .then(async (conn) => {
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    const adminDb = conn.connection.db.admin();
    const dbList = await adminDb.listDatabases();
    console.log(
      "📂 Databases:",
      dbList.databases.map((db) => db.name)
    );

    const collections = await conn.connection.db.listCollections().toArray();
    console.log(
      "📁 Collections:",
      collections.map((col) => col.name)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });


const server = http.createServer(app);

// Initialize Socket.io for real-time chat
const corsOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_PANEL_URL,
  process.env.CLIENT_APP_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

const corsOptions = {
  origin: corsOrigins.length ? corsOrigins : "*",
  credentials: true,
};

const io = initializeSocket(server, corsOptions);

const PORT = process.env.PORT || 8003;

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

process.on("uncaughtException", (err) => {
  console.log("💥 UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.log("💥 UNHANDLED REJECTION! Shutting down...");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully.");
  server.close(() => {
    console.log("💥 Process terminated!");
  });
});

