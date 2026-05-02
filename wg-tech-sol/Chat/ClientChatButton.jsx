import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { MessageCircle, X } from "lucide-react";
import ClientChatWindow from "./ClientChatWindow";
import ClientQuotationSignDialog from "./ClientQuotationSignDialog";
import "./ClientChatButton.css";

const ClientChatButton = ({
  userId,
  userName,
  userEmail,
  userProfileImage,
  token,
  preferredChatType = "admin_work",
  fallbackChatType = "website",
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [chatType, setChatType] = useState(preferredChatType);
  const [socketReady, setSocketReady] = useState(false);
  const [supportTyping, setSupportTyping] = useState(false);
  const [openWidgetNewCount, setOpenWidgetNewCount] = useState(0);
  const [showQuotationSignDialog, setShowQuotationSignDialog] = useState(false);
  const [currentQuotationId, setCurrentQuotationId] = useState(null);
  const [currentQuotationData, setCurrentQuotationData] = useState(null);
  const socketRef = useRef(null);
  const typingFallbackTimeoutRef = useRef(null);
  const normalizeId = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      if (value._id) return String(value._id);
      if (value.$oid) return String(value.$oid);
      if (typeof value.toString === "function") return String(value.toString());
    }
    return String(value);
  };

  useEffect(() => {
    if (!userId) return;

    const fetchUnreadCount = async () => {
      try {
        const authHeader = token || localStorage.getItem("token") || "";
        if (!authHeader) return;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"}/api/v1/chats/unread/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${authHeader}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) return;
        const data = await response.json();
        if (data.success && data.data) {
          const totalUnread = Number(data.data.totalUnread || 0);
          if (isChatOpen) {
            setUnreadCount(0);
          } else {
            setUnreadCount((prev) => Math.max(prev, totalUnread));
          }
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [userId, token, isChatOpen]);

  const markChatAsRead = async (targetChatId) => {
    if (!targetChatId || !userId) return;
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"}/api/v1/messages/read`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({ chatId: targetChatId, userId }),
        },
      );
    } catch (error) {
      console.error("Failed to mark chat as read:", error);
    }
  };

  // Initialize Socket.io
  useEffect(() => {
    if (!userId) {
      console.log("⏳ Waiting for userId before initializing socket");
      return;
    }

    console.log("🔌 Initializing socket with userId:", userId);

    // Close old socket if exists
    if (socketRef.current?.connected) {
      console.log("🔌 Closing previous socket connection");
      socketRef.current.disconnect();
    }

    const socketBaseUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"
    )
      .replace(/\/api\/?$/, "")
      .replace(/\/$/, "");

    socketRef.current = io(socketBaseUrl, {
      query: { userId },
      transports: ["polling", "websocket"],
      upgrade: true,
      reconnect: true,
      reconnectDelay: 1000,
      reconnectDelayMax: 5000,
      reconnectAttempts: 20,
      withCredentials: true,
      timeout: 10000,
    });

    // Connection events
    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected:", socketRef.current.id);
      setSocketReady(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setSocketReady(false);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    socketRef.current.on("message_error", (error) => {
      console.error("❌ Message error:", error);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId]);

  // Fetch existing chat for the desired type
  const fetchExistingChat = async (type) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"}/api/v1/chats/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
          },
        },
      );

      const data = await response.json();
      if (!data.success) return null;

      // Get all chats
      const chats = Array.isArray(data.data) ? data.data : [];
      if (!chats.length) return null;

      // Always prefer the explicitly requested chat type first.
      // This prevents selecting a different thread (e.g. group/website)
      // and missing real-time messages in the currently visible chat.
      const typeChats = chats.filter((c) => c.chatType === type);
      if (typeChats.length > 0) {
        // Prefer non-group direct chat for admin_work.
        const directTypeChat =
          type === "admin_work"
            ? typeChats.find((c) => !c.isGroupChat)
            : typeChats[0];
        return directTypeChat || typeChats[0];
      }

      // Fallback to any available non-group chat before group chats.
      const nonGroupChat = chats.find((c) => !c.isGroupChat);
      if (nonGroupChat) return nonGroupChat;

      // Last resort
      return chats[0];
    } catch (error) {
      console.error("Error fetching existing chat:", error);
      return null;
    }
  };

  // Create a website chat (guests only)
  const createWebsiteChat = async () => {
    console.log("🔨 Creating website chat for userId:", userId);
    const createResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"}/api/v1/chats`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          clientId: userId,
          chatType: "website",
        }),
      },
    );

    console.log("📡 Create chat response status:", createResponse.status);
    const createData = await createResponse.json();
    console.log("📡 Create chat response data:", createData);

    if (!createData.success || !createData.data) {
      console.error("❌ Failed to create website chat:", {
        status: createResponse.status,
        response: createData,
        token: token
          ? "provided"
          : localStorage.getItem("token")
            ? "exists"
            : "missing",
        userId,
        requestPayload: { clientId: userId, chatType: "website" },
      });
      return null;
    }

    console.log("✅ Website chat created:", createData.data._id);
    return createData.data;
  };

  const createAdminWorkChat = async () => {
    console.log("🔨 Creating admin_work chat for userId:", userId);
    const createResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"}/api/v1/chats`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          clientId: userId,
          chatType: "admin_work",
        }),
      },
    );

    console.log(
      "📡 Create admin_work chat response status:",
      createResponse.status,
    );
    const createData = await createResponse.json();
    console.log("📡 Create admin_work chat response data:", createData);

    if (!createData.success || !createData.data) {
      console.error("❌ Failed to create admin_work chat:", {
        status: createResponse.status,
        response: createData,
        token: token
          ? "provided"
          : localStorage.getItem("token")
            ? "exists"
            : "missing",
        userId,
        requestPayload: { clientId: userId, chatType: "admin_work" },
      });
      return null;
    }

    console.log("✅ Admin_work chat created:", createData.data._id);
    return createData.data;
  };

  // Fetch or create chat
  const initializeChat = async () => {
    console.log("🔧 initializeChat called, current chatId:", chatId);
    if (chatId) {
      console.log("⏭️  Chat already initialized, skipping");
      return chatId;
    }

    try {
      setIsLoading(true);

      let activeChatType = preferredChatType || "website";
      console.log("🔍 Fetching existing chat with type:", activeChatType);
      let chat = await fetchExistingChat(activeChatType);

      // If no admin_work chat found, try fallback (website)
      if (!chat && fallbackChatType && fallbackChatType !== activeChatType) {
        activeChatType = fallbackChatType;
        console.log(
          "⚠️  Admin_work chat not found, trying fallback:",
          activeChatType,
        );
        chat = await fetchExistingChat(activeChatType);
      }

      // Create admin_work chat when preferred and missing
      if (!chat && activeChatType === "admin_work") {
        console.log("➕ Creating new admin_work chat");
        chat = await createAdminWorkChat();
      }

      // For guests/website chats, create if still missing
      if (!chat && activeChatType === "website") {
        console.log("➕ Creating new website chat");
        chat = await createWebsiteChat();
      }

      if (!chat || !chat._id) {
        console.error("❌ Chat object invalid or missing:", chat);
        setIsLoading(false);
        return null;
      }

      console.log("✅ Chat found/created:", chat._id, "Type:", activeChatType);
      setChatId(chat._id);
      setChatType(activeChatType);
      setUnreadCount(0);
      markChatAsRead(chat._id);

      // Fetch messages
      const messagesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"}/api/v1/messages/chat/${chat._id}?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
          },
        },
      );

      const messagesData = await messagesResponse.json();
      if (messagesData.success && Array.isArray(messagesData.data)) {
        // Validate messages before storing
        const validMessages = messagesData.data.filter(
          (msg) =>
            msg &&
            typeof msg === "object" &&
            msg._id &&
            typeof msg._id === "string",
        );
        setMessages(validMessages);
        console.log(
          "✅ Messages fetched:",
          validMessages.length,
          "Invalid skipped:",
          messagesData.data.length - validMessages.length,
        );
      }

      // Join chat room - wait for socket to be ready
      const joinRoom = () => {
        if (socketRef.current && socketRef.current.connected) {
          console.log(
            "🔗 Socket is ready, joining chat room:",
            chat._id,
            "with userId:",
            userId,
          );
          socketRef.current.emit(
            "join_chat",
            { chatId: chat._id, userId },
            (ack) => {
              console.log("✅ join_chat acknowledged:", ack);
            },
          );
        } else {
          console.error("❌ Socket not ready:", {
            socketExists: !!socketRef.current,
            socketConnected: socketRef.current?.connected,
          });
        }
      };

      // Try to join immediately or wait for connection
      if (socketRef.current?.connected) {
        console.log("⚡ Socket already connected, joining room immediately");
        joinRoom();
      } else {
        console.log("⏳ Waiting for socket connection before joining room...");
        setTimeout(joinRoom, 1000);
      }

      return chat._id;
    } catch (error) {
      console.error("❌ Error initializing chat:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChat = async () => {
    console.log("📂 handleOpenChat clicked!", {
      currentState: {
        isChatOpen,
        chatId,
        userId,
        socketConnected: socketRef.current?.connected,
      },
    });

    if (!isChatOpen) {
      console.log("🔴 Chat is closed, opening...");
      setIsChatOpen(true);
      setOpenWidgetNewCount(0);
      setSupportTyping(false);
    }

    if (!chatId) {
      console.log("📂 No existing chat, initializing...");
      await initializeChat();
    } else {
      console.log("📂 Using existing chatId:", chatId);
      // Ensure we're still joined to the room
      if (socketRef.current?.connected) {
        console.log("🔗 Re-joining existing chat room:", chatId);
        socketRef.current.emit("join_chat", { chatId, userId }, (ack) => {
          console.log("✅ Re-join_chat acknowledged:", ack);
        });
      }
      setUnreadCount(0);
      markChatAsRead(chatId);
    }
  };

  const handleSendMessage = async (messageData) => {
    console.log("🚀 handleSendMessage called with:", {
      messageData,
      chatId,
      userId,
      socketConnected: socketRef.current?.connected,
    });

    if (!userId) {
      console.error("Cannot send message:", {
        chatId: chatId || "missing",
        userId: userId || "missing",
        messageData,
        socketConnected: socketRef.current?.connected,
      });
      return;
    }

    let resolvedChatId = chatId;
    if (!resolvedChatId) {
      console.log("🧩 No chatId yet, initializing chat before send...");
      resolvedChatId = await initializeChat();
    }

    if (!resolvedChatId) {
      console.error("Cannot send message:", {
        chatId: chatId || "missing",
        userId: userId || "missing",
        messageData,
        socketConnected: socketRef.current?.connected,
      });
      return;
    }

    if (!socketRef.current?.connected) {
      console.error("Socket not connected, cannot send message");
      alert("Chat connection lost. Please Try refreshing the page.");
      return;
    }

    const payload = {
      ...messageData,
      chatId: resolvedChatId,
      senderId: userId,
    };

    setOpenWidgetNewCount(0);
    setSupportTyping(false);

    console.log("📤 Sending message:", payload);

    // Optimistically add message to UI immediately
    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      chatId: resolvedChatId,
      senderId: userId,
      messageType: messageData.messageType || "text",
      content: messageData.content || "",
      fileUrl: messageData.fileUrl || null,
      fileName: messageData.fileName || null,
      imageUrl: messageData.imageUrl || null,
      documentUrl: messageData.documentUrl || null,
      documentName: messageData.documentName || null,
      createdAt: new Date(),
      readBy: [{ userId, readAt: new Date() }],
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    console.log("✨ Message added optimistically to UI");

    socketRef.current.emit("send_message", payload, (response) => {
      console.log("📨 Message sent response:", response);
    });
  };

  // Listen for incoming messages
  useEffect(() => {
    if (!socketRef.current || !socketReady) {
      console.warn("⚠️ Socket not available for message listener");
      return;
    }

    const messageHandler = (message) => {
      console.log("📨 Client received message_received event:", message);
      console.log(
        "📨 Incoming chatId:",
        message.chatId,
        "Current chatId:",
        chatId,
      );

      // Validate message object
      if (!message || typeof message !== "object" || !message._id) {
        console.warn("⚠️ Invalid message object received, skipping:", message);
        return;
      }

      // Validate senderId exists
      if (!message.senderId) {
        console.warn("⚠️ Message has no senderId, rejecting:", message);
        return;
      }

      // Deduplicate and replace optimistic messages
      setMessages((prev) => {
        // Helper to extract sender ID
        const extractSenderId = (senderId) => {
          if (!senderId) return null;
          if (typeof senderId === "string") return senderId;
          if (typeof senderId === "object" && senderId._id) return senderId._id;
          return null;
        };

        // Check if this is a real message replacing an optimistic one
        // Match by content, senderId, and timestamp (within 5 seconds)
        const optimisticIndex = prev.findIndex((m) => {
          if (!m._id.startsWith("temp-")) return false; // Not an optimistic message
          if (m.content !== message.content) return false; // Different content
          if (extractSenderId(m.senderId) !== extractSenderId(message.senderId))
            return false; // Different sender

          // Check timestamp is within 5 seconds
          const optimisticTime = parseInt(m._id.replace("temp-", ""));
          const messageTime = new Date(message.createdAt).getTime();
          const timeDiff = messageTime - optimisticTime;

          return timeDiff >= -5000 && timeDiff <= 5000;
        });

        if (optimisticIndex !== -1) {
          // Replace the optimistic message with the real one
          console.log("✅ Replacing optimistic message with real message");
          const updated = [...prev];
          updated[optimisticIndex] = message;
          return updated;
        }

        // Check if real message already exists
        const messageExists = prev.some(
          (msg) => msg._id === message._id && !msg._id.startsWith("temp-"),
        );
        if (messageExists) {
          console.log(
            "⚠️ Message already exists, skipping duplicate:",
            message._id,
          );
          return prev;
        }

        // Just add the message if no match found
        return [...prev, message];
      });

      // Update unread count only for unopened chat(s)
      const senderId = normalizeId(message.senderId);
      const isOwnMessage = senderId === normalizeId(userId);
      const isCurrentChat =
        Boolean(chatId) && normalizeId(message.chatId) === normalizeId(chatId);

      if (!isOwnMessage) {
        if (isCurrentChat && isChatOpen) {
          markChatAsRead(chatId);
          setUnreadCount(0);
          setOpenWidgetNewCount((prev) => prev + 1);
        } else if (!isChatOpen && (!chatId || isCurrentChat)) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    };

    socketRef.current.on("message_received", messageHandler);
    console.log("✅ Client chat message listener registered");

    return () => {
      socketRef.current?.off("message_received", messageHandler);
      console.log("🔇 Client chat message listener removed");
    };
  }, [userId, chatId, isChatOpen, socketReady]);

  useEffect(() => {
    if (!socketRef.current || !socketReady) return;

    const typingHandler = (typingEvent) => {
      if (!typingEvent || !typingEvent.chatId) return;

      const sameChat = String(typingEvent.chatId) === String(chatId);
      const isOwnTyping = String(typingEvent.userId) === String(userId);
      if (!sameChat || isOwnTyping) return;

      setSupportTyping(Boolean(typingEvent.isTyping));

      if (typingFallbackTimeoutRef.current) {
        clearTimeout(typingFallbackTimeoutRef.current);
      }

      if (typingEvent.isTyping) {
        typingFallbackTimeoutRef.current = setTimeout(() => {
          setSupportTyping(false);
        }, 12000);
      }
    };

    socketRef.current.on("user_typing", typingHandler);

    return () => {
      socketRef.current?.off("user_typing", typingHandler);
      if (typingFallbackTimeoutRef.current) {
        clearTimeout(typingFallbackTimeoutRef.current);
      }
    };
  }, [chatId, socketReady, userId]);

  // Clear unread when chat is open
  useEffect(() => {
    if (isChatOpen && chatId) {
      markChatAsRead(chatId);
      setUnreadCount(0);
    }
  }, [isChatOpen, chatId]);

  // Handle quotation signing modal from quotation cards inside ClientChatWindow
  useEffect(() => {
    const handleOpenClientQuotationSign = (event) => {
      const quotationId = event.detail;
      if (!quotationId) return;

      const quotationMessage = messages?.find(
        (m) => m?.quotationData?._id === quotationId,
      );

      if (quotationMessage?.quotationData) {
        setCurrentQuotationId(quotationId);
        setCurrentQuotationData(quotationMessage.quotationData);
        setShowQuotationSignDialog(true);
      }
    };

    window.addEventListener(
      "openClientQuotationSign",
      handleOpenClientQuotationSign,
    );
    return () => {
      window.removeEventListener(
        "openClientQuotationSign",
        handleOpenClientQuotationSign,
      );
    };
  }, [messages]);

  return (
    <>
      {!isChatOpen && (
        <button
          className="chat-button"
          onClick={handleOpenChat}
          title="Open chat"
        >
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <span className="chat-badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {isChatOpen && (
        <div className="chat-modal">
          <div className="chat-modal-header">
            <div className="chat-modal-title-wrap">
              <h3>Chat with Support</h3>
              {openWidgetNewCount > 0 && (
                <span className="chat-modal-new-count">
                  {openWidgetNewCount > 99 ? "99+" : openWidgetNewCount} new
                </span>
              )}
            </div>
            <button
              className="close-chat-btn"
              onClick={() => setIsChatOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="chat-modal-body">

          
          {isLoading ? (
            <div className="chat-loading">
              <p>Loading chat...</p>
            </div>
          ) : (
            <ClientChatWindow
              chatId={chatId}
              userId={userId}
              messages={messages}
              onSendMessage={handleSendMessage}
              socketRef={socketRef.current}
              chatType={chatType}
              isSupportTyping={supportTyping}
            />
          )}

          </div>
        </div>
      )}

      <ClientQuotationSignDialog
        open={showQuotationSignDialog}
        onClose={() => {
          setShowQuotationSignDialog(false);
          setCurrentQuotationId(null);
          setCurrentQuotationData(null);
        }}
        quotationId={currentQuotationId || ""}
        quotationDetails={currentQuotationData}
        onSubmitSuccess={(submittedQuotation) => {
          if (currentQuotationId) {
            setMessages((prev) =>
              prev.map((msg) => {
                if (
                  msg?.messageType === "quotation" &&
                  String(msg?.quotationData?._id) === String(currentQuotationId)
                ) {
                  return {
                    ...msg,
                    quotationData: {
                      ...msg.quotationData,
                      status: "signed",
                      clientSubmission: submittedQuotation?.clientSubmission ||
                        msg?.quotationData?.clientSubmission || {
                          submittedAt: new Date().toISOString(),
                        },
                    },
                  };
                }
                return msg;
              }),
            );
          }
          setShowQuotationSignDialog(false);
          setCurrentQuotationId(null);
          setCurrentQuotationData(null);
        }}
      />
    </>
  );
};

export default ClientChatButton;
