"use client";
import React, { useState, useRef, useEffect } from "react";
import { X, Upload, FileCheck } from "lucide-react";
import "./ClientQuotationSignDialog.css";

const ClientQuotationSignDialog = ({
  open,
  onClose,
  quotationId,
  quotationDetails,
  onSubmitSuccess,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const contextRef = useRef(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [isSignatureFilled, setIsSignatureFilled] = useState(false);

  // Signature file upload states
  const [signatureFile, setSignatureFile] = useState(null);
  const [signatureFilePreview, setSignatureFilePreview] = useState(null);

  // File states
  const [nationalIdFront, setNationalIdFront] = useState(null);
  const [nationalIdBack, setNationalIdBack] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);

  // File preview states
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [paymentPreview, setPaymentPreview] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Preview modal states
  const [previewModal, setPreviewModal] = useState({
    open: false,
    title: "",
    src: "",
    type: "image", // 'image' or 'pdf'
  });

  const steps = [
    "E-Signature",
    "National ID",
    "Payment Proof",
    "Review & Submit",
  ];

  // Initialize canvas for signature
  useEffect(() => {
    if (open && activeStep === 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        // Set up drawing context with proper settings
        context.lineCap = "round";
        context.lineJoin = "round";
        context.lineWidth = 4;
        context.strokeStyle = "#000000";
        context.globalCompositeOperation = "source-over";

        // Fill canvas with white background
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        contextRef.current = context;
      }
    }
  }, [open, activeStep]);

  // Handle mouse events for drawing
  const getPointerPosition = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX;
    let clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    const point = getPointerPosition(e);
    if (!point || !contextRef.current) return;
    e.preventDefault?.();

    const context = contextRef.current;
    // Ensure line settings before starting
    context.lineWidth = 4;
    context.strokeStyle = "#000000";
    context.lineCap = "round";
    context.lineJoin = "round";

    context.beginPath();
    context.moveTo(point.x, point.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !contextRef.current) return;
    const point = getPointerPosition(e);
    if (!point) return;
    e.preventDefault?.();

    const context = contextRef.current;
    // Ensure line settings are applied before drawing
    context.lineWidth = 4;
    context.strokeStyle = "#000000";
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
    }
    setIsDrawing(false);
    // Check if signature is filled and update state
    if (!isSignatureEmpty()) {
      setIsSignatureFilled(true);
    }
  };

  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      setError("Please upload JPG, PNG, or PDF files only");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const clearSignature = () => {
    if (canvasRef.current && contextRef.current) {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.lineWidth = 4;
      context.strokeStyle = "#000000";
      setSignatureDataUrl("");
      setIsSignatureFilled(false);
      setError("");
    }
  };

  const isSignatureEmpty = () => {
    if (!canvasRef.current) return true;
    const imageData = contextRef.current.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height,
    );
    return imageData.data.every((val, idx) => {
      if (idx % 4 === 3) return true;
      return val === 255;
    });
  };

  const handleNext = () => {
    setError("");
    if (activeStep === 0) {
      if (!signatureFile && isSignatureEmpty()) {
        setError("Please provide your signature (draw or upload)");
        return;
      }
      // Only generate canvas data if user drew signature and didn't upload
      if (!signatureFile && canvasRef.current) {
        setSignatureDataUrl(canvasRef.current.toDataURL("image/png"));
      }
    } else if (activeStep === 1) {
      if (!nationalIdFront || !nationalIdBack) {
        setError("Please upload both front and back of your National ID");
        return;
      }
    } else if (activeStep === 2) {
      if (!paymentProof) {
        setError("Please upload payment proof");
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const isStepComplete = () => {
    if (activeStep === 0) {
      // Step 0: Check if signature was filled by user (drawn or uploaded)
      return isSignatureFilled || !!signatureFile;
    }
    if (activeStep === 1) {
      // Step 1: Both ID files required
      return !!nationalIdFront && !!nationalIdBack;
    }
    if (activeStep === 2) {
      // Step 2: Payment proof required
      return !!paymentProof;
    }
    // Step 3 (review): always allow
    return true;
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();

      // Add signature (either uploaded file or drawn canvas)
      if (signatureFile) {
        // Use uploaded signature file
        formData.append("signature", signatureFile);
      } else {
        // Use drawn signature
        const signatureSource =
          signatureDataUrl ||
          (canvasRef.current && !isSignatureEmpty()
            ? canvasRef.current.toDataURL("image/png")
            : "");

        if (signatureSource) {
          const signatureBlob = await (await fetch(signatureSource)).blob();
          formData.append("signature", signatureBlob, "signature.png");
        }
      }

      // Add ID files
      if (nationalIdFront) {
        formData.append("nationalIdFront", nationalIdFront);
      }
      if (nationalIdBack) {
        formData.append("nationalIdBack", nationalIdBack);
      }

      // Add payment proof
      if (paymentProof) {
        formData.append("paymentProof", paymentProof);
      }

      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"}/api/v1/quotations/${quotationId}/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit quotation");
      }

      const result = await response.json();

      setSuccess("Quotation submitted successfully!");
      setTimeout(() => {
        onSubmitSuccess?.(result?.data);
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error submitting quotation:", error);
      setError(error.message || "Failed to submit quotation");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="step-content">
            <p className="step-description">
              Please sign below. Your signature will be used as proof of
              acceptance. You can either draw your signature or upload an image.
            </p>

            {!signatureFile && (
              <>
                <div className="canvas-container">
                  <label className="file-upload-label">
                    Draw Your Signature
                  </label>
                  <canvas
                    ref={canvasRef}
                    className="signature-canvas"
                    width={600}
                    height={300}
                    style={{
                      backgroundColor: "white",
                      display: "block",
                      touchAction: "none",
                      border: "2px solid rgba(158, 255, 0, 0.3)",
                      borderRadius: "6px",
                      cursor: "crosshair",
                      maxWidth: "100%",
                      margin: "0 auto",
                    }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="btn-secondary w-full"
                >
                  Clear Signature
                </button>

                <div className="divider-section">
                  <span>OR</span>
                </div>
              </>
            )}

            {/* Upload Signature File */}
            <div className="file-upload-group">
              <label className="file-upload-label">
                Upload Signature Image
              </label>
              {signatureFilePreview ? (
                <div className="file-preview">
                  <img src={signatureFilePreview} alt="Signature" />
                  <button
                    type="button"
                    onClick={() => {
                      setSignatureFile(null);
                      setSignatureFilePreview(null);
                    }}
                    className="btn-link-small"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <label className="file-upload-box">
                  <Upload size={24} className="upload-icon" />
                  <p>Click to upload or drag and drop</p>
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) =>
                      handleFileChange(
                        e,
                        setSignatureFile,
                        setSignatureFilePreview,
                      )
                    }
                  />
                </label>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="step-content">
            <p className="step-description">
              Please upload clear scans of both sides of your National ID card.
            </p>

            {/* Front ID */}
            <div className="file-upload-group">
              <label className="file-upload-label">
                National ID - Front Side
              </label>
              {frontPreview ? (
                <div className="file-preview">
                  <img src={frontPreview} alt="National ID Front" />
                  <button
                    type="button"
                    onClick={() => {
                      setNationalIdFront(null);
                      setFrontPreview(null);
                    }}
                    className="btn-link-small"
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <label className="file-upload-box">
                  <Upload size={24} className="upload-icon" />
                  <p>Click to upload or drag and drop</p>
                  <input
                    type="file"
                    hidden
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      handleFileChange(e, setNationalIdFront, setFrontPreview)
                    }
                  />
                </label>
              )}
            </div>

            {/* Back ID */}
            <div className="file-upload-group">
              <label className="file-upload-label">
                National ID - Back Side
              </label>
              {backPreview ? (
                <div className="file-preview">
                  <img src={backPreview} alt="National ID Back" />
                  <button
                    type="button"
                    onClick={() => {
                      setNationalIdBack(null);
                      setBackPreview(null);
                    }}
                    className="btn-link-small"
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <label className="file-upload-box">
                  <Upload size={24} className="upload-icon" />
                  <p>Click to upload or drag and drop</p>
                  <input
                    type="file"
                    hidden
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      handleFileChange(e, setNationalIdBack, setBackPreview)
                    }
                  />
                </label>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="alert alert-info mb-4">
              Please upload proof of 50% advance payment of{" "}
              <strong>
                {quotationDetails?.currency}{" "}
                {(quotationDetails?.advanceRequired || 0).toFixed(2)}
              </strong>
            </div>

            {paymentPreview ? (
              <div className="file-preview">
                <img src={paymentPreview} alt="Payment Proof" />
                <button
                  type="button"
                  onClick={() => {
                    setPaymentProof(null);
                    setPaymentPreview(null);
                  }}
                  className="btn-link-small"
                >
                  Change File
                </button>
              </div>
            ) : (
              <label className="file-upload-box file-upload-large">
                <Upload size={32} className="upload-icon" />
                <p className="font-semibold">Click to upload payment proof</p>
                <p className="text-sm text-gray-500">
                  (Screenshot, receipt, or transfer confirmation)
                </p>
                <input
                  type="file"
                  hidden
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    handleFileChange(e, setPaymentProof, setPaymentPreview)
                  }
                />
              </label>
            )}
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <div className="alert alert-success mb-4">
              You have completed all required steps. Click "Submit Quotation" to
              finalize.
            </div>

            <div className="review-card">
              <div className="review-item">
                <div className="review-check">
                  <FileCheck size={20} />
                  <span>E-Signature</span>
                </div>
                <span className="completion-badge">✓ Completed</span>
              </div>
              {(signatureDataUrl || signatureFilePreview) && (
                <div className="document-actions">
                  <button
                    onClick={() =>
                      setPreviewModal({
                        open: true,
                        title: "Your Signature",
                        src: signatureFilePreview || signatureDataUrl,
                        type: "image",
                      })
                    }
                  >
                    👁️ View Signature
                  </button>
                </div>
              )}
              <hr />
              <div className="review-item">
                <div className="review-check">
                  <FileCheck size={20} />
                  <span>National ID (Front & Back)</span>
                </div>
                <span className="completion-badge">✓ Completed</span>
              </div>
              {(nationalIdFront || nationalIdBack) && (
                <div className="document-actions">
                  {frontPreview && (
                    <button
                      onClick={() =>
                        setPreviewModal({
                          open: true,
                          title: "National ID - Front",
                          src: frontPreview,
                          type: frontPreview.startsWith("data:application/pdf")
                            ? "pdf"
                            : "image",
                        })
                      }
                    >
                      👁️ View Front
                    </button>
                  )}
                  {backPreview && (
                    <button
                      onClick={() =>
                        setPreviewModal({
                          open: true,
                          title: "National ID - Back",
                          src: backPreview,
                          type: backPreview.startsWith("data:application/pdf")
                            ? "pdf"
                            : "image",
                        })
                      }
                    >
                      👁️ View Back
                    </button>
                  )}
                </div>
              )}
              <hr />
              <div className="review-item">
                <div className="review-check">
                  <FileCheck size={20} />
                  <span>Payment Proof</span>
                </div>
                <span className="completion-badge">✓ Completed</span>
              </div>
              {paymentPreview && (
                <div className="document-actions">
                  <button
                    onClick={() =>
                      setPreviewModal({
                        open: true,
                        title: "Payment Proof",
                        src: paymentPreview,
                        type: paymentPreview.startsWith("data:application/pdf")
                          ? "pdf"
                          : "image",
                      })
                    }
                  >
                    👁️ View Document
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <div className="quotation-sign-modal-overlay">
      <div className="quotation-sign-modal">
        <div className="modal-header">
          <h2>Sign Your Quotation</h2>
          <button onClick={onClose} className="btn-close" disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Steps */}
          <div className="stepper">
            {steps.map((label, index) => (
              <div
                key={index}
                className={`step ${index < activeStep ? "completed" : ""} ${
                  index === activeStep ? "active" : ""
                }`}
              >
                <div className="step-number">{index + 1}</div>
                <div className="step-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Quotation Details */}
          {quotationDetails && (
            <div className="quotation-info-card">
              <p className="font-semibold mb-2">Quotation Details:</p>
              <p>
                Amount:{" "}
                <strong>
                  {quotationDetails.currency}{" "}
                  {quotationDetails.totalAmount?.toFixed(2)}
                </strong>
              </p>
              <p>
                Advance Required (50%):{" "}
                <strong>
                  {quotationDetails.currency}{" "}
                  {quotationDetails.advanceRequired?.toFixed(2)}
                </strong>
              </p>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Step Content */}
          {renderStepContent()}
        </div>

        <div className="modal-footer">
          <button
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
            className="btn-secondary"
          >
            Back
          </button>
          <div className="flex-1" />
          {activeStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={loading || !isStepComplete()}
              className="btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Submitting..." : "Submit Quotation"}
            </button>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewModal.open && (
        <div className="preview-modal-overlay">
          <div className="preview-modal">
            <div className="preview-modal-header">
              <h3>{previewModal.title}</h3>
              <button
                onClick={() =>
                  setPreviewModal({ ...previewModal, open: false })
                }
                className="btn-close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="preview-modal-body">
              {previewModal.type === "image" ? (
                <img
                  src={previewModal.src}
                  alt={previewModal.title}
                  className="preview-image"
                />
              ) : (
                <embed
                  src={previewModal.src}
                  type="application/pdf"
                  className="preview-pdf"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientQuotationSignDialog;
