const Notification = require("../model/notificationModel");
const catchAsync = require("../utils/catchAsync");
const { successHandler } = require("../utils/helper");

const buildVisibilityQuery = (user) => {
  const role = user?.role || user?.designation?.roleName || "user";
  const userId = user?._id;

  return {
    $or: [
      { recipient: userId },
      { recipient: null, recipientRole: role },
      { recipient: null, recipientRole: "all" },
    ],
  };
};

const getNotifications = catchAsync(async (req, res) => {
  const { limit = 30, unreadOnly = false } = req.query;
  const userId = req.user?._id;

  const filter = buildVisibilityQuery(req.user);
  if (String(unreadOnly) === "true") {
    filter.readBy = { $not: { $elemMatch: { userId } } };
  }

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();

  const mapped = notifications.map((notification) => ({
    ...notification,
    isRead: notification.readBy?.some(
      (entry) => String(entry.userId) === String(userId),
    ),
  }));

  const unreadCount = mapped.filter((notification) => !notification.isRead).length;

  successHandler(
    res,
    { notifications: mapped, unreadCount },
    "Notifications retrieved successfully",
  );
});

const markNotificationRead = catchAsync(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    {
      $addToSet: {
        readBy: {
          userId: req.user._id,
          readAt: new Date(),
        },
      },
    },
    { new: true },
  );

  successHandler(res, notification, "Notification marked as read");
});

const markAllNotificationsRead = catchAsync(async (req, res) => {
  const filter = buildVisibilityQuery(req.user);
  filter.readBy = { $not: { $elemMatch: { userId: req.user._id } } };

  await Notification.updateMany(filter, {
    $addToSet: {
      readBy: {
        userId: req.user._id,
        readAt: new Date(),
      },
    },
  });

  successHandler(res, null, "All notifications marked as read");
});

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
