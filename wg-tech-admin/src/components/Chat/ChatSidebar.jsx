import React from "react";
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

  const renderAvatarInitial = (chat) => {
    const initial = (chat.meta?.clientName || chat.clientId?.username || chat.clientId?.email || "?")
      .charAt(0)
      .toUpperCase();
    return initial;
  };

  return (
    <div className="chat-sidebar">
      <div className="chat-sidebar-header">
        <h2>{title}</h2>
        {userRole === "admin" && (
          <button
            className="auto-reply-btn"
            onClick={onShowAutoReply}
            title="Auto Reply Settings"
          >
            <Settings size={20} />
          </button>
        )}
      </div>

      <div className="chat-search">
        <input
          type="text"
          placeholder="Search chats..."
          className="search-input"
        />
      </div>

      <div className="chat-list">
        {chats && chats.length > 0 ? (
          chats.map((chat) => (
            <div
              key={chat._id || chat.meta?.clientId || chat.meta?.clientUserId}
              className={`chat-item ${selectedChat?._id === chat._id ? "active" : ""}`}
              onClick={() => onSelectChat(chat)}
            >
              <div className="chat-avatar">
                {chat.clientId?.profileImage ? (
                  <img src={chat.clientId.profileImage} alt="Chat" />
                ) : (
                  <div className="avatar-placeholder">{renderAvatarInitial(chat)}</div>
                )}
                {onlineUsers[chat.clientId?._id] === "online" && (
                  <span className="online-indicator"></span>
                )}
              </div>

              <div className="chat-info">
                <div className="chat-header-row">
                  <h3 className="chat-name">{String(chat.meta?.clientName || chat.clientId?.username || chat.clientId?.email || "Unknown")}</h3>
                  <span className="chat-type">{String(chat.chatType || "Chat")}</span>
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
