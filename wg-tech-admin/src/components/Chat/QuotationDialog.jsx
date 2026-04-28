import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Divider,
  CircularProgress,
  IconButton,
  Alert,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import CustomButton from "../customButton";
import TextInput from "../textInput";
import TextEditor from "../textEditor";
import axios from "axios";
import { useSnackbar } from "notistack";
import { baseUrl } from "../../api";

const toPlainText = (value) => {
  if (!value) return "";
  if (typeof window === "undefined") return String(value);
  const container = document.createElement("div");
  container.innerHTML = String(value);
  return (container.textContent || container.innerText || "").trim();
};

const defaultFormData = {
  title: "",
  longDescription: "",
};

const QuotationDialog = ({ open, onClose, clientId, onQuotationSent }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title?.trim()) {
      newErrors.title = "Quotation title is required";
    }

    if (!toPlainText(formData.longDescription)) {
      newErrors.longDescription = "Detailed description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      enqueueSnackbar("Please fill all required fields", { variant: "error" });
      return;
    }

    setLoading(true);

    try {
      const shortDescription = toPlainText(formData.longDescription).slice(
        0,
        160,
      );
      const formattedItems = [
        {
          description: formData.title,
          qty: 1,
          rate: 0,
        },
      ];

      const response = await axios.post(
        `${baseUrl}v1/quotations`,
        {
          clientId,
          items: formattedItems,
          description: formData.longDescription,
          notes: "Created from simplified quotation form",
          title: formData.title,
          subTitle: "",
          shortDescription,
          longDescription: formData.longDescription,
          currency: "PKR",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const createdQuotation = response?.data?.data;
      if (!createdQuotation?._id) {
        throw new Error(
          "Quotation created but ID is missing in server response",
        );
      }

      await axios.post(
        `${baseUrl}v1/quotations/${createdQuotation._id}/send`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      enqueueSnackbar("Quotation sent successfully!", { variant: "success" });
      onQuotationSent?.(createdQuotation);
      handleClose();
    } catch (error) {
      enqueueSnackbar(
        error.response?.data?.message || "Failed to send quotation",
        {
          variant: "error",
        },
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        },
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ width: "100%", display: "flex", flexDirection: "column" }}
          >
            <DialogTitle
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                pb: 1,
                flexShrink: 0,
              }}
            >
              <Box>
                <Typography variant="h6" className="font-bold">
                  Create and Send Quotation
                </Typography>
                <Typography variant="caption" className="text-gray-600">
                  Only title and detailed description are required.
                </Typography>
              </Box>
              <IconButton onClick={handleClose} size="small">
                <X size={20} />
              </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent
              className="space-y-4 py-6"
              sx={{ overflow: "auto", pb: 2, flex: 1 }}
            >
              <Alert severity="info" className="mb-4">
                Quotation item lines are now auto-generated in the background
                for API compatibility.
              </Alert>

              <Box
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#ffffff !important",
                  },
                  "& .MuiOutlinedInput-input": {
                    color: "#111827 !important",
                  },
                  "& .MuiOutlinedInput-input::placeholder": {
                    color: "#9ca3af !important",
                    opacity: 1,
                  },
                }}
              >
                <TextInput
                  placeholder="Enter quotation title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  error={errors.title}
                  helperText={errors.title}
                  showLabel="Title *"
                  inputBgColor="#FFFFFF"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      border: "1px solid #d0d5dd",
                      backgroundColor: "#ffffff !important",
                    },
                    "& .MuiInputBase-input": {
                      color: "#111827 !important",
                      "&::placeholder": {
                        color: "#9ca3af !important",
                        opacity: 1,
                      },
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  className="font-semibold mb-2 block"
                >
                  Detailed Description *
                </Typography>
                <TextEditor
                  value={formData.longDescription}
                  onChange={(value) =>
                    handleInputChange("longDescription", value)
                  }
                  placeholder="Describe the quotation details"
                  lightTheme
                />
                {errors.longDescription && (
                  <Typography color="error" variant="caption">
                    {errors.longDescription}
                  </Typography>
                )}
              </Box>
            </DialogContent>

            <Divider />

            <DialogActions
              sx={{
                flexShrink: 0,
                padding: "16px",
                backgroundColor: "#f9f9f9",
                gap: 2,
                justifyContent: "flex-end",
              }}
            >
              <Button
                onClick={handleClose}
                disabled={loading}
                sx={{ textTransform: "none" }}
              >
                Cancel
              </Button>
              <CustomButton
                btnLabel={loading ? "Sending..." : "Send Quotation"}
                handlePressBtn={handleSubmit}
                disabled={loading}
                loading={loading}
                variant="contained"
                btnBgColor="#8CE600"
                btnHoverColor="#7BCC00"
                btnTextColor="#ffffff"
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  padding: "8px 24px",
                }}
              />
            </DialogActions>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default QuotationDialog;
