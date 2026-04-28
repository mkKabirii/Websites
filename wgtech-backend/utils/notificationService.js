const Notification = require("../model/notificationModel");
const User = require("../model/userModel");
const { getIO } = require("./socketService");

const normalizeRole = (role) => role || "admin";

const emitNotification = (notification) => {
  const io = getIO();
  if (!io || !notification) return;

  const payload = {
    _id: notification._id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    link: notification.link,
    entityId: notification.entityId,
    entityType: notification.entityType,
    recipient: notification.recipient,
    recipientRole: notification.recipientRole,
    createdAt: notification.createdAt,
    metadata: notification.metadata || {},
  };

  if (notification.recipient) {
    io.to(`user_${notification.recipient}`).emit("notification:new", payload);
    io.emit(`notification:user:${notification.recipient}`, payload);
    return;
  }

  io.emit("notification:new", payload);
};

const createNotification = async ({
  title,
  message = "",
  type = "system",
  recipient = null,
  recipientRole = "admin",
  actor = null,
  actorModel = "User",
  entityId = null,
  entityType = "",
  link = "",
  metadata = {},
}) => {
  if (!title) return null;

  const notification = await Notification.create({
    title,
    message,
    type,
    recipient,
    recipientRole: normalizeRole(recipientRole),
    actor,
    actorModel,
    entityId,
    entityType,
    link,
    metadata,
  });

  emitNotification(notification);
  return notification;
};

const notifyAdmins = async (payload) => {
  const admins = await User.find({ role: "admin", isActive: true }).select("_id");

  if (!admins.length) {
    return createNotification({ ...payload, recipientRole: "admin" });
  }

  return Promise.all(
    admins.map((admin) =>
      createNotification({
        ...payload,
        recipient: admin._id,
        recipientRole: "admin",
      }),
    ),
  );
};

const notifyUsers = async (userIds, payload) => {
  const uniqueIds = [...new Set((userIds || []).filter(Boolean).map(String))];
  return Promise.all(
    uniqueIds.map((userId) =>
      createNotification({
        ...payload,
        recipient: userId,
        recipientRole: payload.recipientRole || "user",
      }),
    ),
  );
};

module.exports = {
  createNotification,
  notifyAdmins,
  notifyUsers,
};
