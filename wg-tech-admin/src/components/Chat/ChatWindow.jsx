
import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Paperclip,
  TrendingUp,
  FileText,
  Trash2,
} from "lucide-react";
import MessageList from "./MessageList";
import ProjectStatusIndicator from "./ProjectStatusIndicator";
import QuotationDialog from "./QuotationDialog";
import ClientQuotationSignDialog from "./ClientQuotationSignDialog";
import AdminQuotationProofsModal from "./AdminQuotationProofsModal";
import { uploadFile } from "../../utils/upload";
import "./ChatWindow.css";

const ChatWindow = ({
  chat,
  messages,
  userId,
  onSendMessage,
  onStatusUpdate,
  loading,
  socketRef,
  meta,
  userRole,
  onDeleteChat,
}) => {
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [showQuotationDialog, setShowQuotationDialog] = useState(false);
  const [showClientQuotationDialog, setShowClientQuotationDialog] =
    useState(false);
  const [showProofsModal, setShowProofsModal] = useState(false);
  const [currentQuotation, setCurrentQuotation] = useState(null);
  const [selectedProofsQuotationId, setSelectedProofsQuotationId] =
    useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef(null);

  const displayName =
    chat.groupName ||
    chat.clientId?.username ||
    chat.clientId?.email ||
    meta?.clientName ||
    meta?.clientUsername ||
    meta?.proposalEmail ||
    "Client";

  const avatarImage =
    chat.clientId?.profileImage || meta?.clientProfileImage || null;
  const avatarInitial = (displayName || "?").charAt(0).toUpperCase();

  const scrollToBottom = () => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const prevMessageCountRef = useRef(0);

  // Scroll to bottom whenever messages load or a new message arrives
  useEffect(() => {
    const curr = (messages || []).length;
    prevMessageCountRef.current = curr;
    if (curr === 0) return;
    scrollToBottom();
  }, [messages]);

  // Listen for quotation proofs event from MessageList (admin review flow)
  useEffect(() => {
    const handleOpenQuotationProofs = (event) => {
      const quotationId = event.detail;
      if (!quotationId) return;

      setSelectedProofsQuotationId(quotationId);
      setShowProofsModal(true);
    };

    window.addEventListener("openQuotationProofs", handleOpenQuotationProofs);
    return () =>
      window.removeEventListener(
        "openQuotationProofs",
        handleOpenQuotationProofs,
      );
  }, []);

  // Listen for quotation sign event from MessageList
  useEffect(() => {
    const handleQuotationSign = (event) => {
      const quotationId = event.detail;
      if (quotationId) {
        // Fetch the quotation details
        const quotation = messages?.find(
          (m) => m.quotationData?._id === quotationId,
        )?.quotationData;
        if (quotation) {
          setCurrentQuotation(quotation);
          setShowClientQuotationDialog(true);
        }
      }
    };

    window.addEventListener("openQuotationSign", handleQuotationSign);
    return () =>
      window.removeEventListener("openQuotationSign", handleQuotationSign);
  }, [messages]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketRef?.emit("typing", { chatId: chat._id, userId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef?.emit("stop_typing", { chatId: chat._id, userId });
    }, 3000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    onSendMessage({
      messageType: "text",
      content: messageText,
    });

    setMessageText("");
    setIsTyping(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      const uploadedUrl = await uploadFile(file);

      const isImage = file.type.startsWith("image/");
      const isDocument =
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (isImage) {
        onSendMessage({
          messageType: "image",
          content: file.name,
          imageUrl: uploadedUrl,
          fileName: file.name,
        });
      } else if (isDocument) {
        onSendMessage({
          messageType: "document",
          content: file.name,
          documentUrl: uploadedUrl,
          documentName: file.name,
        });
      } else {
        onSendMessage({
          messageType: "file",
          content: file.name,
          fileUrl: uploadedUrl,
          fileName: file.name,
        });
      }
    } catch (error) {
      console.error("Failed to upload and send file:", error);
      alert(error?.message || "Failed to upload file");
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const renderMediaSection = () => {
    if (
      !meta?.progressMedia?.length &&
      !meta?.documents?.length &&
      !meta?.comments?.length
    ) {
      return null;
    }

    return (
      <div className="chat-meta">
        {meta.progressMedia?.length > 0 && (
          <div className="meta-block">
            <div className="meta-title">Project Media</div>
            <div className="meta-media-grid">
              {meta.progressMedia.map((item) => (
                <div
                  key={`${item.url}-${item.uploadedAt}`}
                  className="meta-media-item"
                >
                  {item.type === "video" ? (
                    <video src={item.url} controls />
                  ) : (
                    <img src={item.url} alt={item.type || "media"} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {meta.documents?.length > 0 && (
          <div className="meta-block">
            <div className="meta-title">Documents</div>
            <ul className="meta-doc-list">
              {meta.documents.map((doc) => (
                <li key={`${doc.url}-${doc.uploadedAt}`}>
                  <a href={doc.url} target="_blank" rel="noreferrer">
                    {doc.name || doc.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {meta.comments?.length > 0 && (
          <div className="meta-block">
            <div className="meta-title">Project Comments</div>
            <ul className="meta-comment-list">
              {meta.comments.map((c) => (
                <li key={c._id || c.timestamp}>
                  <div className="meta-comment-author">
                    {c.authorName || "Admin"}
                  </div>
                  <div className="meta-comment-text">{c.text}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-window-header">
        <div className="chat-header-info">
          <div className="header-avatar">
            {avatarImage ? (
              <img src={avatarImage} alt="Chat" />
            ) : (
              <div className="avatar-placeholder">{avatarInitial}</div>
            )}
          </div>
          <div className="header-details">
            <h2>{displayName}</h2>
            <p className="chat-status">
              {chat.isGroupChat
                ? "Group Chat"
                : chat.chatType === "admin_work"
                  ? "Project Chat"
                  : "Website Support"}
            </p>
          </div>
        </div>

        <div className="chat-header-actions">
          {chat.projectId && (
            <button
              className="header-action-btn"
              onClick={() => setShowStatusUpdate(true)}
              title="Update Status"
            >
              <TrendingUp size={20} />
            </button>
          )}
          {userRole === "admin" && (
            <button
              className="header-action-btn"
              onClick={onDeleteChat}
              title="Delete chat"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Project Status */}
      {chat.projectId && (
        <ProjectStatusIndicator
          projectId={chat.projectId._id}
          projectName={chat.projectId.title}
          currentStatus={chat.projectId.status}
        />
      )}

      {/* Status Update Modal */}
      {showStatusUpdate && (
        <StatusUpdateModal
          chatId={chat._id}
          projectId={chat.projectId._id}
          onStatusUpdate={onStatusUpdate}
          onClose={() => setShowStatusUpdate(false)}
        />
      )}

      {/* Messages */}
      <div className="messages-container" ref={messagesRef}>
        {loading ? (
          <div className="loading-messages">
            <p>Loading messages...</p>
          </div>
        ) : messages && messages.length > 0 ? (
          <MessageList messages={messages} userId={userId} />
        ) : (
          <div className="empty-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {/* Project media/documents/comments */}
        {renderMediaSection()}
        <div ref={messagesEndRef} />
      </div>


      {/* Quotation Dialog for Admin - only in non-group chats */}
      {userRole === "admin" && !chat.isGroupChat && (
        <QuotationDialog
          open={showQuotationDialog}
          onClose={() => setShowQuotationDialog(false)}
          clientId={chat.clientId?._id}
          onQuotationSent={(quotationData) => {
            setShowQuotationDialog(false);
            // Send quotation message to chat
            onSendMessage({
              messageType: "quotation",
              content: `Quotation: ${quotationData?.title || "New Quotation"}`,
              quotationData: {
                _id: quotationData?._id?.toString?.() || quotationData?._id,
                clientName: displayName,
                title: quotationData?.title,
                subTitle: quotationData?.subTitle,
                shortDescription: quotationData?.shortDescription,
                longDescription: quotationData?.longDescription,
                image: quotationData?.image,
                postedOn: quotationData?.postedOn,
                items:
                  quotationData?.quotationDetails?.items ||
                  quotationData?.items,
                currency: quotationData?.currency,
                totalAmount:
                  quotationData?.quotationDetails?.totalAmount ||
                  quotationData?.totalAmount,
                advanceRequired:
                  quotationData?.quotationDetails?.advanceRequired ||
                  quotationData?.advanceRequired,
                createdBy:
                  quotationData?.mainAdminId || quotationData?.createdBy,
                createdAt: quotationData?.createdAt || new Date(),
              },
            });
          }}
        />
      )}

      {/* Quotation Sign Dialog for Client */}
      {currentQuotation && (
        <ClientQuotationSignDialog
          open={showClientQuotationDialog}
          onClose={() => {
            setShowClientQuotationDialog(false);
            setCurrentQuotation(null);
          }}
          quotationId={currentQuotation._id}
          quotationDetails={currentQuotation.quotationDetails}
          onSubmitSuccess={() => {
            setShowClientQuotationDialog(false);
            setCurrentQuotation(null);
            onSendMessage({
              messageType: "system",
              content: "✅ Quotation signed and submitted successfully!",
            });
          }}
        />
      )}

      {/* Admin Quotation Proofs Modal */}
      {userRole === "admin" && (
        <AdminQuotationProofsModal
          open={showProofsModal}
          onClose={() => {
            setShowProofsModal(false);
            setSelectedProofsQuotationId(null);
          }}
          quotationId={selectedProofsQuotationId}
        />
      )}

      {/* Message Input */}
      <form className="message-input-form" onSubmit={handleSendMessage}>
        <div className="input-actions">
          <label className="file-upload-btn" title="Attach file">
            <Paperclip size={20} />
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploadingFile}
              style={{ display: "none" }}
            />
          </label>

          {/* Send Quotation button - for admin, non-group chats only */}
          {userRole === "admin" && !chat.isGroupChat && (
            <button
              type="button"
              className="action-btn quotation-action-btn"
              onClick={() => setShowQuotationDialog(true)}
              title="Send Quotation"
            >
              <FileText size={20} />
              <span>Send Quotation</span>
            </button>
          )}
        </div>

        <input
          type="text"
          className="message-input"
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => {
            setMessageText(e.target.value);
            handleTyping();
          }}
        />

        <button
          type="submit"
          className="send-button"
          disabled={!messageText.trim() || uploadingFile}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

// Status Update Modal Component
const StatusUpdateModal = ({ chatId, projectId, onStatusUpdate, onClose }) => {
  const [newStatus, setNewStatus] = useState("Under Review");
  const [reason, setReason] = useState("");

  const statuses = ["Rejected", "Approved", "Completed", "Under Review"];

  const handleSubmit = (e) => {
    e.preventDefault();
    onStatusUpdate({
      projectId,
      oldStatus: "Under Review", // This should come from project
      newStatus,
      description: reason,
      chatId,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Update Project Status</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Status:</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Reason/Message:</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add a message for the client..."
              rows="4"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Update Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;