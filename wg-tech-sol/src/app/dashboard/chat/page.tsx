"use client";
import React, { useState, useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { Paperclip } from "lucide-react";
import { useAuthStore } from "@/zustand/authStore";
import { useRouter } from "next/navigation";
import ClientQuotationSignDialog from "../../../../Chat/ClientQuotationSignDialog";
import { upload } from "@/utils/helper";
import MagnifyText from "@/app/components/MagnifyText";
import {
  downloadQuotationPdf,
  openQuotationPdfPreview,
} from "../../../../Chat/quotationPdf";

interface Chat {
  _id: string;
  chatType: string;
  clientId: string | { _id: string; username: string; email: string };
  assignedAdmin?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  updatedAt: string;
  participants: string[];
  meta?: any;
  isGroupChat?: boolean;
  groupName?: string;
}

interface Message {
  _id: string;
  chatId?: string;
  senderId: string | { _id: string; username: string; email: string };
  messageType?: string;
  content: string;
  createdAt: string;
  readBy?: Array<{ userId: string; readAt: string }>;
  fileUrl?: string;
  fileName?: string;
  imageUrl?: string;
  documentUrl?: string;
  documentName?: string;
  quotationData?: {
    _id?: string;
    title?: string;
    subTitle?: string;
    shortDescription?: string;
    longDescription?: string;
    image?: string;
    postedOn?: string;
    items?: Array<{
      description?: string;
      quantity?: number;
      unitPrice?: number;
    }>;
    currency?: string;
    totalAmount?: number;
    advanceRequired?: number;
    createdBy?: string;
    createdAt?: string;
    status?: string;
    clientSubmission?: {
      signature?: string;
      nationalIdFront?: string;
      nationalIdBack?: string;
      paymentProof?: string;
      submittedAt?: string;
    };
  };
  statusUpdate?: {
    newStatus?: string;
    description?: string;
  };
}

export default function ChatPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [chatFilter, setChatFilter] = useState<
    "all" | "admin" | "group" | "unread"
  >("all");
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [unreadCountByChat, setUnreadCountByChat] = useState<
    Record<string, number>
  >({});
  const [quotationStatusById, setQuotationStatusById] = useState<
    Record<string, { status?: string; clientSubmission?: any }>
  >({});
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedChatRef = useRef<Chat | null>(null); // Track selected chat without stale closure

  // Quotation signing dialog states
  const [showQuotationSignDialog, setShowQuotationSignDialog] = useState(false);
  const [currentQuotationId, setCurrentQuotationId] = useState<string | null>(
    null,
  );
  const [currentQuotationData, setCurrentQuotationData] = useState<any>(null);
  const normalizeId = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "object") {
      if (value._id) return String(value._id).trim();
      if (value.$oid) return String(value.$oid).trim();
      // Handle MongoDB ObjectId toString()
      const str = value.toString();
      if (str !== "[object Object]") return str.trim();
    }
    return String(value).trim();
  };

  const getChatActivityTime = (chat: Chat): number => {
    const candidate =
      chat?.lastMessageTime ||
      (typeof chat?.lastMessage === "object"
        ? (chat.lastMessage as any)?.createdAt
        : null) ||
      chat?.updatedAt;
    if (!candidate) return 0;
    return new Date(candidate).getTime() || 0;
  };

  const sortChatsByLatest = (list: Chat[]): Chat[] => {
    if (!Array.isArray(list)) return [];
    return [...list].sort(
      (a, b) => getChatActivityTime(b) - getChatActivityTime(a),
    );
  };

  const handleOpenPdf = async (quotationData: any) => {
    try {
      await openQuotationPdfPreview(quotationData, {
        logoPath: "/images/Logo.png",
      });
    } catch (error) {
      console.error("Failed to preview quotation PDF:", error);
    }
  };

  const handleDownloadPdf = async (quotationData: any) => {
    try {
      await downloadQuotationPdf(quotationData, {
        logoPath: "/images/Logo.png",
      });
    } catch (error) {
      console.error("Failed to download quotation PDF:", error);
    }
  };

  // Keep ref in sync with state
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Listen for quotation sign event
  useEffect(() => {
    const handleQuotationSign = (event: CustomEvent) => {
      const quotationId = event.detail;
      if (quotationId) {
        // Find the quotation data from messages
        const quotationMessage = messages?.find(
          (m) => m.quotationData?._id === quotationId,
        );
        if (quotationMessage?.quotationData) {
          setCurrentQuotationId(quotationId);
          setCurrentQuotationData(quotationMessage.quotationData);
          setShowQuotationSignDialog(true);
        }
      }
    };

    window.addEventListener(
      "openClientQuotationSign" as any,
      handleQuotationSign,
    );
    return () =>
      window.removeEventListener(
        "openClientQuotationSign" as any,
        handleQuotationSign,
      );
  }, [messages]);

  const scrollToBottom = () => {
    // Small timeout to let DOM update before scrolling
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const markChatAsRead = async (chatId: string) => {
    if (!chatId || !user?._id) return;
    try {
      const authToken =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"}/api/v1/messages/read`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ chatId, userId: user._id }),
        },
      );
    } catch (error) {
      console.error("Failed to mark chat as read:", error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection - ONLY ONCE when user loads
  useEffect(() => {
    if (!user) return;

    console.log(
      "🔌 Initializing socket for dashboard chat with userId:",
      user._id,
    );

    socketRef.current = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003",
      {
        query: { userId: user._id },
        transports: ["polling", "websocket"],
        upgrade: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 20,
        withCredentials: true,
      },
    );

    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected for dashboard chat");
      setSocketConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setSocketConnected(false);
    });

    socketRef.current.on("message_received", (message: Message) => {
      console.log("📨 Dashboard received message_received:", message._id, "chatId:", message.chatId);

      // Validate message object
      if (!message || typeof message !== "object" || !message._id) {
        console.warn("⚠️ Invalid message object received:", message);
        return;
      }

      // Validate senderId exists
      if (!message.senderId) {
        console.warn("⚠️ Message has no senderId, rejecting:", message);
        return;
      }

      // Always update the chat list sidebar preview regardless of selected chat
      // This ensures the sidebar stays current even if the ref is momentarily stale
      setChats((prev) => {
        const existing = Array.isArray(prev) ? prev : [];
        const idx = existing.findIndex(
          (chat) => String(chat?._id) === String(message?.chatId),
        );
        if (idx === -1) return existing;
        const updated = [...existing];
        updated[idx] = {
          ...updated[idx],
          lastMessage: message.content || updated[idx].lastMessage,
          lastMessageTime: message.createdAt || new Date().toISOString(),
          updatedAt: message.createdAt || updated[idx].updatedAt,
        } as Chat;
        return sortChatsByLatest(updated);
      });

      // Use ref to avoid stale closure issue
      const currentChat = selectedChatRef.current;
      const senderId = normalizeId(message.senderId);
      const isOwnMessage = senderId === normalizeId(user?._id);

      if (!currentChat) {
        // No chat open — just track unread count
        if (!isOwnMessage && message.chatId) {
          setUnreadCountByChat((prev) => ({
            ...prev,
            [message.chatId as string]:
              (prev[message.chatId as string] || 0) + 1,
          }));
        }
        console.warn("⚠️ No chat selected, sidebar updated but message not displayed");
        return;
      }

      const incomingChatId = normalizeId(message.chatId);
      const activeChatId = normalizeId(currentChat._id);

      const chatIdsMatch =
        incomingChatId === activeChatId ||
        String(message.chatId).includes(activeChatId) ||
        activeChatId.includes(String(incomingChatId));

      if (chatIdsMatch) {
        console.log("✅ Message matches current chat, adding to messages");

        setMessages((prev) => {
          // Helper to extract sender ID (avoid stale closure)
          const extractSenderId = (sid: any): string | null => {
            if (!sid) return null;
            if (typeof sid === "string") return sid;
            if (typeof sid === "object" && sid._id) return sid._id;
            return null;
          };

          // Replace optimistic (temp) message if content + sender + timing match
          const optimisticIndex = prev.findIndex((m) => {
            if (!m._id.startsWith("temp_")) return false;
            if (m.content !== message.content) return false;
            if (extractSenderId(m.senderId) !== extractSenderId(message.senderId))
              return false;
            const optimisticTime = parseInt(m._id.replace("temp_", ""), 10);
            const messageTime = new Date(message.createdAt).getTime();
            const timeDiff = messageTime - optimisticTime;
            return timeDiff >= -5000 && timeDiff <= 5000;
          });

          if (optimisticIndex !== -1) {
            console.log(
              "✅ Replacing optimistic message at index",
              optimisticIndex,
              "with real message",
            );
            const updated = [...prev];
            updated[optimisticIndex] = message;
            return updated;
          }

          // Dedup: skip if real message already exists
          const exists = prev.some(
            (m) => m._id === message._id && !m._id.startsWith("temp_"),
          );
          if (exists) {
            console.log("⚠️ Message already exists, skipping");
            return prev;
          }

          console.log("✅ Adding new message to state");
          return [...prev, message];
        });
        scrollToBottom();

        if (!isOwnMessage) {
          markChatAsRead(currentChat._id);
          setUnreadCountByChat((prev) => ({ ...prev, [currentChat._id]: 0 }));
        }
      } else {
        // Message belongs to a different chat — update unread count only
        console.log(
          `⚠️ Message chatId (${message.chatId}) doesn't match current chat (${currentChat._id})`,
        );
        if (!isOwnMessage && message.chatId) {
          setUnreadCountByChat((prev) => ({
            ...prev,
            [message.chatId as string]:
              (prev[message.chatId as string] || 0) + 1,
          }));
        }
      }
    });

    // Re-join the active chat room after reconnect so room membership is restored
    socketRef.current.on("connect", () => {
      const activeChat = selectedChatRef.current;
      if (activeChat?._id && user?._id) {
        console.log("🔄 Socket reconnected — re-joining room:", activeChat._id);
        socketRef.current?.emit(
          "join_chat",
          { chatId: activeChat._id, userId: user._id },
          (ack: any) => console.log("✅ Reconnect join_chat ack:", ack),
        );
      }
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]); // ✅ REMOVED selectedChat from dependencies - socket stays connected

  // Separate effect to manage chat room joins/leaves
  // Fires whenever selectedChat changes OR the socket (re)connects
  useEffect(() => {
    if (!socketRef.current || !selectedChat) return;

    // If socket is not yet connected, wait — the reconnect handler above
    // and fetchMessages will call join_chat once it does connect.
    if (!socketConnected) return;

    console.log("🔗 Joining chat room (effect):", selectedChat._id);
    socketRef.current.emit(
      "join_chat",
      { chatId: selectedChat._id, userId: user?._id },
      (ack: any) => {
        console.log("✅ join_chat (effect) acknowledged:", ack);
      },
    );

    return () => {
      // Leave previous room when chat changes or component unmounts
      if (socketRef.current?.connected) {
        console.log("🚪 Leaving chat room:", selectedChat._id);
        socketRef.current.emit("leave_chat", {
          chatId: selectedChat._id,
          userId: user?._id,
        });
      }
    };
  }, [selectedChat, socketConnected, user?._id]);

  // Fetch admin_work chats
  useEffect(() => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token || !user) {
      router.push("/wgAuthForm");
      return;
    }
    fetchChats();
  }, [user]);

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      if (!user?._id) return;
      try {
        const authToken =
          localStorage.getItem("token") || localStorage.getItem("authToken");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"}/api/v1/chats/unread/${user._id}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) return;
        const data = await response.json();
        if (data.success && data.data?.unreadByChat) {
          setUnreadCountByChat(data.data.unreadByChat);
        }
      } catch (error) {
        console.error("Error fetching unread counts:", error);
      }
    };

    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 10000);
    return () => clearInterval(interval);
  }, [user?._id]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const authToken =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      console.log("🔍 Fetching chats for user:", user?._id);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"}/api/v1/chats/user/${user?._id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        console.error("Failed to fetch chats, status:", response.status);
        return;
      }

      const data = await response.json();
      console.log("✅ Chats fetched:", data.data);

      if (data.success && Array.isArray(data.data)) {
        // Validate chats before storing
        const validChats = data.data.filter(
          (chat: Chat) =>
            chat &&
            typeof chat === "object" &&
            chat._id &&
            typeof chat._id === "string",
        );
        if (validChats.length === 0 && user?._id) {
          const createResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"}/api/v1/chats`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                clientId: user._id,
                chatType: "admin_work",
              }),
            },
          );

          if (createResponse.ok) {
            const created = await createResponse.json();
            if (created.success && created.data?._id) {
              const freshChat = created.data as Chat;
              setChats(sortChatsByLatest([freshChat]));
              setSelectedChat(freshChat);
              fetchMessages(freshChat._id);
              markChatAsRead(freshChat._id);
              setUnreadCountByChat((prev) => ({
                ...prev,
                [freshChat._id]: 0,
              }));
              return;
            }
          }
        }

        const sortedChats = sortChatsByLatest(validChats);
        setChats(sortedChats);
        if (sortedChats.length > 0) {
          // Keep client/admin conversation pinned to direct admin_work chat.
          // This avoids opening a parallel/group thread by default.
          const preferredChat =
            sortedChats.find(
              (chat) => chat.chatType === "admin_work" && !chat.isGroupChat,
            ) || sortedChats.find((chat) => !chat.isGroupChat) || sortedChats[0];

          setSelectedChat(preferredChat);
          fetchMessages(preferredChat._id);
          markChatAsRead(preferredChat._id);
          setUnreadCountByChat((prev) => ({ ...prev, [preferredChat._id]: 0 }));
          // Room join is now handled by the separate useEffect
        }
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const authToken =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      console.log("📊 Fetching messages for chat:", chatId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"}/api/v1/messages/chat/${chatId}?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        console.error("Failed to fetch messages, status:", response.status);
        return;
      }

      const data = await response.json();
      console.log("✅ Messages fetched:", data.data?.length);

      if (data.success && Array.isArray(data.data)) {
        // Validate messages - only filter out truly invalid ones
        const validMessages = data.data.filter((msg: Message) => {
          if (!msg || typeof msg !== "object") {
            console.warn("⚠️ Invalid message object:", msg);
            return false;
          }
          if (!msg._id || typeof msg._id !== "string") {
            console.warn("⚠️ Message missing _id:", msg);
            return false;
          }
          // Accept messages even if senderId is null (shouldn't happen, but be safe)
          // senderId will be shown as "Unknown"
          return true;
        });

        console.log(
          `✅ Fetched ${data.data.length} messages, accepted ${validMessages.length}`,
        );
        setMessages(validMessages);
        scrollToBottom();
      }

      // Always join the chat room after loading messages so we receive real-time
      // events even if the separate useEffect fires before socketConnected is set.
      if (socketRef.current?.connected && chatId) {
        console.log("🔗 fetchMessages: joining chat room:", chatId);
        socketRef.current.emit(
          "join_chat",
          { chatId, userId: user?._id },
          (ack: any) => {
            console.log("✅ fetchMessages join_chat ack:", ack);
          },
        );
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    const quotationIds = Array.from(
      new Set(
        messages
          .filter((m) => m.messageType === "quotation" && m.quotationData?._id)
          .map((m) => String(m.quotationData?._id)),
      ),
    );

    if (quotationIds.length === 0) return;

    let cancelled = false;

    const fetchLatestQuotationState = async () => {
      try {
        const authToken =
          localStorage.getItem("token") || localStorage.getItem("authToken");
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003";

        const results = await Promise.allSettled(
          quotationIds.map(async (quotationId) => {
            const response = await fetch(
              `${baseUrl}/api/v1/quotations/${quotationId}`,
              {
                headers: authToken
                  ? {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                  }
                  : undefined,
              },
            );

            if (!response.ok) return [quotationId, null] as const;
            const data = await response.json();
            return [quotationId, data?.data || null] as const;
          }),
        );

        if (cancelled) return;

        const nextStatusMap: Record<
          string,
          { status?: string; clientSubmission?: any }
        > = {};

        results.forEach((result) => {
          if (result.status !== "fulfilled") return;
          const [quotationId, quotation] = result.value;
          if (!quotationId || !quotation) return;
          nextStatusMap[String(quotationId)] = {
            status: quotation.status,
            clientSubmission: quotation.clientSubmission || null,
          };
        });

        setQuotationStatusById(nextStatusMap);
      } catch (error) {
        console.error("Failed to fetch latest quotation states:", error);
      }
    };

    fetchLatestQuotationState();

    return () => {
      cancelled = true;
    };
  }, [messages]);

  const handleSelectChat = async (chat: Chat) => {
    setSelectedChat(chat);
    setMessages([]);
    await fetchMessages(chat._id);
    await markChatAsRead(chat._id);
    setUnreadCountByChat((prev) => ({ ...prev, [chat._id]: 0 }));
    // Room join is now handled by the separate useEffect
  };

  const sendSocketMessage = (messageData: Partial<Message>) => {
    if (!selectedChat || !socketRef.current?.connected) {
      console.error("Cannot send message:", {
        noChat: !selectedChat,
        socketConnected: socketRef.current?.connected,
      });
      return;
    }

    const payload = {
      chatId: selectedChat._id,
      senderId: user?._id,
      ...messageData,
    };

    const optimisticMessage: Message = {
      _id: `temp_${Date.now()}`,
      chatId: selectedChat._id,
      senderId: user?._id || "",
      messageType: (messageData.messageType as string) || "text",
      content: String(messageData.content || ""),
      createdAt: new Date().toISOString(),
      readBy: [{ userId: user?._id || "", readAt: new Date().toISOString() }],
      fileUrl: messageData.fileUrl,
      fileName: messageData.fileName,
      imageUrl: messageData.imageUrl,
      documentUrl: messageData.documentUrl,
      documentName: messageData.documentName,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();

    socketRef.current.emit("send_message", payload, (response: any) => {
      console.log("📨 Message sent response:", response);
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      return;
    }

    try {
      const messageContent = newMessage;
      setNewMessage("");
      sendSocketMessage({
        messageType: "text",
        content: messageContent,
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      setUploadingFile(true);
      const uploadedUrl = await upload(file, {
        endpoint: "v1/upload/file",
        fieldName: "file",
      });

      const isImage = file.type.startsWith("image/");
      const isDocument =
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (isImage) {
        sendSocketMessage({
          messageType: "image",
          content: file.name,
          imageUrl: uploadedUrl,
          fileName: file.name,
        });
      } else if (isDocument) {
        sendSocketMessage({
          messageType: "document",
          content: file.name,
          documentUrl: uploadedUrl,
          documentName: file.name,
        });
      } else {
        sendSocketMessage({
          messageType: "file",
          content: file.name,
          fileUrl: uploadedUrl,
          fileName: file.name,
        });
      }
    } catch (error: any) {
      console.error("Failed to upload file:", error);
      alert(error?.message || "Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDownloadAttachment = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "attachment";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Attachment download failed:", error);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleOpenImage = (url: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const getSenderId = (senderId: any): string | null => {
    if (!senderId) {
      console.warn("⚠️ getSenderId: senderId is null/undefined");
      return null;
    }
    if (typeof senderId === "string") {
      console.log("✅ getSenderId: returning string ID:", senderId);
      return String(senderId).trim();
    }
    if (typeof senderId === "object" && senderId._id) {
      console.log("✅ getSenderId: extracting _id from object:", senderId._id);
      return String(senderId._id).trim();
    }
    console.warn("⚠️ getSenderId: unable to extract ID from:", senderId);
    return null;
  };

  const isCurrentUserMessage = (message: Message): boolean => {
    const messageUserId = getSenderId(message.senderId);
    const currentUserId = user?._id;

    console.log("🔍 isCurrentUserMessage check:", {
      messageUserId,
      currentUserId,
      senderId: message.senderId,
      senderIdType: typeof message.senderId,
    });

    if (!messageUserId || !currentUserId) {
      console.warn("⚠️ Missing userId for comparison", {
        messageUserId,
        currentUserId,
        senderId: message.senderId,
      });
      return false;
    }

    // Normalize both to strings for comparison
    const normalizedMessageId = String(messageUserId).trim().toLowerCase();
    const normalizedCurrentId = String(currentUserId).trim().toLowerCase();

    const match = normalizedMessageId === normalizedCurrentId;
    console.log(
      `✅ Comparing: "${normalizedMessageId}" === "${normalizedCurrentId}"? ${match}`,
    );
    return match;
  };

  const getSenderName = (message: Message) => {
    // Check if message has valid senderId
    if (!message.senderId) {
      console.warn("⚠️ getSenderName: message has no senderId:", message._id);
      return "Unknown";
    }

    // Handle string senderId
    if (typeof message.senderId === "string") {
      console.log("✅ getSenderName: senderId is string:", message.senderId);
      return message.senderId === user?._id ? user?.fullname || "You" : "Admin";
    }

    // Handle object senderId
    if (typeof message.senderId === "object") {
      console.log("✅ getSenderName: senderId is object:", message.senderId);

      // If this is the current user's message
      const messageUserId = message.senderId._id;
      if (messageUserId === user?._id) {
        return user?.fullname || "You";
      }

      // Return username or fallback
      return message.senderId.username || message.senderId.email || "Admin";
    }

    console.warn(
      "⚠️ getSenderName: unable to determine sender name for:",
      message.senderId,
    );
    return "Unknown";
  };

  const getChatTitle = (chat: Chat) => {
    // Handle group chats
    if (chat.isGroupChat || chat.groupName) {
      return chat.groupName || "Group Chat";
    }
    // Handle string clientId
    if (typeof chat.clientId === "string") return "Project Chat";
    // Handle null clientId
    if (!chat.clientId) return "Chat";
    // Handle object clientId
    return chat.clientId.username || chat.clientId.email || "Chat";
  };

  const getLastMessagePreview = (chat: Chat) => {
    if (!chat.lastMessage) return "No messages";

    // If lastMessage is a string
    if (typeof chat.lastMessage === "string") {
      return chat.lastMessage;
    }

    // If lastMessage is an object, extract content
    if (typeof chat.lastMessage === "object" && chat.lastMessage !== null) {
      const msg = chat.lastMessage as any;
      if (msg.messageType === "image") {
        return `Image: ${msg.fileName || msg.content || "Shared image"}`;
      }
      if (msg.messageType === "document") {
        return `Document: ${msg.documentName || msg.fileName || msg.content || "Shared document"}`;
      }
      if (msg.messageType === "file") {
        return `File: ${msg.fileName || msg.documentName || msg.content || "Shared file"}`;
      }
      return msg.content || "No content";
    }

    return "No messages";
  };

  const signedQuotationIds = new Set(
    messages
      .filter(
        (m) =>
          m.messageType === "quotation" &&
          m.quotationData?._id &&
          (m.quotationData?.status === "signed" ||
            m.quotationData?.clientSubmission),
      )
      .map((m) => String(m.quotationData?._id)),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[#9EFF00] text-xl">Loading chats...</div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen flex-col">
        <h1 className="text-4xl font-bold text-[#9EFF00] mb-4">
          <MagnifyText text="Chat with Admin" />
        </h1>
        <p className="text-gray-400 text-lg">No active chats yet</p>
        <p className="text-gray-500 text-sm mt-2">
          Your admin chats will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header */}
      <div className="mb-6 p-6">
        <h1 className="text-4xl font-bold text-[#9EFF00] mb-2">
          <MagnifyText text="Chat with Admin" />
        </h1>
        <div className="flex items-center gap-2">
          <p className="text-gray-400">
            Real-time communication with support team
          </p>
          <span
            className={`w-2 h-2 rounded-full ${socketConnected ? "bg-green-500" : "bg-red-500"}`}
          ></span>
          <span className="text-xs text-gray-500">
            {socketConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex gap-4 bg-[#111] rounded-lg border border-[#333] overflow-hidden mx-6 mb-6">
        {/* Chat List - Desktop */}
        <div className="hidden md:flex md:w-1/3 flex-col border-r border-[#333] bg-[#0a0a0a]">
          <div className="p-4 border-b border-[#333]">
            {/* Removed Conversations heading as requested */}
            {/* Filter Buttons */}
            <div className="flex gap-2 mb-2">
              <button
                className={`px-3 py-1 rounded transition-all text-xs font-semibold ${chatFilter === "all" ? "bg-[#9EFF00] text-black" : "bg-[#222] text-white hover:bg-[#9EFF00] hover:text-black"}`}
                onClick={() => setChatFilter("all")}
              >
                All
              </button>
              <button
                className={`px-3 py-1 rounded transition-all text-xs font-semibold ${chatFilter === "admin" ? "bg-[#9EFF00] text-black" : "bg-[#222] text-white hover:bg-[#9EFF00] hover:text-black"}`}
                onClick={() => setChatFilter("admin")}
              >
                Admin
              </button>
              <button
                className={`px-3 py-1 rounded transition-all text-xs font-semibold ${chatFilter === "group" ? "bg-[#9EFF00] text-black" : "bg-[#222] text-white hover:bg-[#9EFF00] hover:text-black"}`}
                onClick={() => setChatFilter("group")}
              >
                Group
              </button>
              <button
                className={`px-3 py-1 rounded transition-all text-xs font-semibold ${chatFilter === "unread" ? "bg-[#9EFF00] text-black" : "bg-[#222] text-white hover:bg-[#9EFF00] hover:text-black"}`}
                onClick={() => setChatFilter("unread")}
              >
                Unread
              </button>
            </div>
            {/* Search Bar */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chats..."
              className="w-full px-3 py-2 rounded bg-[#181818] border border-[#333] text-white focus:border-[#9EFF00] outline-none text-sm mb-2"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 p-2">
            {chats
              .filter((chat) => {
                // Filter by button
                if (chatFilter === "admin") {
                  // Only admin chats (chatType === 'admin' or assignedAdmin exists, not group)
                  return (
                    chat.chatType === "admin" ||
                    (chat.assignedAdmin && !chat.isGroupChat && !chat.groupName)
                  );
                }
                if (chatFilter === "group") {
                  // Group chats: isGroupChat true or groupName exists, or chatType === 'group'
                  return (
                    chat.isGroupChat ||
                    !!chat.groupName ||
                    chat.chatType === "group" ||
                    (Array.isArray(chat.participants) &&
                      chat.participants.length > 2)
                  );
                }
                if (chatFilter === "unread") {
                  // Chats with unread messages
                  return (unreadCountByChat[chat._id] || 0) > 0;
                }
                // Default: all
                return true;
              })
              .filter((chat) => {
                // Search filter
                const title = getChatTitle(chat).toLowerCase();
                const lastMsg = getLastMessagePreview(chat).toLowerCase();
                return (
                  title.includes(searchTerm.toLowerCase()) ||
                  lastMsg.includes(searchTerm.toLowerCase())
                );
              })
              .map((chat) => (
                <button
                  key={chat._id}
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${selectedChat?._id === chat._id
                    ? "bg-[#9EFF00] text-black"
                    : "bg-[#1a1a1a] text-white hover:bg-[#222]"
                    }`}
                >
                  <p className="font-semibold text-sm truncate">
                    {getChatTitle(chat)}
                  </p>
                  <p className="text-xs opacity-70 truncate">
                    {getLastMessagePreview(chat)}
                  </p>
                  {(unreadCountByChat[chat._id] || 0) > 0 && (
                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 text-[10px] font-bold rounded-full bg-red-500 text-white mt-1">
                      {unreadCountByChat[chat._id] > 99
                        ? "99+"
                        : unreadCountByChat[chat._id]}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[#333] bg-[#0a0a0a]">
                <h3 className="font-semibold text-white text-lg">
                  {getChatTitle(selectedChat)}
                </h3>
                <p className="text-gray-400 text-sm">with Admin Support</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const quotationId = message.quotationData?._id
                      ? String(message.quotationData._id)
                      : null;
                    const latestQuotation = quotationId
                      ? quotationStatusById[quotationId]
                      : null;
                    const mergedSubmission =
                      message.quotationData?.clientSubmission ||
                      latestQuotation?.clientSubmission;
                    const isQuotationSigned = Boolean(
                      quotationId &&
                      (message.quotationData?.status === "signed" ||
                        message.quotationData?.clientSubmission ||
                        signedQuotationIds.has(quotationId) ||
                        latestQuotation?.status === "signed" ||
                        latestQuotation?.clientSubmission),
                    );

                    // Handle quotation messages
                    if (
                      message.messageType === "quotation" &&
                      message.quotationData
                    ) {
                      return (
                        <div
                          key={message._id}
                          className={`flex ${isCurrentUserMessage(message)
                            ? "justify-end"
                            : "justify-start"
                            }`}
                        >
                          <div className="max-w-sm lg:max-w-md bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#444] rounded-lg overflow-hidden shadow-lg">
                            {/* Quotation Header */}
                            <div className="bg-gradient-to-r from-[#9EFF00] to-[#7ccc00] px-4 py-2">
                              <p className="text-black font-bold text-sm">
                                📄 {message.quotationData.title || "Quotation"}
                              </p>
                            </div>

                            {/* Quotation Image */}
                            {message.quotationData.image && (
                              <img
                                src={message.quotationData.image}
                                alt="Quotation"
                                className="w-full h-32 object-cover"
                              />
                            )}

                            {/* Quotation Content */}
                            <div className="p-4 space-y-2">
                              {message.quotationData.subTitle && (
                                <p className="text-xs text-[#aaa]">
                                  {message.quotationData.subTitle}
                                </p>
                              )}
                              {message.quotationData.shortDescription && (
                                <p className="text-sm text-white leading-relaxed">
                                  {message.quotationData.shortDescription}
                                </p>
                              )}

                              {/* Price Information */}
                              {message.quotationData.totalAmount && (
                                <div className="bg-[#222] rounded p-3 mt-3 space-y-1">
                                  <p className="text-xs text-gray-400">
                                    Total Amount
                                  </p>
                                  <p className="text-lg font-bold text-[#9EFF00]">
                                    {message.quotationData.currency}{" "}
                                    {message.quotationData.totalAmount.toFixed(
                                      2,
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Advance Required (50%):{" "}
                                    {message.quotationData.currency}{" "}
                                    {(
                                      message.quotationData.totalAmount * 0.5
                                    ).toFixed(2)}
                                  </p>
                                </div>
                              )}

                              {isQuotationSigned ? (
                                <div className="mt-3 space-y-2">
                                  <div className="px-3 py-2 rounded-lg border border-green-500 bg-green-900/20 text-green-300 text-sm font-semibold">
                                    Proof details submitted successfully.
                                  </div>
                                  <div className="text-xs text-gray-400 leading-6 px-1">
                                    Signature:{" "}
                                    {mergedSubmission?.signature
                                      ? "Uploaded"
                                      : "Submitted"}
                                    <br />
                                    National ID Front:{" "}
                                    {mergedSubmission?.nationalIdFront
                                      ? "Uploaded"
                                      : "Submitted"}
                                    <br />
                                    National ID Back:{" "}
                                    {mergedSubmission?.nationalIdBack
                                      ? "Uploaded"
                                      : "Submitted"}
                                    <br />
                                    Advance Payment Proof:{" "}
                                    {mergedSubmission?.paymentProof
                                      ? "Uploaded"
                                      : "Submitted"}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2 mt-1">
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      onClick={() =>
                                        handleOpenPdf(message.quotationData)
                                      }
                                      className="w-full px-3 py-2 bg-[#111827] hover:bg-[#030712] text-white font-semibold rounded-lg text-sm transition-all"
                                    >
                                      View PDF
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDownloadPdf(message.quotationData)
                                      }
                                      className="w-full px-3 py-2 bg-[#059669] hover:bg-[#047857] text-white font-semibold rounded-lg text-sm transition-all"
                                    >
                                      Download PDF
                                    </button>
                                  </div>

                                  {/* Sign Button */}
                                  <button
                                    onClick={() => {
                                      setCurrentQuotationId(
                                        message.quotationData?._id || "",
                                      );
                                      setCurrentQuotationData(
                                        message.quotationData || null,
                                      );
                                      setShowQuotationSignDialog(true);
                                    }}
                                    className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition-all"
                                  >
                                    ✓ Sign Now
                                  </button>
                                </div>
                              )}

                              {/* Timestamp and Sender */}
                              <p className="text-xs text-gray-500 pt-2 border-t border-[#333]">
                                From: {getSenderName(message)} •{" "}
                                {new Date(
                                  message.createdAt,
                                ).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Handle status update messages
                    if (message.messageType === "status_update") {
                      return (
                        <div key={message._id} className="flex justify-center">
                          <div className="bg-green-900 bg-opacity-30 border border-green-600 text-green-300 px-4 py-2 rounded-lg text-sm">
                            <p>
                              📊 Status updated to:{" "}
                              <strong>
                                {message.statusUpdate?.newStatus || "Unknown"}
                              </strong>
                            </p>
                            {message.statusUpdate?.description && (
                              <p className="text-xs mt-1">
                                {message.statusUpdate.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Handle text messages (default)
                    if (message.messageType === "image" && message.imageUrl) {
                      return (
                        <div
                          key={message._id}
                          className={`flex ${isCurrentUserMessage(message)
                            ? "justify-end"
                            : "justify-start"
                            }`}
                        >
                          <div className="max-w-xs lg:max-w-md bg-[#222] rounded-lg p-2">
                            <img
                              src={message.imageUrl}
                              alt={message.fileName || "Shared image"}
                              className="rounded-md max-h-56 w-full object-cover"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenImage(message.imageUrl as string)
                                }
                                className="px-3 py-1 text-xs font-semibold rounded bg-slate-800 text-white hover:bg-slate-700"
                              >
                                Open Full
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDownloadAttachment(
                                    message.imageUrl as string,
                                    message.fileName ||
                                    message.content ||
                                    "image",
                                  )
                                }
                                className="px-3 py-1 text-xs font-semibold rounded bg-emerald-700 text-white hover:bg-emerald-600"
                              >
                                Download
                              </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    if (
                      message.messageType === "document" &&
                      message.documentUrl
                    ) {
                      return (
                        <div
                          key={message._id}
                          className={`flex ${isCurrentUserMessage(message)
                            ? "justify-end"
                            : "justify-start"
                            }`}
                        >
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDownloadAttachment(
                                message.documentUrl as string,
                                message.documentName ||
                                message.fileName ||
                                message.content ||
                                "document.pdf",
                              );
                            }}
                            className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-[#222] text-white border border-[#333]"
                          >
                            📄{" "}
                            {message.documentName ||
                              message.content ||
                              "Document"}
                          </a>
                        </div>
                      );
                    }

                    if (message.messageType === "file" && message.fileUrl) {
                      return (
                        <div
                          key={message._id}
                          className={`flex ${isCurrentUserMessage(message)
                            ? "justify-end"
                            : "justify-start"
                            }`}
                        >
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDownloadAttachment(
                                message.fileUrl as string,
                                message.fileName ||
                                message.documentName ||
                                message.content ||
                                "file",
                              );
                            }}
                            className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-[#222] text-white border border-[#333]"
                          >
                            📎 {message.fileName || message.content || "File"}
                          </a>
                        </div>
                      );
                    }

                    // Handle text messages (default)
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isCurrentUserMessage(message)
                          ? "justify-end"
                          : "justify-start"
                          }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isCurrentUserMessage(message)
                            ? "bg-[#9EFF00] text-black"
                            : "bg-[#222] text-white"
                            }`}
                        >
                          <p className="text-xs opacity-70 mb-1">
                            {getSenderName(message)}
                          </p>
                          <p className="text-sm break-words">
                            {message.content}
                          </p>
                          <p className="text-xs opacity-50 mt-1">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-[#333] bg-[#0a0a0a]"
              >
                <div className="flex gap-2">
                  <label className="w-10 h-10 rounded-lg border border-[#333] bg-[#1a1a1a] text-gray-300 hover:text-[#9EFF00] flex items-center justify-center cursor-pointer">
                    <Paperclip size={18} />
                    <input
                      type="file"
                      className="hidden"
                      disabled={!socketConnected || uploadingFile}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file);
                        }
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={!socketConnected}
                    className="flex-1 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg border border-[#333] focus:border-[#9EFF00] outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={
                      !socketConnected || !newMessage.trim() || uploadingFile
                    }
                    className="px-6 py-2 bg-[#9EFF00] text-black font-semibold rounded-lg hover:bg-[#8FDD00] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {/* Quotation Sign Dialog */}
      <ClientQuotationSignDialog
        open={showQuotationSignDialog}
        onClose={() => {
          setShowQuotationSignDialog(false);
          setCurrentQuotationId(null);
          setCurrentQuotationData(null);
        }}
        quotationId={currentQuotationId || ""}
        quotationDetails={currentQuotationData}
        onSubmitSuccess={(submittedQuotation: any) => {
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
    </div>
  );
}
