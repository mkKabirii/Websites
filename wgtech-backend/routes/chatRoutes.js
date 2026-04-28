const express = require("express");
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Admin: list accepted clients with chat info
router.get(
	"/admin/accepted",
	authMiddleware.protect,
	chatController.listAcceptedClientChats,
);

// Admin: list all clients (Client collection) with chat info
router.get(
	"/admin/clients",
	authMiddleware.protect,
	chatController.listClientChats,
);

// Admin: list website support chats for navigation chat
router.get(
	"/admin/website",
	authMiddleware.protect,
	chatController.listWebsiteSupportChats,
);

// Admin: ensure chat exists for a client
router.post(
	"/admin/ensure",
	authMiddleware.protect,
	chatController.ensureChatForClient,
);

// Admin: create group chat (worker, admin, client)
router.post(
	"/admin/group",
	authMiddleware.protect,
	chatController.createGroupChat,
);

// Get all chats for user (requires auth)
router.get("/user/:userId", authMiddleware.protect, chatController.getUserChats);

// Get single chat (requires auth)
router.get("/:chatId", authMiddleware.protect, chatController.getChat);

// Create new chat (allow without auth for guest users)
router.post("/", chatController.createChat);

// Assign admin to chat (requires auth)
router.put("/assign-admin", authMiddleware.protect, chatController.assignAdminToChat);

// Get unread count (requires auth)
router.get("/unread/:userId", authMiddleware.protect, chatController.getUnreadCount);

// Archive chat (requires auth)
router.put("/:chatId/archive", authMiddleware.protect, chatController.archiveChat);

// Get archived chats (requires auth)
router.get("/archived/:userId", authMiddleware.protect, chatController.getArchivedChats);

module.exports = router;
