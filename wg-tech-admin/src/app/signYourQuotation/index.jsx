import React, { useState, useRef, useEffect } from "react";
import { useSnackbar } from "notistack";
import { useParams, useNavigate } from "react-router-dom";
import useUserStore from "../../zustand/useUserStore";
import api from "../../api";
import ENDPOINTS from "../../api/endpoint";
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { Upload, Send, Check } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

const SignYourQuotation = () => {
  const { quotationId } = useParams();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const { enqueueSnackbar } = useSnackbar();

  const signatureCanvasRef = useRef(null);
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nationalIdFront: null,
    nationalIdBack: null,
    paymentProof: null,
    notes: "",
  });

  const [fileNames, setFileNames] = useState({
    nationalIdFront: "No file selected",
    nationalIdBack: "No file selected",
    paymentProof: "No file selected",
  });

  // Fetch quotation details
  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const response = await api(
          `${ENDPOINTS.getQuotationById}/${quotationId}`,
          null,
          "get"
        );
        if (response.status === 200 || response.status === 201) {
          setQuotation(response.data?.data);
        } else {
          enqueueSnackbar("Failed to load quotation", { variant: "error" });
        }
      } catch (error) {
        console.error("Error fetching quotation:", error);
        enqueueSnackbar("Error loading quotation", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [quotationId, enqueueSnackbar]);

  // Handle file uploads
  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: file,
      }));
      setFileNames((prev) => ({
        ...prev,
        [fieldName]: file.name,
      }));
    }
  };

  // Clear signature
  const clearSignature = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
  };

  // Submit signed quotation
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate signature
    if (!signatureCanvasRef.current || signatureCanvasRef.current.isEmpty()) {
      enqueueSnackbar("Please sign the quotation", { variant: "warning" });
      return;
    }

    // Validate files
    if (!formData.nationalIdFront || !formData.nationalIdBack) {
      enqueueSnackbar(
        "Please upload both sides of your national ID",
        { variant: "warning" }
      );
      return;
    }

    if (!formData.paymentProof) {
      enqueueSnackbar("Please upload payment proof", { variant: "warning" });
      return;
    }

    setSubmitting(true);

    try {
      // Get signature as data URL
      const signatureDataUrl = signatureCanvasRef.current
        .getTrimmedCanvas()
        .toDataURL("image/png");

      // Create FormData for multipart upload
      const formDataToSend = new FormData();
      formDataToSend.append("signature", signatureDataUrl);
      formDataToSend.append("nationalIdFront", formData.nationalIdFront);
      formDataToSend.append("nationalIdBack", formData.nationalIdBack);
      formDataToSend.append("paymentProof", formData.paymentProof);
      if (formData.notes) {
        formDataToSend.append("notes", formData.notes);
      }

      const response = await api(
        `${ENDPOINTS.submitSignedQuotation}/${quotationId}/submit`,
        formDataToSend,
        "post",
        true
      );

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar("Quotation submitted successfully!", {
          variant: "success",
        });
        setTimeout(() => navigate("/my-projects"), 2000);
      } else {
        enqueueSnackbar(
          response.data?.message || "Failed to submit quotation",
          { variant: "error" }
        );
      }
    } catch (error) {
      console.error("Error submitting quotation:", error);
      enqueueSnackbar("Error submitting quotation", { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "transparent",
        }}
      >
        <CircularProgress sx={{ color: "#8CE600" }} />
      </Box>
    );
  }

  if (!quotation) {
    return (
      <Box sx={{ p: 3, backgroundColor: "transparent", minHeight: "100vh" }}>
        <Alert severity="error">Quotation not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: "transparent", minHeight: "100vh" }}>
      <Typography
        variant="h4"
        sx={{
          color: "#FFFFFF",
          fontWeight: 700,
          mb: 4,
          background: "#8CE600",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Sign Your Quotation
      </Typography>

      <Grid container spacing={3}>
        {/* Quotation Details */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              backgroundColor: "#1A1A1A",
              border: "1px solid #333333",
              borderRadius: "12px",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{ color: "#8CE600", mb: 2, fontWeight: 600 }}
              >
                Quotation Details
              </Typography>
              <Divider sx={{ my: 2, borderColor: "#333333" }} />

              <Box sx={{ color: "#B0B0B0" }}>
                <Typography sx={{ mb: 1 }}>
                  <strong>Quotation ID:</strong> {quotation._id.slice(-6)}
                </Typography>
                <Typography sx={{ mb: 1 }}>
                  <strong>Total Amount:</strong> $
                  {quotation.quotationDetails?.totalAmount?.toLocaleString()}
                </Typography>
                <Typography sx={{ mb: 1 }}>
                  <strong>Advance Required:</strong> $
                  {quotation.quotationDetails?.advanceRequired?.toLocaleString()}
                </Typography>
                <Typography sx={{ mb: 2 }}>
                  <strong>Status:</strong>{" "}
                  <span style={{ color: "#8CE600" }}>{quotation.status}</span>
                </Typography>

                <Divider sx={{ my: 2, borderColor: "#333333" }} />

                <Typography sx={{ mb: 2, color: "#8CE600", fontWeight: 600 }}>
                  Items:
                </Typography>
                {quotation.quotationDetails?.items?.map((item, idx) => (
                  <Box key={idx} sx={{ mb: 1.5, pl: 2 }}>
                    <Typography sx={{ color: "#B0B0B0" }}>
                      {idx + 1}. {item.description}
                    </Typography>
                    <Typography sx={{ color: "#888", fontSize: "0.9rem" }}>
                      Qty: {item.qty} × ${item.rate} = $
                      {(item.qty * item.rate).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Signature & Upload Form */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              backgroundColor: "#1A1A1A",
              border: "1px solid #333333",
              borderRadius: "12px",
            }}
          >
            <CardContent>
              <form onSubmit={handleSubmit}>
                {/* Signature Canvas */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    sx={{ color: "#8CE600", mb: 1.5, fontWeight: 600 }}
                  >
                    Your Signature *
                  </Typography>
                  <Paper
                    sx={{
                      backgroundColor: "#0F0F0F",
                      border: "2px dashed #8CE600",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <SignatureCanvas
                      ref={signatureCanvasRef}
                      penColor="#8CE600"
                      canvasProps={{
                        width: 300,
                        height: 150,
                        style: { backgroundColor: "#0F0F0F" },
                      }}
                    />
                  </Paper>
                  <Button
                    size="small"
                    onClick={clearSignature}
                    sx={{
                      mt: 1,
                      color: "#FF6B6B",
                      textTransform: "none",
                      "&:hover": { backgroundColor: "rgba(255, 107, 107, 0.1)" },
                    }}
                  >
                    Clear Signature
                  </Button>
                </Box>

                {/* File Uploads */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    sx={{ color: "#8CE600", mb: 1.5, fontWeight: 600 }}
                  >
                    Upload Documents *
                  </Typography>

                  {/* National ID Front */}
                  <Box sx={{ mb: 2 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "nationalIdFront")}
                      style={{ display: "none" }}
                      id="nationalIdFront-input"
                    />
                    <label htmlFor="nationalIdFront-input">
                      <Button
                        component="span"
                        variant="outlined"
                        fullWidth
                        startIcon={<Upload size={18} />}
                        sx={{
                          color: "#B0B0B0",
                          borderColor: "#333333",
                          textTransform: "none",
                          backgroundColor: "#0F0F0F",
                          "&:hover": {
                            borderColor: "#8CE600",
                            color: "#8CE600",
                            backgroundColor: "rgba(140, 230, 0, 0.05)",
                          },
                        }}
                      >
                        National ID (Front)
                      </Button>
                    </label>
                    <Typography sx={{ color: "#666", fontSize: "0.85rem", mt: 0.5 }}>
                      {fileNames.nationalIdFront}
                    </Typography>
                  </Box>

                  {/* National ID Back */}
                  <Box sx={{ mb: 2 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "nationalIdBack")}
                      style={{ display: "none" }}
                      id="nationalIdBack-input"
                    />
                    <label htmlFor="nationalIdBack-input">
                      <Button
                        component="span"
                        variant="outlined"
                        fullWidth
                        startIcon={<Upload size={18} />}
                        sx={{
                          color: "#B0B0B0",
                          borderColor: "#333333",
                          textTransform: "none",
                          backgroundColor: "#0F0F0F",
                          "&:hover": {
                            borderColor: "#8CE600",
                            color: "#8CE600",
                            backgroundColor: "rgba(140, 230, 0, 0.05)",
                          },
                        }}
                      >
                        National ID (Back)
                      </Button>
                    </label>
                    <Typography sx={{ color: "#666", fontSize: "0.85rem", mt: 0.5 }}>
                      {fileNames.nationalIdBack}
                    </Typography>
                  </Box>

                  {/* Payment Proof */}
                  <Box sx={{ mb: 2 }}>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "paymentProof")}
                      style={{ display: "none" }}
                      id="paymentProof-input"
                    />
                    <label htmlFor="paymentProof-input">
                      <Button
                        component="span"
                        variant="outlined"
                        fullWidth
                        startIcon={<Upload size={18} />}
                        sx={{
                          color: "#B0B0B0",
                          borderColor: "#333333",
                          textTransform: "none",
                          backgroundColor: "#0F0F0F",
                          "&:hover": {
                            borderColor: "#8CE600",
                            color: "#8CE600",
                            backgroundColor: "rgba(140, 230, 0, 0.05)",
                          },
                        }}
                      >
                        Payment Proof/Receipt
                      </Button>
                    </label>
                    <Typography sx={{ color: "#666", fontSize: "0.85rem", mt: 0.5 }}>
                      {fileNames.paymentProof}
                    </Typography>
                  </Box>
                </Box>

                {/* Notes */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add any additional notes (optional)"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  sx={{
                    mb: 3,
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#0F0F0F",
                      color: "#FFFFFF",
                      "& fieldset": { borderColor: "#333333" },
                      "&:hover fieldset": { borderColor: "#8CE600" },
                      "&.Mui-focused fieldset": { borderColor: "#8CE600" },
                    },
                  }}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={20} /> : <Send size={20} />}
                  sx={{
                    py: 1.5,
                    backgroundColor: "#8CE600",
                    color: "#000000",
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "1rem",
                    borderRadius: "8px",
                    "&:hover": {
                      backgroundColor: "#7BC500",
                    },
                    "&:disabled": {
                      backgroundColor: "#555",
                      color: "#999",
                    },
                  }}
                >
                  {submitting ? "Submitting..." : "Submit Signed Quotation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SignYourQuotation;

