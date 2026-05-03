import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { X, Download } from "lucide-react";
import axios from "axios";
import { useSnackbar } from "notistack";
import { baseUrl } from "../../api";

const AdminQuotationProofsModal = ({
  open,
  onClose,
  quotationId,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [previewAssets, setPreviewAssets] = useState({});

  const resolveFileUrl = (filePath) => {
    if (!filePath) return null;
    if (/^data:/i.test(filePath)) return filePath;
    if (/^https?:\/\//i.test(filePath)) return filePath;

    const backendOrigin = baseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
    const normalizedPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
    return `${backendOrigin}${normalizedPath}`;
  };

  const detectFileKind = (source, mime = "") => {
    const normalizedSource = String(source || "").toLowerCase();
    const normalizedMime = String(mime || "").toLowerCase();

    const isImageByMime = normalizedMime.startsWith("image/");
    const isPdfByMime = normalizedMime.includes("pdf");

    const isImageByPath =
      /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(normalizedSource) ||
      normalizedSource.includes("/uploads/signatures/") ||
      normalizedSource.startsWith("data:image/") ||
      /\/image\/upload\//i.test(normalizedSource);

    const isPdfByPath =
      /\.pdf(\?|#|$)/i.test(normalizedSource) ||
      normalizedSource.startsWith("data:application/pdf") ||
      /\/raw\/upload\//i.test(normalizedSource);

    return {
      isImage: isImageByMime || (!isPdfByMime && isImageByPath),
      isPdf: isPdfByMime || (!isImageByMime && isPdfByPath),
    };
  };

  useEffect(() => {
    if (open && quotationId) {
      fetchQuotation();
    }
  }, [open, quotationId]);

  useEffect(() => {
    return () => {
      Object.values(previewAssets).forEach((asset) => {
        if (asset?.isBlobUrl && asset?.src) {
          URL.revokeObjectURL(asset.src);
        }
      });
    };
  }, [previewAssets]);

  const fetchQuotation = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${baseUrl}v1/quotations/${quotationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("authToken")}`,
          },
        }
      );
      setQuotation(response.data?.data || null);
    } catch (error) {
      console.error("Error fetching quotation:", error);
      enqueueSnackbar("Failed to load quotation details", { variant: "error" });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (url, filename) => {
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  const preloadProofAsset = async (key, filePath) => {
    const fileUrl = resolveFileUrl(filePath);
    if (!fileUrl) return;

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Unable to load proof");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const mime = String(blob.type || "").toLowerCase();
      const kind = detectFileKind(fileUrl, mime);

      setPreviewAssets((prev) => {
        if (prev[key]?.isBlobUrl && prev[key]?.src) {
          URL.revokeObjectURL(prev[key].src);
        }
        return {
          ...prev,
          [key]: {
            src: blobUrl,
            mime,
            isImage: kind.isImage,
            isPdf: kind.isPdf,
            isBlobUrl: true,
          },
        };
      });
    } catch (error) {
      const kind = detectFileKind(fileUrl);
      // Fall back to direct URL preview if blob fetch fails.
      setPreviewAssets((prev) => ({
        ...prev,
        [key]: {
          src: fileUrl,
          mime: "",
          isImage: kind.isImage,
          isPdf: kind.isPdf,
          isBlobUrl: false,
        },
      }));
    }
  };

  useEffect(() => {
    if (!quotation?.clientSubmission || !open) return;

    const submission = quotation.clientSubmission;
    preloadProofAsset("signature", submission.signature);
    preloadProofAsset("nationalIdFront", submission.nationalIdFront);
    preloadProofAsset("nationalIdBack", submission.nationalIdBack);
    preloadProofAsset("paymentProof", submission.paymentProof);
  }, [quotation, open]);

  const renderProofPreview = (key, filePath, title, downloadName) => {
    const fileUrl = resolveFileUrl(filePath);
    if (!fileUrl) return null;

    const asset = previewAssets[key] || {};
    const previewSrc = asset.src || fileUrl;
    const fallbackKind = detectFileKind(previewSrc, asset.mime);
    const imageFile = Boolean(asset.isImage || fallbackKind.isImage);
    const pdfFile = Boolean(asset.isPdf || fallbackKind.isPdf);
    return (
      <Card 
        variant="outlined" 
        sx={{ 
          borderRadius: 3, 
          backgroundColor: "#1e1e1e", 
          borderColor: "#333", 
          color: "#fff", 
          overflow: "hidden",
          height: "450px",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <CardContent sx={{ p: 2, display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", pr: 2 }}>
              {title}
            </Typography>
            <IconButton
              size="small"
              onClick={() => handleDownload(fileUrl, downloadName)}
              title="Download"
              sx={{ color: "#9EFF00", backgroundColor: "rgba(158, 255, 0, 0.1)", "&:hover": { backgroundColor: "rgba(158, 255, 0, 0.2)" }, flexShrink: 0 }}
            >
              <Download size={16} />
            </IconButton>
          </div>

          <Box sx={{ 
            flexGrow: 1, 
            backgroundColor: "#2a2a2a", 
            borderRadius: 2, 
            p: 1, 
            border: "1px solid #333", 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center",
            overflow: "hidden" 
          }}>
            {imageFile && (
              <img
                src={previewSrc}
                alt={title}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "4px" }}
              />
            )}

            {pdfFile && (
              <object
                data={previewSrc}
                type="application/pdf"
                style={{ width: "100%", height: "100%", border: "none", borderRadius: "4px" }}
              >
                <iframe
                  src={previewSrc}
                  title={title}
                  style={{ width: "100%", height: "100%", border: "none", borderRadius: "4px" }}
                />
              </object>
            )}

            {!imageFile && !pdfFile && (
              <iframe
                src={previewSrc}
                title={title}
                style={{ width: "100%", height: "100%", border: "none", borderRadius: "4px" }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const handleConfirmSubmission = async () => {
    if (!quotationId) return;

    try {
      setConfirming(true);
      await axios.put(
        `${baseUrl}v1/quotations/${quotationId}/confirm`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("authToken")}`,
          },
        }
      );

      enqueueSnackbar("Submission confirmed and client notified", { variant: "success" });
      fetchQuotation();
    } catch (error) {
      console.error("Error confirming submission:", error);
      enqueueSnackbar(error?.response?.data?.message || "Failed to confirm submission", {
        variant: "error",
      });
    } finally {
      setConfirming(false);
    }
  };

  if (!quotation && loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent className="flex items-center justify-center py-12">
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  const clientSubmission = quotation?.clientSubmission;
  const isSubmissionConfirmed = Boolean(quotation?.submissionConfirmation?.confirmedAt);
  const hasProofs = clientSubmission && (
    clientSubmission.signature ||
    clientSubmission.nationalIdFront ||
    clientSubmission.nationalIdBack ||
    clientSubmission.paymentProof
  );

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="xl" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#1e1e1e",
            color: "#fff",
            border: "1px solid #333",
            borderRadius: "12px",
          }
        }}
      >
        <DialogTitle sx={{ 
          color: "#fff", 
          pt: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%"
        }}>
          <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>Quotation Proofs & Documentation - Inline Auto Preview</span>
          <IconButton 
            onClick={onClose} 
            size="small" 
            sx={{ 
              color: "#aaa", 
              ml: 2,
              "&:hover": { color: "#fff", backgroundColor: "rgba(255, 255, 255, 0.1)" } 
            }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <Divider sx={{ borderColor: "#333" }} />

        <DialogContent className="py-6" sx={{ maxHeight: "85vh", backgroundColor: "#121212" }}>
          {!hasProofs ? (
            <Alert severity="info" sx={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.2)", "& .MuiAlert-icon": { color: "#60a5fa" } }}>
              The client has not yet submitted their signature and documentation.
            </Alert>
          ) : (
            <Box className="space-y-6">
              <Alert severity="success" sx={{ backgroundColor: "rgba(158, 255, 0, 0.1)", color: "#9EFF00", border: "1px solid rgba(158, 255, 0, 0.2)", "& .MuiAlert-icon": { color: "#9EFF00" } }}>
                Auto Preview Mode: All submitted proofs are shown below without opening each file manually.
              </Alert>

              {/* Submitted Proofs */}
              {clientSubmission && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="h6" className="font-semibold" sx={{ color: "#fff", mt: 2 }}>
                    Client Submitted Proofs
                  </Typography>

                  <Divider sx={{ borderColor: "#333", mb: 3, mt: 1 }} />

                  <Grid container spacing={3}>
                    {/* E-Signature */}
                    <Grid item xs={12}>
                      {clientSubmission.signature ? (
                        renderProofPreview(
                          "signature",
                          clientSubmission.signature,
                          "E-Signature",
                          "signature.png"
                        )
                      ) : (
                        <Alert severity="warning" sx={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.2)", "& .MuiAlert-icon": { color: "#fbbf24" } }}>
                          Signature file is missing in this submission record.
                        </Alert>
                      )}
                    </Grid>

                    {/* National ID */}
                    {clientSubmission.nationalIdFront && (
                      <Grid item xs={12} md={6}>
                        {renderProofPreview(
                          "nationalIdFront",
                          clientSubmission.nationalIdFront,
                          "National ID - Front",
                          "id-front"
                        )}
                      </Grid>
                    )}
                    
                    {clientSubmission.nationalIdBack && (
                      <Grid item xs={12} md={6}>
                        {renderProofPreview(
                          "nationalIdBack",
                          clientSubmission.nationalIdBack,
                          "National ID - Back",
                          "id-back"
                        )}
                      </Grid>
                    )}

                    {/* Payment Proof */}
                    {clientSubmission.paymentProof && (
                      <Grid item xs={12}>
                        {renderProofPreview(
                          "paymentProof",
                          clientSubmission.paymentProof,
                          "Advance Payment Proof",
                          "payment-proof"
                        )}
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <Divider sx={{ borderColor: "#333" }} />

        <DialogActions className="p-4" sx={{ backgroundColor: "#1e1e1e" }}>
          {hasProofs && !isSubmissionConfirmed && (
            <Button 
              onClick={handleConfirmSubmission} 
              variant="contained" 
              disabled={confirming}
              sx={{ backgroundColor: "#9EFF00", color: "#000", fontWeight: 600, padding: "8px 24px", "&:hover": { backgroundColor: "#85d600" } }}
            >
              {confirming ? "Confirming..." : "Confirm Submission"}
            </Button>
          )}
          <Button 
            onClick={onClose} 
            variant="outlined"
            sx={{ color: "#ccc", borderColor: "#555", padding: "8px 24px", "&:hover": { backgroundColor: "#2a2a2a", borderColor: "#fff", color: "#fff" } }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminQuotationProofsModal;
