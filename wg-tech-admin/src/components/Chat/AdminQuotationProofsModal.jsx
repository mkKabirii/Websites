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
    const previewHeight = imageFile ? "420px" : "560px";

    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <Typography variant="subtitle2" className="font-semibold">
              {title}
            </Typography>
            <IconButton
              size="small"
              onClick={() => handleDownload(fileUrl, downloadName)}
              title="Download"
            >
              <Download size={16} />
            </IconButton>
          </div>

          {imageFile && (
            <Box sx={{ backgroundColor: "#f5f5f5", borderRadius: 2, p: 1 }}>
              <img
                src={previewSrc}
                alt={title}
                style={{ width: "100%", height: previewHeight, objectFit: "contain", borderRadius: "8px" }}
              />
            </Box>
          )}

          {pdfFile && (
            <Box sx={{ backgroundColor: "#f5f5f5", borderRadius: 2, p: 1, height: previewHeight }}>
              <object
                data={previewSrc}
                type="application/pdf"
                style={{ width: "100%", height: "100%", border: "none", borderRadius: "8px" }}
              >
                <iframe
                  src={previewSrc}
                  title={title}
                  style={{ width: "100%", height: "100%", border: "none", borderRadius: "8px" }}
                />
              </object>
            </Box>
          )}

          {!imageFile && !pdfFile && (
            <Box sx={{ backgroundColor: "#f5f5f5", borderRadius: 2, p: 1, height: previewHeight }}>
              <iframe
                src={previewSrc}
                title={title}
                style={{ width: "100%", height: "100%", border: "none", borderRadius: "8px" }}
              />
            </Box>
          )}
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
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
        <DialogTitle>
          <div className="flex items-center justify-between">
            <span>Quotation Proofs & Documentation - Inline Auto Preview</span>
            <IconButton onClick={onClose} size="small">
              <X size={20} />
            </IconButton>
          </div>
        </DialogTitle>

        <Divider />

        <DialogContent className="py-6" sx={{ maxHeight: "85vh", backgroundColor: "#fafafa" }}>
          {!hasProofs ? (
            <Alert severity="info">
              The client has not yet submitted their signature and documentation.
            </Alert>
          ) : (
            <Box className="space-y-6">
              <Alert severity="success">
                Auto Preview Mode: All submitted proofs are shown below without opening each file manually.
              </Alert>

              {/* Submitted Proofs */}
              {clientSubmission && (
                <Box className="space-y-4">
                  <Typography variant="h6" className="font-semibold">
                    Client Submitted Proofs
                  </Typography>

                  <Divider />

                  {/* E-Signature */}
                  {clientSubmission.signature ? (
                    renderProofPreview(
                      "signature",
                      clientSubmission.signature,
                      "E-Signature",
                      "signature.png"
                    )
                  ) : (
                    <Alert severity="warning">
                      Signature file is missing in this submission record.
                    </Alert>
                  )}

                  {/* National ID */}
                  {(clientSubmission.nationalIdFront || clientSubmission.nationalIdBack) && (
                    <Grid container spacing={2}>
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
                    </Grid>
                  )}

                  {/* Payment Proof */}
                  {clientSubmission.paymentProof && (
                    renderProofPreview(
                      "paymentProof",
                      clientSubmission.paymentProof,
                      "Advance Payment Proof",
                      "payment-proof"
                    )
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <Divider />

        <DialogActions className="p-4">
          {hasProofs && !isSubmissionConfirmed && (
            <Button onClick={handleConfirmSubmission} variant="contained" disabled={confirming}>
              {confirming ? "Confirming..." : "Confirm Submission"}
            </Button>
          )}
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminQuotationProofsModal;
