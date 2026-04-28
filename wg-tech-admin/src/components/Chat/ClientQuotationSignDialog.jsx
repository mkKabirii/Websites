import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Divider,
} from "@mui/material";
import { X, Upload, FileCheck } from "lucide-react";
import axios from "axios";
import { useSnackbar } from "notistack";
import CustomButton from "../customButton";
import { baseUrl } from "../../api";

const ClientQuotationSignDialog = ({
  open,
  onClose,
  quotationId,
  quotationDetails,
  onSubmitSuccess,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const contextRef = useRef(null);

  // File states
  const [nationalIdFront, setNationalIdFront] = useState(null);
  const [nationalIdBack, setNationalIdBack] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);

  // File preview states
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [paymentPreview, setPaymentPreview] = useState(null);

  const steps = [
    "E-Signature",
    "National ID",
    "Payment Proof",
    "Review & Submit",
  ];

  // Initialize canvas for signature
  useEffect(() => {
    if (open && activeStep === 0 && canvasRef.current && !contextRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth;
      canvas.height = 300;

      const context = canvas.getContext("2d");
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 2;
      context.strokeStyle = "#000";
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      contextRef.current = context;
    }
  }, [open, activeStep]);

  // Handle mouse events for drawing
  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = e.nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      enqueueSnackbar("Please upload JPG, PNG, or PDF files only", {
        variant: "error",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar("File size must be less than 5MB", { variant: "error" });
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
      contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const isSignatureEmpty = () => {
    if (!canvasRef.current) return true;
    const imageData = contextRef.current.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    return imageData.data.every((val, idx) => {
      // Check if pixel is white (255, 255, 255) or alpha is 0
      if (idx % 4 === 3) return true; // skip alpha channel
      return val === 255;
    });
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate signature
      if (isSignatureEmpty()) {
        enqueueSnackbar("Please provide your signature", { variant: "error" });
        return;
      }
    } else if (activeStep === 1) {
      // Validate national ID
      if (!nationalIdFront || !nationalIdBack) {
        enqueueSnackbar(
          "Please upload both front and back of your National ID",
          { variant: "error" }
        );
        return;
      }
    } else if (activeStep === 2) {
      // Validate payment proof
      if (!paymentProof) {
        enqueueSnackbar("Please upload payment proof", { variant: "error" });
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();

      // Add signature as data URL (backend supports base64 PNG)
      if (canvasRef.current && !isSignatureEmpty()) {
        const signatureDataUrl = canvasRef.current.toDataURL("image/png");
        formData.append("signature", signatureDataUrl);
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

      const response = await axios.post(
        `${baseUrl}v1/quotations/${quotationId}/submit`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      enqueueSnackbar("Quotation submitted successfully!", {
        variant: "success",
      });
      onSubmitSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error submitting quotation:", error);
      enqueueSnackbar(
        error.response?.data?.message || "Failed to submit quotation",
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box className="space-y-4">
            <Typography variant="body2" className="text-gray-700">
              Please sign below. Your signature will be used as proof of acceptance.
            </Typography>
            <Paper variant="outlined" className="p-2">
              <canvas
                ref={canvasRef}
                className="w-full border border-gray-200 rounded cursor-crosshair"
                style={{ 
                  minHeight: "300px", 
                  backgroundColor: "white",
                  display: "block",
                  touchAction: "none"
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </Paper>
            <Button
              variant="outlined"
              onClick={clearSignature}
              fullWidth
              size="small"
            >
              Clear Signature
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box className="space-y-4">
            <Typography variant="body2" className="text-gray-700 mb-4">
              Please upload clear scans of both sides of your National ID card.
            </Typography>

            {/* Front ID */}
            <Box>
              <Typography variant="caption" className="font-semibold mb-2 block">
                National ID - Front Side
              </Typography>
              {frontPreview ? (
                <div className="relative mb-3">
                  <img
                    src={frontPreview}
                    alt="National ID Front"
                    className="w-full h-40 object-cover rounded border"
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setNationalIdFront(null);
                      setFrontPreview(null);
                    }}
                    className="mt-2"
                    fullWidth
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition block">
                  <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                  <Typography variant="caption">
                    Click to upload or drag and drop
                  </Typography>
                  <input
                    type="file"
                    hidden
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      handleFileChange(
                        e,
                        setNationalIdFront,
                        setFrontPreview
                      )
                    }
                  />
                </label>
              )}
            </Box>

            {/* Back ID */}
            <Box>
              <Typography variant="caption" className="font-semibold mb-2 block">
                National ID - Back Side
              </Typography>
              {backPreview ? (
                <div className="relative mb-3">
                  <img
                    src={backPreview}
                    alt="National ID Back"
                    className="w-full h-40 object-cover rounded border"
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setNationalIdBack(null);
                      setBackPreview(null);
                    }}
                    className="mt-2"
                    fullWidth
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition block">
                  <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                  <Typography variant="caption">
                    Click to upload or drag and drop
                  </Typography>
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
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box className="space-y-4">
            <Alert severity="info">
              Please upload proof of 50% advance payment of{" "}
              <strong>
                {quotationDetails?.currency} {(quotationDetails?.advanceRequired || 0).toFixed(2)}
              </strong>
            </Alert>

            {paymentPreview ? (
              <div className="relative">
                <img
                  src={paymentPreview}
                  alt="Payment Proof"
                  className="w-full h-48 object-cover rounded border"
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setPaymentProof(null);
                    setPaymentPreview(null);
                  }}
                  className="mt-2"
                  fullWidth
                >
                  Change File
                </Button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition block">
                <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                <Typography variant="subtitle2" className="mb-1">
                  Click to upload payment proof
                </Typography>
                <Typography variant="caption" className="text-gray-500">
                  (Screenshot, receipt, or transfer confirmation)
                </Typography>
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
          </Box>
        );

      case 3:
        return (
          <Box className="space-y-4">
            <Alert severity="success">
              You have completed all required steps. Click "Submit" to finalize.
            </Alert>

            <Card variant="outlined">
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck size={20} className="text-green-600" />
                      <Typography variant="body2">
                        E-Signature
                      </Typography>
                    </div>
                    <Typography variant="caption" className="text-green-600">
                      ✓ Completed
                    </Typography>
                  </div>
                  <Divider />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck size={20} className="text-green-600" />
                      <Typography variant="body2">
                        National ID (Front & Back)
                      </Typography>
                    </div>
                    <Typography variant="caption" className="text-green-600">
                      ✓ Completed
                    </Typography>
                  </div>
                  <Divider />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck size={20} className="text-green-600" />
                      <Typography variant="body2">
                        Payment Proof
                      </Typography>
                    </div>
                    <Typography variant="caption" className="text-green-600">
                      ✓ Completed
                    </Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <div className="flex items-center justify-between">
          <span>Sign Your Quotation</span>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </div>
      </DialogTitle>

      <Divider />

      <DialogContent className="py-6">
        <Stepper activeStep={activeStep} className="mb-6">
          {steps.map((label, index) => (
            <Step key={index} completed={index < activeStep}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {quotationDetails && (
          <Card variant="outlined" className="mb-6 bg-blue-50">
            <CardContent className="py-3">
              <Typography variant="caption" className="font-semibold block mb-2">
                Quotation Details:
              </Typography>
              <Typography variant="caption" className="text-gray-700">
                Amount: <strong>{quotationDetails.currency} {quotationDetails.totalAmount?.toFixed(2)}</strong>
              </Typography>
              <br />
              <Typography variant="caption" className="text-gray-700">
                Advance Required (50%): <strong>{quotationDetails.currency} {quotationDetails.advanceRequired?.toFixed(2)}</strong>
              </Typography>
            </CardContent>
          </Card>
        )}

        <Box className="mb-6">{renderStepContent()}</Box>
      </DialogContent>

      <Divider />

      <DialogActions className="p-4">
        <Button onClick={handleBack} disabled={activeStep === 0 || loading}>
          Back
        </Button>
        <Box className="flex-1" />
        <Button onClick={onClose} disabled={loading}>
          Skip for Now
        </Button>
        {activeStep < steps.length - 1 ? (
          <CustomButton
            onClick={handleNext}
            variant="contained"
            disabled={loading}
          >
            Next
          </CustomButton>
        ) : (
          <CustomButton
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? (
              <>
                <CircularProgress size={20} className="mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Quotation"
            )}
          </CustomButton>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ClientQuotationSignDialog;
