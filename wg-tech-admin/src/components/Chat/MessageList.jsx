import React from "react";
import { CheckCheck, Check } from "lucide-react";
import "./MessageList.css";
import { downloadQuotationPdf, openQuotationPdfPreview } from "./quotationPdf";

const MessageList = ({ messages, userId }) => {
  const [quotationStatusById, setQuotationStatusById] = React.useState({});

  React.useEffect(() => {
    const quotationIds = Array.from(
      new Set(
        (messages || [])
          .filter((m) => m?.messageType === "quotation" && m?.quotationData?._id)
          .map((m) => String(m.quotationData._id))
      )
    );

    if (quotationIds.length === 0) return;

    let cancelled = false;

    const fetchLatestQuotationState = async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("authToken");
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8003";

        const results = await Promise.allSettled(
          quotationIds.map(async (quotationId) => {
            const response = await fetch(`${baseUrl}/api/v1/quotations/${quotationId}`, {
              headers: token
                ? {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  }
                : undefined,
            });

            if (!response.ok) {
              return [quotationId, null];
            }

            const data = await response.json();
            return [quotationId, data?.data || null];
          })
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

  const handleOpenPdf = async (quotationData) => {
    try {
      await openQuotationPdfPreview(quotationData, { logoPath: "/Logo.png" });
    } catch (error) {
      console.error("Failed to preview quotation PDF:", error);
    }
  };

  const handleDownloadPdf = async (quotationData) => {
    try {
      await downloadQuotationPdf(quotationData, { logoPath: "/Logo.png" });
    } catch (error) {
      console.error("Failed to download quotation PDF:", error);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US");
  };

  const signedQuotationIds = new Set(
    (messages || [])
      .filter(
        (m) =>
          m?.messageType === "quotation" &&
          m?.quotationData?._id &&
          (m?.quotationData?.status === "signed" || m?.quotationData?.clientSubmission)
      )
      .map((m) => String(m.quotationData._id))
  );

  let lastDate = null;

  return (
    <div className="messages-list">
      {messages && Array.isArray(messages) && messages.length > 0 ? (
        messages.map((message, index) => {
          // Validate message object
          if (!message || typeof message !== 'object') {
            console.warn('Invalid message object:', message);
            return null;
          }

          const messageDate = formatDate(message.createdAt);
          const showDateDivider = lastDate !== messageDate;
          lastDate = messageDate;

          const sender = message.senderId?._id || message.senderId;
          const isOwnMessage = sender?.toString() === userId?.toString();

          const safeKey = message._id ? `${message._id}-${index}` : `msg-${index}`;
          const quotationId = message?.quotationData?._id ? String(message.quotationData._id) : null;
          const latestQuotation = quotationId ? quotationStatusById[quotationId] : null;
          const mergedSubmission =
            message?.quotationData?.clientSubmission || latestQuotation?.clientSubmission;
          const isQuotationSigned = Boolean(
            quotationId &&
              (message?.quotationData?.status === "signed" ||
                message?.quotationData?.clientSubmission ||
                signedQuotationIds.has(quotationId) ||
                latestQuotation?.status === "signed" ||
                latestQuotation?.clientSubmission)
          );

          return (
            <div key={safeKey}>
              {showDateDivider && (
                <div className="date-divider">
                  <span>{messageDate}</span>
                </div>
              )}

              {message.messageType === "status_update" ? (
                <div className="status-update-message">
                  <div className="status-badge">
                    <span className="status-old">
                      {message.statusUpdate?.oldStatus}
                    </span>
                    <span className="status-arrow">→</span>
                    <span className="status-new">
                      {message.statusUpdate?.newStatus}
                    </span>
                  </div>
                  {message.statusUpdate?.description && (
                    <p className="status-description">
                      {message.statusUpdate.description}
                    </p>
                  )}
                  <span className="message-time">
                    {formatTime(message.createdAt)}
                  </span>
                </div>
              ) : (
                <div
                  className={`message ${isOwnMessage ? "own-message" : "other-message"}`}
                >
                  {!isOwnMessage && (
                    <div className="message-avatar">
                      {message.senderId?.profileImage ? (
                        <img src={message.senderId.profileImage} alt="Sender" />
                      ) : (
                        <div className="avatar-placeholder">
                          {message.senderId?.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="message-content">
                    {message.messageType === "text" && (
                      <div className={`message-bubble ${isOwnMessage ? "own" : "other"}`}>
                        <p>{message.content}</p>
                        {message.editedAt && (
                          <span className="edited-indicator">(edited)</span>
                        )}
                      </div>
                    )}

                    {message.messageType === "image" && (
                      <div className="message-image">
                        <img src={message.imageUrl} alt="Shared" />
                        <div className="message-image-actions">
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
                                message.fileName || message.content || "image"
                              )
                            }
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    )}

                    {message.messageType === "document" && (
                      <div className="message-document">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDownloadAttachment(
                              message.documentUrl,
                              message.documentName || message.fileName || message.content || "document.pdf"
                            );
                          }}
                        >
                          📄 {message.documentName || message.fileName || message.content || "Document"}
                        </a>
                      </div>
                    )}

                    {message.messageType === "file" && (
                      <div className="message-file">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDownloadAttachment(
                              message.fileUrl,
                              message.fileName || message.documentName || message.content || "file"
                            );
                          }}
                        >
                          📎 {message.fileName || message.documentName || message.content || "File"}
                        </a>
                      </div>
                    )}

                    {message.messageType === "quotation" && (
                      <div className={`message-quotation ${isOwnMessage ? "own" : "other"}`} style={{ cursor: "pointer" }}>
                        <div style={{
                          backgroundColor: isOwnMessage ? "#dcf8c6" : "#fff",
                          border: "1px solid #ccc",
                          borderRadius: "10px",
                          padding: "12px",
                          width: "100%",
                          maxWidth: "380px"
                        }}>
                          {message.quotationData?.image && (
                            <img 
                              src={message.quotationData.image} 
                              alt="Quotation" 
                              style={{ width: "100%", borderRadius: "8px", marginBottom: "8px", maxHeight: "150px", objectFit: "cover" }}
                            />
                          )}
                          <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>
                            📄 {message.quotationData?.title || "Quotation"}
                          </div>
                          {message.quotationData?.subTitle && (
                            <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>
                              {message.quotationData.subTitle}
                            </div>
                          )}
                          {message.quotationData?.shortDescription && (
                            <div style={{ fontSize: "13px", color: "#555", marginBottom: "8px", lineHeight: "1.4" }}>
                              {message.quotationData.shortDescription}
                            </div>
                          )}
                          {isQuotationSigned && (
                            <div
                              style={{
                                backgroundColor: "#ecfdf3",
                                color: "#166534",
                                border: "1px solid #86efac",
                                padding: "6px 8px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "bold",
                                marginBottom: "8px",
                              }}
                            >
                              Signed submission received. Review proofs to continue approval.
                            </div>
                          )}
                          {message.quotationData?.totalAmount && (
                            <div style={{ 
                              backgroundColor: "#f0f0f0", 
                              padding: "8px", 
                              borderRadius: "6px", 
                              fontSize: "12px",
                              fontWeight: "bold",
                              color: "#000"
                            }}>
                              Total: {message.quotationData.currency} {message.quotationData.totalAmount.toFixed(2)}
                              <br />
                              Advance (50%): {message.quotationData.currency} {(message.quotationData.totalAmount * 0.5).toFixed(2)}
                            </div>
                          )}

                          {isQuotationSigned ? (
                            <div
                              style={{
                                marginTop: "10px",
                                fontSize: "12px",
                                color: "#4b5563",
                                lineHeight: "1.5",
                              }}
                            >
                              Signature: {mergedSubmission?.signature ? "Uploaded" : "Submitted"}
                              <br />
                              National ID Front: {mergedSubmission?.nationalIdFront ? "Uploaded" : "Submitted"}
                              <br />
                              National ID Back: {mergedSubmission?.nationalIdBack ? "Uploaded" : "Submitted"}
                              <br />
                              Advance Payment Proof: {mergedSubmission?.paymentProof ? "Uploaded" : "Submitted"}
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                              <button
                                style={{
                                  flex: 1,
                                  padding: "8px",
                                  backgroundColor: "#111827",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                }}
                                onClick={() => handleOpenPdf(message.quotationData)}
                              >
                                View PDF
                              </button>
                              <button
                                style={{
                                  flex: 1,
                                  padding: "8px",
                                  backgroundColor: "#059669",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                }}
                                onClick={() => handleDownloadPdf(message.quotationData)}
                              >
                                Download PDF
                              </button>
                            </div>
                          )}
                          {!isOwnMessage && (
                            <button style={{
                              marginTop: "10px",
                              width: "100%",
                              padding: "8px",
                              backgroundColor: "#2563eb",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              cursor: "pointer"
                            }} onClick={() => {
                              window.dispatchEvent(new CustomEvent("openQuotationProofs", { detail: message.quotationData?._id }));
                            }}>
                              {isQuotationSigned ? "Review & View Proofs" : "View Submission Proofs"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="message-footer">
                      <span className="message-time">
                        {formatTime(message.createdAt)}
                      </span>
                      {isOwnMessage && (
                        <span className="read-status">
                          {message.readBy?.length > 1 ? (
                            <CheckCheck size={16} />
                          ) : (
                            <Check size={16} />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })
      ) : null}
    </div>
  );
};

export default MessageList;
