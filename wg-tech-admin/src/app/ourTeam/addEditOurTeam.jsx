import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Divider,
  MenuItem,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Edit, Upload } from "lucide-react";
import TextInput from "../../components/textInput";
import CustomButton from "../../components/customButton";
import CustomSelect from "../../components/customSelect";
import { uploadImage } from "../../utils/upload";

const AddEditOurTeamDialog = ({
  open,
  onClose,
  onSave,
  editData = null,
  isEdit = false,
  roleOptions,
}) => {
  const SOCIALS = [
    { siteName: "Facebook", link: "" },
    { siteName: "Instagram", link: "" },
    { siteName: "LinkedIn", link: "" },
    { siteName: "X", link: "" },
  ];

  const [formData, setFormData] = useState({
    designation: "",
    name: "",
    department: "",
    shortDescription: "",
    url: SOCIALS,
    role: "",
    image: "",
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      if (isEdit && editData) {
        // map existing data into fixed socials
        const filledSocials = SOCIALS.map((item) => {
          const match = editData.url?.find((u) => u.siteName === item.siteName);
          return match || item;
        });

        setFormData({
          designation: editData.designation || "",
          name: editData.name || "",
          department: editData.department || "",
          shortDescription: editData.shortDescription || "",
          url: filledSocials,
          role: editData.role?._id || "",
          image: editData.image || "",
        });
      } else {
        setFormData({
          designation: "",
          name: "",
          department: "",
          shortDescription: "",
          url: SOCIALS,
          role: "",
          image: "",
        });
      }
      setErrors({});
    }
  }, [open, isEdit, editData]);

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

  const handleUrlChange = (index, field, value) => {
    const updatedUrls = [...formData.url];
    updatedUrls[index][field] = value;

    setFormData((prev) => ({
      ...prev,
      url: updatedUrls,
    }));
  };
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      const imageUrl = await uploadImage(file);
      setImagePreview(imageUrl);
      handleInputChange("image", imageUrl);
      if (errors.image) setErrors((prev) => ({ ...prev, image: "" }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        image: error.message || "Upload failed",
      }));
      setImagePreview("");
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.designation.trim()) newErrors.designation = "Designation is required";
    if (!formData.shortDescription.trim())
      newErrors.shortDescription = "Short description is required";
    if (!formData.role) newErrors.role = "Role is required";

    const hasAnyValidUrl = formData.url.some((u) => u.link.trim());
    if (!hasAnyValidUrl) newErrors.url = "At least one social URL is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setFormData({
      designation: "",
      name: "",
      department: "",
      shortDescription: "",
      url: SOCIALS,
      role: "",
      image: "",
    });
    setErrors({});
    onClose();
  };

  const handleSave = () => {
    if (!validateForm()) return;

    onSave(formData);
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#1A1A1A",
          borderRadius: "20px",
          border: "1px solid #333333",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
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
          >
            {/* HEADER */}
            <DialogTitle sx={{ p: 0 }}>
              <Box
                sx={{
                  background:
                    "linear-gradient(135deg,rgb(49, 46, 46) 0%,rgb(45, 45, 45) 100%)",
                  p: 1,
                  borderRadius: "20px 20px 0 0",
                  position: "relative",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    width={36}
                    height={36}
                    borderRadius={"8px"}
                    backgroundColor={"rgba(0,0,0,0.2)"}
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"center"}
                  >
                    {isEdit ? (
                      <Edit size={20} color="#fff" />
                    ) : (
                      <Plus size={24} color="#fff" />
                    )}
                  </Box>
                  <Box>
                    <Typography variant="h6">
                      {isEdit ? "Edit Team Member" : "Add New Team Member"}
                    </Typography>
                    <Typography variant="body2">
                      {isEdit
                        ? "Update team member information"
                        : "Create a new team member profile"}
                    </Typography>
                  </Box>
                </Box>

                <IconButton
                  onClick={handleClose}
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    color: "#fff",
                    backgroundColor: "rgba(0,0,0,0.1)",
                    "&:hover": {
                      backgroundColor: "rgba(0,0,0,0.2)",
                    },
                  }}
                >
                  <X size={18} />
                </IconButton>
              </Box>
              <Divider />
            </DialogTitle>

            {/* CONTENT */}
            <DialogContent sx={{ p: { xs: 2, sm: 4 }, mt: 2 }}>
              {/* Image Upload */}

              <Typography variant="body2" fontSize={12} color="#FFFFFF" sx={{ mb: 2 }}>
                Select Role *
              </Typography>
              <CustomSelect
                label="Role *"
                placeholder="Select a role"
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                error={errors.role}
                helperText={errors.role}
                inputBgColor="#2A2A2A"
                showLabel="Role *"
              >
                {roleOptions?.map((option) => (
                  <MenuItem key={option?._id} value={option?._id}>
                    {option?.role}
                  </MenuItem>
                ))}
              </CustomSelect>

              <Box>
                <Typography variant="body2" color="#FFFFFF" fontSize={12} sx={{ my: 2 }}>
                  Insert Image
                </Typography>
                <Box display={"flex"} gap={2} alignItems={"flex-start"}>
                  <label htmlFor="image-upload">
                    <Box
                      width={120}
                      height={120}
                      borderRadius="12px"
                      border={"2px dashed #333333"}
                      display={"flex"}
                      alignItems={"center"}
                      justifyContent={"center"}
                      backgroundColor="#2A2A2A"
                      overflow={"hidden"}
                      position={"relative"}
                      mt={1}
                      sx={{ cursor: "pointer" }}
                    >
                      {uploading ? (
                        <Box
                          display={"flex"}
                          flexDirection={"column"}
                          alignItems={"center"}
                          gap={1}
                        >
                          <CircularProgress
                            size={24}
                            sx={{ color: "#8CE600" }}
                          />
                          <Typography variant="caption" color="#8CE600">
                            Uploading...
                          </Typography>
                        </Box>
                      ) : imagePreview ? (
                        <Avatar
                          src={imagePreview}
                          alt="Preview"
                          sx={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "10px",
                          }}
                        />
                      ) : (
                        <Box
                          display={"flex"}
                          flexDirection={"column"}
                          alignItems={"center"}
                          gap={1}
                        >
                          <Upload size={24} color="#666666" />
                          <Typography variant="caption" color="#666666">
                            Click to Upload
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </label>

                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="image-upload"
                    type="file"
                    onChange={handleImageUpload}
                  />
                </Box>

                {errors.image && (
                  <Typography variant="caption" color="error">
                    {errors.image}
                  </Typography>
                )}
              </Box>
              <Box display={"flex"} flexDirection={"column"} gap={3} mt={2}>
                {/* NAME */}
                <TextInput
                  placeholder="Enter team member name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  error={errors.name}
                  helperText={errors.name}
                  showLabel="Name *"
                  inputBgColor="#2A2A2A"
                />

                {/* DEPARTMENT */}
                <TextInput
                  placeholder="Enter department (e.g., Department of AI)"
                  value={formData.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                  error={errors.department}
                  helperText={errors.department}
                  showLabel="Department (Optional)"
                  inputBgColor="#2A2A2A"
                />

                {/* DESIGNATION */}
                <TextInput
                  placeholder="Enter designation (e.g., HEADS OF DEPARTMENTS)"
                  value={formData.designation}
                  onChange={(e) => handleInputChange("designation", e.target.value)}
                  error={errors.designation}
                  helperText={errors.designation}
                  showLabel="Designation/Role Label *"
                  inputBgColor="#2A2A2A"
                />

                {/* ROLE */}

                {/* SHORT DESCRIPTION */}
                <TextInput
                  placeholder="Enter short description"
                  value={formData.shortDescription}
                  onChange={(e) =>
                    handleInputChange("shortDescription", e.target.value)
                  }
                  error={errors.shortDescription}
                  helperText={errors.shortDescription}
                  showLabel="Short Description *"
                  multiline
                  rows={3}
                  inputBgColor="#2A2A2A"
                />

                {/* SOCIAL LINKS */}
                <Box>
                  <Typography variant="body2" color="#FFFFFF" sx={{ mb: 2 }}>
                    Social Links *
                  </Typography>

                  {formData.url.map((url, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="body2" color="#BBB" sx={{ mb: 1 }}>
                        {url.siteName} URL
                      </Typography>

                      <TextInput
                        placeholder={`Enter ${url.siteName} URL`}
                        value={url.link}
                        onChange={(e) =>
                          handleUrlChange(index, "link", e.target.value)
                        }
                        inputBgColor="#2A2A2A"
                      />
                    </Box>
                  ))}

                  {errors.url && (
                    <Typography variant="caption" color="error">
                      {errors.url}
                    </Typography>
                  )}
                </Box>
              </Box>
            </DialogContent>

            {/* ACTIONS */}
            <DialogActions sx={{ p: 4, pt: 0 }}>
              <Box
                display="flex"
                gap={2}
                width="100%"
                justifyContent="flex-end"
              >
                <CustomButton
                  variant="gradientbtn"
                  btnLabel="Cancel"
                  handlePressBtn={handleClose}
                />

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CustomButton
                    variant="gradientbtn"
                    btnLabel={isEdit ? "Update Team Member" : "Add Team Member"}
                    handlePressBtn={handleSave}
                  />
                </motion.div>
              </Box>
            </DialogActions>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default AddEditOurTeamDialog;
