import React, { useState } from "react";
import { MessageSquare, Settings } from "lucide-react";
import "./ChatSidebar.css";

const ChatSidebar = ({
  chats,
  selectedChat,
  onSelectChat,
  unreadCount,
  onlineUsers,
  onShowAutoReply,
  userRole,
  title = "Chats",
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const getLastMessagePreview = (chat) => {
    const msg = chat.lastMessage;
    if (!msg) return "No messages yet";

    if (typeof msg === "string") return msg;

    const type = msg?.messageType;
    if (type === "image") return `Image: ${msg.fileName || msg.content || "Shared image"}`;
    if (type === "document") {
      return `Document: ${msg.documentName || msg.fileName || msg.content || "Shared document"}`;
    }
    if (type === "file") return `File: ${msg.fileName || msg.documentName || msg.content || "Shared file"}`;

    return typeof msg?.content === "string" ? msg.content : "No messages yet";
  };

  const getChatDisplayName = (chat) => {
    if (chat.isGroupChat) {
      // Priority 1: groupName (if it's not a placeholder "User, User")
      if (chat.groupName && !chat.groupName.toLowerCase().startsWith("user")) {
        return chat.groupName;
      }

      const meta = chat.meta || {};
      const clientName = meta.clientName || meta.clientUsername;
      const proposalTitle = meta.proposalTitle;

      // Extract worker name from participants
      let workerName = null;
      if (Array.isArray(chat.participants)) {
        const worker = chat.participants.find((p) => {
          const role = (p.role || p.userRole || "").toLowerCase();
          return role === "worker";
        });
        if (worker) {
          const rawName = worker.fullname || worker.username || worker.name || worker.email;
          if (rawName && rawName.toLowerCase() !== "user") {
            workerName = rawName;
          }
        }
      }

      // Priority 2: Build a contextual name based on what we have
      if (clientName && workerName) {
        return proposalTitle 
          ? `${clientName} · ${workerName}`
          : `${clientName} ↔ ${workerName}`;
      }
      
      if (clientName && proposalTitle) {
        return `${proposalTitle} — ${clientName}`;
      }
      
      if (clientName) {
        return `${clientName} (Group)`;
      }

      if (proposalTitle) {
        return `Project: ${proposalTitle}`;
      }

      // Fallback to participants if nothing else works (but filter out "user")
      if (Array.isArray(chat.participants) && chat.participants.length > 0) {
        const members = chat.participants.filter((p) => {
          const role = (p.role || p.userRole || "").toLowerCase();
          return role !== "admin";
        });
        
        const validMembers = members
          .map((p) => p.fullname || p.username || p.name || p.email || "")
          .filter(name => name && name.toLowerCase() !== "user");
          
        if (validMembers.length > 0) {
          return validMembers.join(", ");
        }
      }

      return chat.groupName || "Group Chat";
    }
    
    // Non-group chat logic
    return (
      chat.meta?.clientName ||
      chat.clientId?.username ||
      chat.clientId?.email ||
      "Unknown"
    );
  };

  const filteredChats = (chats || []).filter((chat) => {
    const name = getChatDisplayName(chat).toLowerCase();
    if (searchQuery && !name.includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="chat-sidebar">

      <div className="chat-search">
        <input
          type="text"
          placeholder="Search chats..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="chat-list">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <div
              key={chat._id || chat.meta?.clientId || chat.meta?.clientUserId}
              className={`chat-item ${selectedChat?._id === chat._id ? "active" : ""}`}
              onClick={() => onSelectChat(chat)}
            >
              <div className="chat-info">
                <div className="chat-header-row">
                  <h3 className="chat-name" title={getChatDisplayName(chat)}>
                    {getChatDisplayName(chat)}
                  </h3>
                  <span className="chat-type">
                    {chat.isGroupChat ? "Group" : String(chat.chatType || "Chat")}
                  </span>
                </div>
                <p className="chat-preview">
                  {getLastMessagePreview(chat)}
                </p>
              </div>

              {unreadCount[chat._id] > 0 && (
                <span className="unread-badge">{unreadCount[chat._id]}</span>
              )}
            </div>
          ))
        ) : (
          <div className="empty-chats">
            <MessageSquare size={40} />
            <p>No chats yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
