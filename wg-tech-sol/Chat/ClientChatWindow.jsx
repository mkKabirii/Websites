import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, CheckCheck, Check } from "lucide-react";
import "./ClientChatWindow.css";
import { downloadQuotationPdf, openQuotationPdfPreview } from "./quotationPdf";
import { upload } from "../src/utils/helper";

const ClientChatWindow = ({
  chatId,
  userId,
  messages,
  onSendMessage,
  socketRef,
  isSupportTyping = false,
}) => {
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [quotationStatusById, setQuotationStatusById] = useState({});
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const handleOpenPdf = async (quotationData) => {
    try {
      await openQuotationPdfPreview(quotationData, {
        logoPath: "/images/Logo.png",
      });
    } catch (error) {
      console.error("Failed to preview quotation PDF:", error);
    }
  };

  const handleDownloadPdf = async (quotationData) => {
    try {
      await downloadQuotationPdf(quotationData, {
        logoPath: "/images/Logo.png",
      });
    } catch (error) {
      console.error("Failed to download quotation PDF:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const quotationIds = Array.from(
      new Set(
        (messages || [])
          .filter(
            (m) => m?.messageType === "quotation" && m?.quotationData?._id,
          )
          .map((m) => String(m.quotationData._id)),
      ),
    );

    if (quotationIds.length === 0) return;

    let cancelled = false;

    const fetchLatestQuotationState = async () => {
      try {
        const token =
          localStorage.getItem("token") || localStorage.getItem("authToken");
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003";

        const results = await Promise.allSettled(
          quotationIds.map(async (quotationId) => {
            const response = await fetch(
              `${baseUrl}/api/v1/quotations/${quotationId}`,
              {
                headers: token
                  ? {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    }
                  : undefined,
              },
            );

            if (!response.ok) {
              return [quotationId, null];
            }

            const data = await response.json();
            return [quotationId, data?.data || null];
          }),
        );

        if (cancelled) return;

        const nextStatusMap = {};
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

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketRef?.emit("typing", { chatId, userId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef?.emit("stop_typing", { chatId, userId });
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

  const handleDownloadAttachment = async (url, fileName) => {
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

  const handleOpenImage = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
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
      console.error("Failed to upload/send file:", error);
      alert(error?.message || "Failed to upload file");
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const signedQuotationIds = new Set(
    (messages || [])
      .filter(
        (m) =>
          m?.messageType === "quotation" &&
          m?.quotationData?._id &&
          (m?.quotationData?.status === "signed" ||
            m?.quotationData?.clientSubmission),
      )
      .map((m) => String(m.quotationData._id)),
  );

  return (
    <div className="client-chat-window">
      {/* Messages */}
      <div className="client-messages-container">
        {messages && Array.isArray(messages) && messages.length > 0 ? (
          <div className="client-messages-list">
            {messages.map((message) => {
              // Validate message object
              if (!message || typeof message !== "object" || !message._id) {
                console.warn("Invalid message object:", message);
                return null;
              }

              const quotationId = message?.quotationData?._id
                ? String(message.quotationData._id)
                : null;
              const latestQuotation = quotationId
                ? quotationStatusById[quotationId]
                : null;
              const mergedSubmission =
                message?.quotationData?.clientSubmission ||
                latestQuotation?.clientSubmission;

              const isQuotationSigned = Boolean(
                quotationId &&
                (message?.quotationData?.status === "signed" ||
                  message?.quotationData?.clientSubmission ||
                  signedQuotationIds.has(quotationId) ||
                  latestQuotation?.status === "signed" ||
                  latestQuotation?.clientSubmission),
              );

              return (
                <div
                  key={message._id}
                  className={`client-message ${
                    (message.senderId?._id || message.senderId) === userId
                      ? "own"
                      : "other"
                  }`}
                >
                  {message.messageType === "status_update" && (
                    <div className="status-notification">
                      <p>
                        Project status updated to:{" "}
                        <strong>
                          {String(message.statusUpdate?.newStatus || "Unknown")}
                        </strong>
                      </p>
                      {message.statusUpdate?.description && (
                        <p>{String(message.statusUpdate.description)}</p>
                      )}
                    </div>
                  )}

                  {message.messageType === "text" && (
                    <div className="message-bubble">
                      <p>{String(message.content || "")}</p>
                      <span className="message-time">
                        {formatTime(message.createdAt)}
                        {(message.senderId?._id || message.senderId) ===
                          userId && (
                          <span className="read-status">
                            {message.readBy?.length > 1 ? (
                              <CheckCheck size={12} />
                            ) : (
                              <Check size={12} />
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {message.messageType === "quotation" && (
                    <div className="message-quotation">
                      <div className="quotation-card">
                        {message.quotationData?.image && (
                          <img
                            src={message.quotationData.image}
                            alt="Quotation"
                            className="quotation-image"
                          />
                        )}

                        <div className="quotation-title">
                          📄 {message.quotationData?.title || "Quotation"}
                        </div>

                        {message.quotationData?.subTitle && (
                          <div className="quotation-subtitle">
                            {message.quotationData.subTitle}
                          </div>
                        )}

                        {message.quotationData?.shortDescription && (
                          <div className="quotation-desc">
                            {message.quotationData.shortDescription}
                          </div>
                        )}

                        {message.quotationData?.totalAmount && (
                          <div className="quotation-total">
                            <div>
                              Total: {message.quotationData.currency}{" "}
                              {message.quotationData.totalAmount.toFixed(2)}
                            </div>
                            <div>
                              Advance (50%): {message.quotationData.currency}{" "}
                              {(
                                message.quotationData.totalAmount * 0.5
                              ).toFixed(2)}
                            </div>
                          </div>
                        )}

                        {isQuotationSigned ? (
                          <div className="quotation-signed">
                            <div className="quotation-signed-banner">
                              Proof details submitted successfully.
                            </div>
                            <div className="quotation-signed-details">
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
                          <>
                            <div className="quotation-actions">
                              <button
                                type="button"
                                className="quotation-btn quotation-btn--ghost"
                                onClick={() =>
                                  handleOpenPdf(message.quotationData)
                                }
                              >
                                View PDF
                              </button>
                              <button
                                type="button"
                                className="quotation-btn quotation-btn--primary"
                                onClick={() =>
                                  handleDownloadPdf(message.quotationData)
                                }
                              >
                                Download PDF
                              </button>
                            </div>
                            <button
                              type="button"
                              className="quotation-btn quotation-btn--primary quotation-btn--full"
                              onClick={() => {
                                window.dispatchEvent(
                                  new CustomEvent("openClientQuotationSign", {
                                    detail: message.quotationData?._id,
                                  }),
                                );
                              }}
                            >
                              Sign Now
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {message.messageType === "image" && message.imageUrl && (
                    <div className="client-message-image">
                      <img
                        src={message.imageUrl}
                        alt={message.fileName || "Shared"}
                      />
                      <div className="client-image-actions">
                        <button
                          type="button"
                          onClick={() => handleOpenImage(message.imageUrl)}
                        >
                          Open Full
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadAttachment(
                              message.imageUrl,
                              message.fileName || message.content || "image",
                            )
                          }
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  )}

                  {message.messageType === "document" &&
                    message.documentUrl && (
                      <div className="client-message-file">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDownloadAttachment(
                              message.documentUrl,
                              message.documentName ||
                                message.fileName ||
                                message.content ||
                                "document.pdf",
                            );
                          }}
                        >
                          📄{" "}
                          {message.documentName ||
                            message.content ||
                            "Document"}
                        </a>
                      </div>
                    )}

                  {message.messageType === "file" && message.fileUrl && (
                    <div className="client-message-file">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDownloadAttachment(
                            message.fileUrl,
                            message.fileName ||
                              message.documentName ||
                              message.content ||
                              "file",
                          );
                        }}
                      >
                        📎 {message.fileName || message.content || "File"}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
            {isSupportTyping && (
              <div className="client-message other">
                <div className="typing-indicator-bubble" aria-live="polite">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="empty-chat-messages">
            <p>👋 Hello! How can we help you today?</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form className="client-message-input-form" onSubmit={handleSendMessage}>
        <label className="client-file-upload-btn" title="Attach file">
          <Paperclip size={18} />
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploadingFile}
          />
        </label>
        <input
          type="text"
          className="client-message-input"
          placeholder="Type your message..."
          value={messageText}
          onChange={(e) => {
            setMessageText(e.target.value);
            handleTyping();
          }}
        />
        <button
          type="submit"
          className="client-send-button"
          disabled={!messageText.trim() || uploadingFile}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ClientChatWindow;
