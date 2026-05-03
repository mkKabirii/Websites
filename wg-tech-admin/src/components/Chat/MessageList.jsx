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
          const senderRole = (message.senderId?.role || message.senderId?.userRole || "").toLowerCase();
          const isOwnMessage = senderRole === "admin" || senderRole === "worker" || sender?.toString() === userId?.toString();

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
                  <div className="message-content" style={{ maxWidth: "80%" }}>
                    {message.messageType === "text" && (
                      <div className={`message-bubble ${isOwnMessage ? "own" : "other"}`}>
                        <span className="message-sender-name">
                          {isOwnMessage
                            ? (message.senderId?.username || message.senderId?.name || "You")
                            : (message.senderId?.username || message.senderId?.name || message.senderId?.email || "User")}
                        </span>
                        <p>{message.content}</p>
                        <span className="message-time-inner" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          {formatTime(message.createdAt)}
                          {isOwnMessage && (
                            <span className="read-status" style={{ display: "flex" }}>
                              {message.readBy?.length > 1 ? (
                                <CheckCheck size={14} />
                              ) : (
                                <Check size={14} />
                              )}
                            </span>
                          )}
                        </span>
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
                      <div className={`message-document ${isOwnMessage ? "own" : "other"}`} style={{ marginTop: "4px", marginBottom: "4px" }}>
                        <a
                          href="#"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            backgroundColor: isOwnMessage ? "rgba(158, 255, 0, 0.1)" : "#2A2A2A",
                            color: isOwnMessage ? "#9EFF00" : "#fff",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            textDecoration: "none",
                            border: `1px solid ${isOwnMessage ? "rgba(158, 255, 0, 0.3)" : "#444"}`,
                            fontSize: "14px",
                            fontWeight: "500",
                            transition: "all 0.2s",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = isOwnMessage ? "rgba(158, 255, 0, 0.15)" : "#333";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = isOwnMessage ? "rgba(158, 255, 0, 0.1)" : "#2A2A2A";
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            handleDownloadAttachment(
                              message.documentUrl,
                              message.documentName || message.fileName || message.content || "document.pdf"
                            );
                          }}
                        >
                          <span style={{ fontSize: "18px" }}>📄</span>
                          <span style={{ wordBreak: "break-all" }}>
                            {message.documentName || message.fileName || message.content || "Document"}
                          </span>
                        </a>
                      </div>
                    )}

                    {message.messageType === "file" && (
                      <div className={`message-file ${isOwnMessage ? "own" : "other"}`} style={{ marginTop: "4px", marginBottom: "4px" }}>
                        <a
                          href="#"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            backgroundColor: isOwnMessage ? "rgba(158, 255, 0, 0.1)" : "#2A2A2A",
                            color: isOwnMessage ? "#9EFF00" : "#fff",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            textDecoration: "none",
                            border: `1px solid ${isOwnMessage ? "rgba(158, 255, 0, 0.3)" : "#444"}`,
                            fontSize: "14px",
                            fontWeight: "500",
                            transition: "all 0.2s",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = isOwnMessage ? "rgba(158, 255, 0, 0.15)" : "#333";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = isOwnMessage ? "rgba(158, 255, 0, 0.1)" : "#2A2A2A";
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            handleDownloadAttachment(
                              message.fileUrl,
                              message.fileName || message.documentName || message.content || "file"
                            );
                          }}
                        >
                          <span style={{ fontSize: "18px" }}>📎</span>
                          <span style={{ wordBreak: "break-all" }}>
                            {message.fileName || message.documentName || message.content || "File"}
                          </span>
                        </a>
                      </div>
                    )}

                    {message.messageType === "quotation" && (
                      <div className={`message-quotation ${isOwnMessage ? "own" : "other"}`} style={{ cursor: "pointer", marginTop: "6px", marginBottom: "6px" }}>
                        <div style={{
                          backgroundColor: isOwnMessage ? "rgba(158, 255, 0, 0.05)" : "#1E1E1E",
                          border: `1px solid ${isOwnMessage ? "rgba(158, 255, 0, 0.2)" : "#333"}`,
                          borderRadius: "12px",
                          padding: "16px",
                          width: "100%",
                          maxWidth: "380px",
                          color: "#fff",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                        }}>
                          {message.quotationData?.image && (
                            <img
                              src={message.quotationData.image}
                              alt="Quotation"
                              style={{ width: "100%", borderRadius: "8px", marginBottom: "12px", maxHeight: "160px", objectFit: "cover" }}
                            />
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span style={{ fontSize: "16px" }}>📄</span>
                            <div style={{ fontWeight: "600", fontSize: "15px", color: "#fff" }}>
                              {message.quotationData?.title || "Quotation"}
                            </div>
                          </div>

                          {message.quotationData?.subTitle && (
                            <div style={{ fontSize: "13px", color: "#aaa", marginBottom: "8px" }}>
                              {message.quotationData.subTitle}
                            </div>
                          )}

                          {message.quotationData?.shortDescription && (
                            <div style={{ fontSize: "13px", color: "#ccc", marginBottom: "12px", lineHeight: "1.5" }}>
                              {message.quotationData.shortDescription}
                            </div>
                          )}

                          {isQuotationSigned && (
                            <div
                              style={{
                                backgroundColor: "rgba(158, 255, 0, 0.1)",
                                color: "#9EFF00",
                                border: "1px solid rgba(158, 255, 0, 0.3)",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "600",
                                marginBottom: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                              }}
                            >
                              <Check size={14} /> Signed submission received. Review proofs.
                            </div>
                          )}

                          {message.quotationData?.totalAmount && (
                            <div style={{
                              backgroundColor: "#2A2A2A",
                              border: "1px solid #333",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              fontSize: "13px",
                              marginBottom: "12px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px"
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", fontWeight: "600" }}>
                                <span>Total:</span>
                                <span>{message.quotationData.currency} {message.quotationData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", color: "#aaa", fontSize: "12px" }}>
                                <span>Advance (50%):</span>
                                <span>{message.quotationData.currency} {(message.quotationData.totalAmount * 0.5).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          )}

                          {isQuotationSigned ? (
                            <div
                              style={{
                                backgroundColor: "#2A2A2A",
                                padding: "12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                color: "#ccc",
                                lineHeight: "1.8",
                                border: "1px solid #333",
                                marginBottom: "12px"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Signature:</span> <span style={{ color: mergedSubmission?.signature ? "#9EFF00" : "#aaa", fontWeight: mergedSubmission?.signature ? "600" : "400" }}>{mergedSubmission?.signature ? "Uploaded" : "Submitted"}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>ID Front:</span> <span style={{ color: mergedSubmission?.nationalIdFront ? "#9EFF00" : "#aaa", fontWeight: mergedSubmission?.nationalIdFront ? "600" : "400" }}>{mergedSubmission?.nationalIdFront ? "Uploaded" : "Submitted"}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>ID Back:</span> <span style={{ color: mergedSubmission?.nationalIdBack ? "#9EFF00" : "#aaa", fontWeight: mergedSubmission?.nationalIdBack ? "600" : "400" }}>{mergedSubmission?.nationalIdBack ? "Uploaded" : "Submitted"}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Payment Proof:</span> <span style={{ color: mergedSubmission?.paymentProof ? "#9EFF00" : "#aaa", fontWeight: mergedSubmission?.paymentProof ? "600" : "400" }}>{mergedSubmission?.paymentProof ? "Uploaded" : "Submitted"}</span>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                              <button
                                style={{
                                  flex: 1,
                                  padding: "10px",
                                  backgroundColor: "transparent",
                                  color: "#9EFF00",
                                  border: "1px solid #9EFF00",
                                  borderRadius: "8px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease-in-out",
                                }}
                                onMouseOver={(e) => { 
                                  e.currentTarget.style.backgroundColor = 'rgba(158, 255, 0, 0.1)'; 
                                }}
                                onMouseOut={(e) => { 
                                  e.currentTarget.style.backgroundColor = 'transparent'; 
                                }}
                                onClick={() => handleOpenPdf(message.quotationData)}
                              >
                                View PDF
                              </button>
                              <button
                                style={{
                                  flex: 1,
                                  padding: "10px",
                                  backgroundColor: "transparent",
                                  color: "#9EFF00",
                                  border: "1px solid #9EFF00",
                                  borderRadius: "8px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease-in-out",
                                }}
                                onMouseOver={(e) => { 
                                  e.currentTarget.style.backgroundColor = 'rgba(158, 255, 0, 0.1)'; 
                                }}
                                onMouseOut={(e) => { 
                                  e.currentTarget.style.backgroundColor = 'transparent'; 
                                }}
                                onClick={() => handleDownloadPdf(message.quotationData)}
                              >
                                Download PDF
                              </button>
                            </div>
                          )}
                          {!isOwnMessage && (
                            <button style={{
                              width: "100%",
                              padding: "12px",
                              backgroundColor: "#9EFF00",
                              color: "#000",
                              border: "none",
                              borderRadius: "8px",
                              fontSize: "14px",
                              fontWeight: "700",
                              cursor: "pointer",
                              transition: "all 0.2s ease-in-out",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              gap: "8px",
                              boxShadow: "0 4px 12px rgba(158, 255, 0, 0.2)",
                            }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#85d600';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '#9EFF00';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent("openQuotationProofs", { detail: message.quotationData?._id }));
                              }}>
                              {isQuotationSigned ? <><Check size={18} strokeWidth={3} /> Review & View Proofs</> : "View Submission Proofs"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {message.messageType !== "text" && (
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
                    )}
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
