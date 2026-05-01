import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";
import AutoReplySettings from "./AutoReplySettings";
import NotificationBadge from "./NotificationBadge";
import "./ChatContainer.css";

const ChatContainer = ({ userId, adminId, userRole, source = "accepted" }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [showAutoReply, setShowAutoReply] = useState(false);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);
  const selectedChatRef = useRef(null);
  const chatsRef = useRef([]);
  const handledDeepLinkChatRef = useRef("");
  const location = useLocation();
  const navigate = useNavigate();
  const normalizeId = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "object") {
      if (value._id) return String(value._id).trim();
      if (value.$oid) return String(value.$oid).trim();
      const str = value.toString();
      if (str !== "[object Object]") return str.trim();
    }
    return String(value).trim();
  };

  const getChatActivityTime = (chat) => {
    const candidates = [
      chat?.lastMessageTime,
      chat?.lastMessage?.createdAt,
      chat?.updatedAt,
      chat?.createdAt,
    ].filter(Boolean);

    if (candidates.length === 0) return 0;
    return new Date(candidates[0]).getTime() || 0;
  };

  const sortChatsByLatest = (list) => {
    if (!Array.isArray(list)) return [];
    return [...list].sort(
      (a, b) => getChatActivityTime(b) - getChatActivityTime(a),
    );
  };


  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    chatsRef.current = Array.isArray(chats) ? chats : [];
  }, [chats]);

  const markChatAsRead = async (chatId) => {
    if (!chatId || !userId) return;

    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8003";
    try {
      await fetch(`${apiBase}/api/v1/messages/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ chatId, userId }),
      });
    } catch (error) {
      console.error("Error marking chat as read:", error);
    }
  };

  // Initialize Socket.io connection
  useEffect(() => {
    if (!userId) return;

    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8003";
    const socketBaseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:8003"
    )
      .replace(/\/api\/?$/, "")
      .replace(/\/$/, "");

    socketRef.current = io(socketBaseUrl, {
      query: { userId },
      transports: ["polling", "websocket"],
      upgrade: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 20,
      withCredentials: true,
      timeout: 10000,
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Connected to socket server");
      // Re-join the active chat room after a reconnect so room membership is restored
      const activeChat = selectedChatRef.current;
      if (activeChat?._id && userId) {
        console.log("🔄 Admin socket reconnected — re-joining room:", activeChat._id);
        socketRef.current?.emit(
          "join_chat",
          { chatId: activeChat._id, userId },
          (ack) => console.log("✅ Admin reconnect join_chat ack:", ack),
        );
      }
    });

    socketRef.current.on("disconnect", () => {
      console.log("❌ Disconnected from socket server");
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    socketRef.current.on("user_online", (data) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [data.userId]: "online",
      }));
    });

    socketRef.current.on("user_offline", (data) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [data.userId]: "offline",
      }));
    });

    socketRef.current.on("message_received", (message) => {
      console.log("📨 Admin message received:", message._id, "chatId:", message.chatId, "activeChatId:", selectedChatRef.current?._id);

      const activeChat = selectedChatRef.current;
      const incomingChatId = normalizeId(message?.chatId);
      const activeChatId = normalizeId(activeChat?._id);
      const isActiveChatMessage = Boolean(
        activeChatId &&
        incomingChatId &&
        (
          incomingChatId === activeChatId ||
          String(message?.chatId).includes(activeChatId) ||
          activeChatId.includes(incomingChatId)
        )
      );
      const senderId = normalizeId(message?.senderId);
      const isOwnMessage = senderId === normalizeId(userId);

      // Deduplicate: only add to message list if it belongs to active chat
      // Also handles temp-message replacement for optimistic updates
      if (isActiveChatMessage) {
        setMessages((prev) => {
          // If a real message arrived, replace any matching temp message (same content + chatId)
          const hasTempMatch = prev.some(
            (msg) =>
              msg._id?.startsWith("temp_") &&
              msg.content === message.content &&
              String(msg.chatId) === String(message.chatId)
          );
          if (hasTempMatch) {
            // Replace the temp message with the real one
            return prev.map((msg) =>
              msg._id?.startsWith("temp_") &&
                msg.content === message.content &&
                String(msg.chatId) === String(message.chatId)
                ? message
                : msg
            );
          }
          // Standard dedup by _id
          const messageExists = prev.some((msg) => msg._id === message._id);
          if (messageExists) {
            return prev;
          }
          return [...prev, message];
        });
      }

      // Update unread counters
      if (!isOwnMessage) {
        if (isActiveChatMessage) {
          markChatAsRead(incomingChatId);
          setUnreadCount((prev) => ({ ...prev, [incomingChatId]: 0 }));
        } else {
          setUnreadCount((prev) => {
            const next = {
              ...prev,
              [incomingChatId]: (prev[incomingChatId] || 0) + 1,
            };
            return next;
          });
          setTotalUnread((prev) => prev + 1);
        }
      }

      // Keep latest active conversations at top in sidebar.
      setChats((prev) => {
        const existing = Array.isArray(prev) ? prev : [];
        const idx = existing.findIndex(
          (chat) => String(chat?._id) === String(message?.chatId),
        );
        if (idx === -1) return existing;

        const updated = [...existing];
        updated[idx] = {
          ...updated[idx],
          lastMessage: message,
          lastMessageTime: message?.createdAt || new Date().toISOString(),
          updatedAt: message?.createdAt || updated[idx]?.updatedAt,
        };
        return sortChatsByLatest(updated);
      });
    });

    socketRef.current.on("status_notification", (notification) => {
      console.log("📢 Status notification:", notification);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId]);

  // Fetch chats (accepted proposals or all clients based on source)
  useEffect(() => {
    if (!userId) return;

    const fetchChats = async () => {
      try {
        // For workers: use user endpoint with filtering
        // For admin: use admin endpoint with all chats
        let url;
        if (userRole === "worker") {
          url = `${import.meta.env.VITE_API_URL || "http://localhost:8003"}/api/v1/chats/user/${userId}`;
        } else {
          const adminSource =
            source === "clients"
              ? "clients"
              : source === "website"
                ? "website"
                : "accepted";
          url = `${import.meta.env.VITE_API_URL || "http://localhost:8003"}/api/v1/chats/admin/${adminSource}`;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();

        // Handle both admin and worker response formats
        let chatsData = [];

        if (userRole === "worker") {
          // Worker endpoint returns array of chats directly
          chatsData = data.data || [];
          const deduplicatedChats = Array.from(
            new Map(chatsData.map((chat) => [chat._id, chat])).values(),
          );
          const mapped = deduplicatedChats.map((chat) => ({
            ...chat,
            meta: {
              clientName: chat.groupName || chat.clientId?.username || "Chat",
              clientId: chat.clientId?._id,
              clientProfileImage: chat.clientId?.profileImage,
            },
          }));
          setChats(mapped);
        } else {
          // Admin endpoint returns proposals with chats
          if (data.success && Array.isArray(data.data)) {
            // Deduplicate chats by _id (remove duplicates, keep first occurrence)
            const seen = new Set();
            const deduplicated = [];

            for (const entry of data.data) {
              const placeholderKey =
                entry.chat?._id ||
                `placeholder_${entry.clientUserId ||
                entry.clientId ||
                entry.proposalId ||
                entry.proposalEmail ||
                "unknown"
                }`;
              const chatId = placeholderKey;
              if (!seen.has(chatId)) {
                seen.add(chatId);
                deduplicated.push(entry);
              }
            }

            // ── Fix #5: filter out guest / non-client users on the "clients" tab ──
            const clientEntries =
              source === "clients"
                ? deduplicated.filter((entry) => {
                  const role = (entry.clientRole || "").toLowerCase();
                  // If the backend sends a role, keep only "client"
                  if (role && role !== "client") return false;
                  // Drop entries with no real user identity
                  if (!entry.clientId && !entry.clientUserId) return false;
                  // Drop obvious guest entries by username pattern
                  const uname = (entry.clientUsername || entry.clientName || "").toLowerCase();
                  if (uname.startsWith("guest")) return false;
                  return true;
                })
                : deduplicated;

            const mapped = clientEntries.map((entry) => {
              const baseMeta = {
                proposalId: entry.proposalId,
                proposalTitle: entry.proposalTitle,
                proposalEmail: entry.proposalEmail,
                clientId: entry.clientId,
                clientUserId: entry.clientUserId,
                clientName: entry.clientName,
                clientUsername: entry.clientUsername,
                clientProfileImage: entry.clientProfileImage,
                progressMedia: entry.progressMedia,
                documents: entry.documents,
                comments: entry.comments,
              };

              if (entry.chat) {
                const chat = { ...entry.chat, meta: baseMeta };
                // Ensure chatType is always a string
                if (typeof chat.chatType !== "string") {
                  chat.chatType = "admin_work";
                }
                // Ensure lastMessage is either null or an object (not rendered directly)
                if (chat.lastMessage && typeof chat.lastMessage !== "object") {
                  chat.lastMessage = null;
                }
                // Preserve group chat name for display
                if (entry.isGroupChat && entry.clientName) {
                  chat.groupName = entry.clientName;
                  chat.isGroupChat = true;
                }
                return chat;
              }

              // Placeholder chat with UNIQUE ID (not null!)
              return {
                _id: `placeholder_${entry.clientUserId ||
                  entry.clientId ||
                  entry.proposalId ||
                  entry.proposalEmail ||
                  "unknown"
                  }`,
                chatType: "admin_work",
                clientId: {
                  _id: entry.clientUserId || entry.clientId,
                  username: entry.clientUsername || entry.clientName,
                  email: entry.proposalEmail,
                  profileImage: entry.clientProfileImage,
                },
                lastMessage: null,
                projectId: null,
                meta: baseMeta,
                _placeholder: true,
              };
            });
            setChats(sortChatsByLatest(mapped));
          }
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [userId, source]);

  // Fetch unread count
  useEffect(() => {
    if (!userId) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:8003"}/api/v1/chats/unread/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        const data = await response.json();
        if (data.success) {
          const unreadByChat = data.data.unreadByChat || {};
          const visibleChatIds = new Set(
            (Array.isArray(chatsRef.current) ? chatsRef.current : []).map(
              (chat) => String(chat._id),
            ),
          );

          const scopedUnreadByChat =
            source === "website"
              ? Object.keys(unreadByChat).reduce((acc, chatId) => {
                if (visibleChatIds.has(String(chatId))) {
                  acc[chatId] = unreadByChat[chatId];
                }
                return acc;
              }, {})
              : unreadByChat;

          const scopedTotalUnread = Object.values(scopedUnreadByChat).reduce(
            (sum, value) => sum + Number(value || 0),
            0,
          );

          setUnreadCount(scopedUnreadByChat);
          setTotalUnread(scopedTotalUnread);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [userId, source]);

  // Fetch messages for selected chat
  const fetchMessages = async (chatId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8003"}/api/v1/messages/chat/${chatId}?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      }

      // Join chat room
      if (socketRef.current) {
        console.log(
          "🔗 Admin joining chat room:",
          chatId,
          "with userId:",
          userId,
        );
        socketRef.current.emit("join_chat", { chatId, userId }, (ack) => {
          console.log("✅ Admin join_chat acknowledged:", ack);
        });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = async (chat) => {
    try {
      // Clear stale messages immediately so old chat doesn't bleed through
      setMessages([]);

      // Ensure chat exists if placeholder
      let resolvedChat = chat;
      const isPlaceholder =
        chat?._placeholder === true ||
        (typeof chat?._id === "string" && chat._id.startsWith("placeholder_"));
      if (isPlaceholder) {
        const ensureRes = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:8003"}/api/v1/chats/admin/ensure`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              clientUserId: chat.meta?.clientUserId,
              clientId: chat.meta?.clientId,
            }),
          },
        );
        const ensureData = await ensureRes.json();
        if (ensureData.success) {
          resolvedChat = { ...ensureData.data, meta: chat.meta };
          // Replace placeholder in list
          setChats((prev) => prev.map((c) => (c === chat ? resolvedChat : c)));
        } else {
          console.error("Failed to create chat", ensureData.message);
          return;
        }
      }

      setSelectedChat(resolvedChat);
      if (resolvedChat._id) {
        await fetchMessages(resolvedChat._id);
        await markChatAsRead(resolvedChat._id);
        setUnreadCount((prev) => {
          const current = prev[resolvedChat._id] || 0;
          const next = { ...prev, [resolvedChat._id]: 0 };
          setTotalUnread((total) => Math.max(0, total - current));
          return next;
        });
      }
    } catch (err) {
      console.error("Error selecting chat", err);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedChatId = params.get("chatId");
    if (!requestedChatId || !Array.isArray(chats) || chats.length === 0) return;

    if (handledDeepLinkChatRef.current === requestedChatId) return;

    if (selectedChat?._id === requestedChatId) return;

    const targetChat = chats.find(
      (chat) => String(chat?._id) === String(requestedChatId),
    );
    if (!targetChat) return;

    handledDeepLinkChatRef.current = requestedChatId;
    handleSelectChat(targetChat);

    // Consume the deep-link query so later chat refreshes don't force-switch again.
    const nextParams = new URLSearchParams(location.search);
    nextParams.delete("chatId");
    navigate(
      {
        pathname: location.pathname,
        search: nextParams.toString() ? `?${nextParams.toString()}` : "",
      },
      { replace: true },
    );
  }, [location.search, chats, navigate, location.pathname]);

  const handleSendMessage = (messageData) => {
    if (!selectedChat || !userId) {
      console.error("Cannot send message: missing chat or user", {
        selectedChat: selectedChat ? selectedChat._id : "missing",
        userId: userId || "missing",
      });
      return;
    }

    if (!socketRef.current?.connected) {
      console.error("Socket not connected, cannot send message");
      alert("Chat connection lost. Please refresh the page.");
      return;
    }

    const payload = {
      ...messageData,
      chatId: selectedChat._id,
      senderId: userId,
    };

    // Optimistically add own message immediately so it renders without waiting for socket echo
    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      ...payload,
      _id: tempId,
      createdAt: new Date().toISOString(),
      readBy: [],
      senderId: { _id: userId },
    };
    setMessages((prev) => [...prev, tempMessage]);

    console.log("📤 Sending message from admin:", payload);
    socketRef.current.emit("send_message", payload, (response) => {
      console.log("📨 Admin message sent response:", response);
    });
  };

  const handleStatusUpdate = (statusData) => {
    socketRef.current?.emit("send_status_update", {
      ...statusData,
      chatId: selectedChat._id,
      senderId: userId,
    });
  };

  const handleDeleteChat = async () => {
    if (!selectedChat?._id || userRole !== "admin") return;
    if (!window.confirm("Delete this chat permanently for all users?")) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8003"}/api/v1/chats/${selectedChat._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.message || "Failed to delete chat");
        return;
      }

      setChats((prev) =>
        (prev || []).filter((chat) => chat._id !== selectedChat._id),
      );
      setSelectedChat(null);
      setMessages([]);
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("Failed to delete chat");
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-notification-badge">
        <NotificationBadge count={totalUnread} />
      </div>

      <div className="chat-layout">
        <ChatSidebar
          chats={chats}
          selectedChat={selectedChat}
          onSelectChat={handleSelectChat}
          unreadCount={unreadCount}
          onlineUsers={onlineUsers}
          onShowAutoReply={() => setShowAutoReply(true)}
          userRole={userRole}
          title={
            source === "clients"
              ? "Client Chats"
              : source === "website"
                ? "Website Support"
                : "Chats"
          }
        />

        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            messages={messages}
            userId={userId}
            onSendMessage={handleSendMessage}
            onStatusUpdate={handleStatusUpdate}
            loading={loading}
            socketRef={socketRef.current}
            meta={selectedChat.meta}
            userRole={userRole}
            onDeleteChat={handleDeleteChat}
          />
        ) : (
          <div className="chat-empty-state">
            <h2>Select a conversation to start chatting</h2>
          </div>
        )}
      </div>

      {showAutoReply && userRole === "admin" && (
        <AutoReplySettings
          adminId={adminId}
          onClose={() => setShowAutoReply(false)}
        />
      )}
    </div>
  );
};

export default ChatContainer;
