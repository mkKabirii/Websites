import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  Typography,
} from "@mui/material";
import {
  Bell,
  CheckCheck,
  FileText,
  MessageSquare,
  ClipboardList,
  Briefcase,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../api/module/notification";

const iconByType = {
  proposal: FileText,
  proposal_status: FileText,
  application: FileText,
  application_status: FileText,
  chat_message: MessageSquare,
  task: ClipboardList,
  quotation: Briefcase,
  system: Bell,
};

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      ),
    [notifications],
  );

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getNotifications(30);
      if (response?.status === 200 || response?.status === 201) {
        const data = response?.data?.data || {};
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const poll = setInterval(fetchNotifications, 30000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const socketBaseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:8003"
    )
      .replace(/\/api\/?$/, "")
      .replace(/\/$/, "");

    const socket = io(socketBaseUrl, {
      query: { userId },
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("notification:new", (notification) => {
      setNotifications((prev) => {
        if (prev.some((item) => item._id === notification._id)) return prev;
        return [{ ...notification, isRead: false }, ...prev].slice(0, 30);
      });
      setUnreadCount((prev) => prev + 1);
    });

    socket.on("new_proposal_notification", fetchNotifications);

    return () => socket.disconnect();
  }, []);

  const handleClose = () => setAnchorEl(null);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markNotificationRead(notification._id);
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notification._id ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    if (notification.link) navigate(notification.link);
    handleClose();
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
  };

  const NotificationItem = ({ notification }) => {
    const Icon = iconByType[notification.type] || Bell;

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          p: 1.5,
          cursor: "pointer",
          backgroundColor: notification.isRead ? "#fff" : "#F4FFE6",
          "&:hover": { backgroundColor: "#f5f5f5" },
        }}
        onClick={() => handleNotificationClick(notification)}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#E8F5E8",
            flex: "0 0 auto",
          }}
        >
          <Icon size={18} color="#4CAF50" />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: notification.isRead ? 500 : 700,
              color: "#222",
              lineHeight: 1.35,
            }}
          >
            {notification.title}
          </Typography>
          {notification.message && (
            <Typography
              variant="caption"
              sx={{
                color: "#666",
                display: "block",
                mt: 0.4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {notification.message}
            </Typography>
          )}
          <Typography variant="caption" sx={{ color: "#999", fontSize: 11 }}>
            {notification.createdAt
              ? new Date(notification.createdAt).toLocaleString()
              : "Just now"}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ position: "relative" }}>
      <IconButton
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          backgroundColor: "#fff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          "&:hover": { backgroundColor: "#f7f7f7" },
        }}
      >
        <Badge
          badgeContent={unreadCount > 99 ? "99+" : unreadCount}
          color="error"
          overlap="circular"
        >
          <Bell size={20} color="gray" />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            borderRadius: 2,
            width: { xs: 320, sm: 390 },
            maxWidth: "calc(100vw - 24px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ color: "#222", fontWeight: 700 }}>
            Notifications
          </Typography>
          <Button
            size="small"
            startIcon={<CheckCheck size={14} />}
            onClick={handleReadAll}
            sx={{ textTransform: "none", color: "#4CAF50" }}
          >
            Read all
          </Button>
        </Box>
        <Divider />

        <Box sx={{ maxHeight: 420, overflowY: "auto" }}>
          {loading && notifications.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ color: "#777" }}>
                Loading notifications...
              </Typography>
            </Box>
          ) : sortedNotifications.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ color: "#777" }}>
                No notifications yet.
              </Typography>
            </Box>
          ) : (
            sortedNotifications.map((notification, index) => (
              <React.Fragment key={notification._id}>
                <NotificationItem notification={notification} />
                {index < sortedNotifications.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </Box>
      </Menu>
    </Box>
  );
};

export default NotificationBell;
