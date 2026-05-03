import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Avatar,
  Button,
  Divider,
  CircularProgress,
  Chip
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Plus, Edit, Trash2 } from "lucide-react";
import CustomSwitch from "../../components/switch";
import TextInput from "../../components/textInput";
import CustomButton from "../../components/customButton";
import { uploadImage } from "../../utils/upload";

const EMPTY_WORK_ITEM = { image: [], title: "", url: "", description: "", purpose: "", status: "Active" };

const createInitialFormState = () => ({
  workCategory: "",
  categoryDescription: "",
  status: "active",
  works: [{ ...EMPTY_WORK_ITEM }],
});

const AddEditWorkDialog = ({
  open,
  onClose,
  onSave,
  editData = null,
  isEdit = false,
  loading,
}) => {
  const [formData, setFormData] = useState(() => createInitialFormState());
  const [errors, setErrors] = useState({});
  const [uploadingImageIndex, setUploadingImageIndex] = useState({});

  useEffect(() => {
    if (open) {
      if (isEdit && editData) {
        setFormData({
          workCategory: editData.workCategory || "",
          categoryDescription: editData.categoryDescription || "",
          status: editData.status || "active",
          works: (editData.works && editData.works.length > 0
            ? editData.works
            : [{ ...EMPTY_WORK_ITEM }]).map((workItem) => ({
            image: Array.isArray(workItem.image) 
              ? workItem.image 
              : workItem.image 
                ? [workItem.image] 
                : [],
            title: workItem.title || "",
            url: workItem.url || "",
            description: workItem.description || "",
            purpose: workItem.purpose || "",
            status: workItem.status || "Active",
          })),
        });
      } else {
        setFormData(createInitialFormState());
      }
      setErrors({});
    }
  }, [open, isEdit, editData]);

  const resetForm = () => {
    setFormData(createInitialFormState());
    setErrors({});
  };

  const clearFieldError = (field) => {
    if (!errors[field]) return;
    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    clearFieldError(field);
  };


  const handleWorkChange = (index, field, value) => {
    const newWorks = [...formData.works];
    newWorks[index] = {
      ...newWorks[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      works: newWorks,
    }));
    if (["title", "url", "description", "image", "purpose", "status"].includes(field)) {
      clearFieldError(`work_${index}_${field}`);
    }
  };

  const handleImageUpload = async (index, event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const currentImages = Array.isArray(formData.works[index]?.image) 
      ? formData.works[index].image 
      : [];

    // Upload all selected files
    const uploadPromises = files.map(async (file, fileIndex) => {
      const uploadKey = `${index}_${fileIndex}`;
      try {
        setUploadingImageIndex((prev) => ({ ...prev, [uploadKey]: true }));
        const imageUrl = await uploadImage(file);
        return imageUrl;
      } catch (error) {
        console.error(`Error uploading image ${fileIndex}:`, error);
        throw error;
      } finally {
        setUploadingImageIndex((prev) => {
          const updated = { ...prev };
          delete updated[uploadKey];
          return updated;
        });
      }
    });

    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      const newImages = [...currentImages, ...uploadedUrls];
      handleWorkChange(index, "image", newImages);
      setErrors((prev) => {
        if (!prev[`work_${index}_image`]) return prev;
        const { [`work_${index}_image`]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [`work_${index}_image`]: error.message || "Upload failed",
      }));
    }
  };

  const removeImage = (workIndex, imageIndex) => {
    const currentImages = Array.isArray(formData.works[workIndex]?.image) 
      ? formData.works[workIndex].image 
      : [];
    const newImages = currentImages.filter((_, i) => i !== imageIndex);
    handleWorkChange(workIndex, "image", newImages);
  };

  const addWork = () => {
    setFormData((prev) => ({
      ...prev,
      works: [...prev.works, { ...EMPTY_WORK_ITEM }],
    }));
  };

  const removeWork = (index) => {
    if (formData.works.length > 1) {
      const newWorks = formData.works.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        works: newWorks,
      }));
      // Clean up uploading states for this work index
      setUploadingImageIndex((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (key.startsWith(`${index}_`)) {
            delete updated[key];
          }
        });
        return updated;
      });
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[`work_${index}_image`];
        delete updated[`work_${index}_title`];
        delete updated[`work_${index}_url`];
        delete updated[`work_${index}_description`];
        delete updated[`work_${index}_purpose`];
        return updated;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.workCategory.trim()) {
      newErrors.workCategory = "Work category is required";
    }

    // Validate works array
    const hasValidWork = formData.works.some(
      (work) => work.title.trim() && work.url.trim() && work.description.trim() && work.purpose.trim()
    );
    if (!hasValidWork) {
      newErrors.works = "At least one valid work is required";
    }

    // Validate each work
    formData.works.forEach((work, index) => {
      if (work.title.trim() && !work.url.trim()) {
        newErrors[`work_${index}_url`] = "URL is required";
      }
      if (work.title.trim() && !work.description.trim()) {
        newErrors[`work_${index}_description`] = "Description is required";
      }
      if (work.title.trim() && !work.purpose.trim()) {
        newErrors[`work_${index}_purpose`] = "Purpose is required";
      }
      if (work.url.trim() && !work.title.trim()) {
        newErrors[`work_${index}_title`] = "Title is required";
      }
      if (work.description.trim() && !work.title.trim()) {
        newErrors[`work_${index}_title`] = "Title is required";
      }
      if (work.purpose.trim() && !work.title.trim()) {
        newErrors[`work_${index}_title`] = "Title is required";
      }
      if (work.title.trim() && (!Array.isArray(work.image) || work.image.length === 0)) {
        newErrors[`work_${index}_image`] = "At least one image is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      // Filter out empty works before saving
      const filteredWorks = formData.works.filter(
        (work) =>
          work.title.trim() && work.url.trim() && work.description.trim() && work.purpose.trim()
      );
      const dataToSave = {
        ...formData,
        works: filteredWorks,
      };
      onSave(dataToSave);
      onClose();
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
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
            {/* Dialog Header */}
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
                      {isEdit ? "Edit Work Category" : "Add New Work Category"}
                    </Typography>
                    <Typography variant="body2">
                      {isEdit
                        ? "Update work category information"
                        : "Create a new work category with multiple projects"}
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

            {/* Dialog Content */}
            <DialogContent sx={{ p: 4 }}>
              <Box display={"flex"} flexDirection={"column"} gap={3} mt={2}>
                {/* Work Category Field */}
                <Box>
                  <TextInput
                    placeholder="Enter work category name (e.g., Portfolio Projects)"
                    value={formData.workCategory}
                    onChange={(event) =>
                      handleFieldChange("workCategory", event.target.value)
                    }
                    error={errors.workCategory}
                    helperText={errors.workCategory}
                    showLabel="Work Category *"
                    inputBgColor="#2A2A2A"
                  />
                </Box>

                {/* Category Description Field */}
                <Box>
                  <TextInput
                    placeholder="Enter category description"
                    value={formData.categoryDescription}
                    onChange={(event) =>
                      handleFieldChange("categoryDescription", event.target.value)
                    }
                    error={errors.categoryDescription}
                    helperText={errors.categoryDescription}
                    showLabel="Category Description"
                    multiline={true}
                    rows={3}
                    inputBgColor="#2A2A2A"
                  />
                </Box>

                {/* Status Switch for Category */}
                <Box>
                  <Typography variant="body2" color="#FFFFFF">
                    Category Status
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mt: 1,
                    }}
                  >
                    <CustomSwitch
                      checked={formData.status === "active"}
                      onChange={(e) =>
                        handleFieldChange(
                          "status",
                          e.target.checked ? "active" : "inactive"
                        )
                      }
                      showLabel={false}
                    />
                    <Chip
                      label={formData.status}
                      sx={{
                        backgroundColor:
                          formData.status === "active" ? "#8CE600" : "#FF5050",
                        color: formData.status === "active" ? "#000" : "#FFF",
                        fontWeight: 600,
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    />
                  </Box>
                </Box>

                {/* Works Section */}
                <Box>
                  <Typography variant="body2" color="#FFFFFF" sx={{ mb: 2 }}>
                    Projects/Works *
                  </Typography>

                  {formData.works.map((work, index) => (
                    <Box
                      key={index}
                      sx={{
                        border: "1px solid #333333",
                        borderRadius: "12px",
                        p: 3,
                        mb: 2,
                        backgroundColor: "#2A2A2A",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <Typography variant="subtitle2" color="#FFFFFF">
                          Work {index + 1}
                        </Typography>
                        {formData.works.length > 1 && (
                          <Button
                            onClick={() => removeWork(index)}
                            sx={{
                              minWidth: "auto",
                              p: 1,
                              color: "#ff4444",
                              "&:hover": {
                                backgroundColor: "rgba(255, 68, 68, 0.1)",
                              },
                            }}
                          >
                            <Trash2 size={20} />
                          </Button>
                        )}
                      </Box>

                      {/* Images Section */}
                      <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="body2"
                            color="#FFFFFF"
                            sx={{ mb: 1 }}
                          >
                          Images (Multiple)
                          </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 2,
                            mb: 2,
                          }}
                        >
                          {/* Display existing images */}
                          {Array.isArray(work.image) && work.image.length > 0
                            ? work.image.map((imgUrl, imgIndex) => (
                                <Box
                                  key={imgIndex}
                                  sx={{
                                    position: "relative",
                                    width: 100,
                                    height: 100,
                                  }}
                                >
                                  <Avatar
                                    src={imgUrl}
                                    alt={`Work Image ${imgIndex + 1}`}
                                    sx={{
                                      width: "100%",
                                      height: "100%",
                                      borderRadius: "12px",
                                      border: "2px solid #333333",
                                    }}
                                  />
                                  <IconButton
                                    onClick={() => removeImage(index, imgIndex)}
                                    sx={{
                                      position: "absolute",
                                      top: -8,
                                      right: -8,
                                      width: 24,
                                      height: 24,
                                      backgroundColor: "#ff4444",
                                      color: "#fff",
                                      "&:hover": {
                                        backgroundColor: "#cc0000",
                                      },
                                    }}
                                  >
                                    <X size={14} />
                                  </IconButton>
                                </Box>
                              ))
                            : null}

                          {/* Upload button */}
                          <label htmlFor={`image-upload-${index}`}>
                            <Box
                              width={100}
                              height={100}
                              borderRadius="12px"
                              border={"2px dashed #333333"}
                              display={"flex"}
                              flexDirection={"column"}
                              alignItems={"center"}
                              justifyContent={"center"}
                              backgroundColor="#1A1A1A"
                              position={"relative"}
                              sx={{
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                "&:hover": {
                                  borderColor: "#8CE600",
                                  backgroundColor: "#2A2A2A",
                                },
                              }}
                            >
                              <Upload size={24} color="#8CE600" />
                              <Typography
                                variant="caption"
                                color="#8CE600"
                                sx={{ mt: 0.5, fontSize: "10px" }}
                              >
                                Add Images
                              </Typography>
                              {Object.keys(uploadingImageIndex).some(
                                (key) => key.startsWith(`${index}_`)
                              ) && (
                                <Box
                                  position="absolute"
                                  top={0}
                                  left={0}
                                  width="100%"
                                  height="100%"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  sx={{
                                    backgroundColor: "rgba(0,0,0,0.7)",
                                    borderRadius: "12px",
                                  }}
                                >
                                  <CircularProgress
                                    size={24}
                                    sx={{ color: "#8CE600" }}
                                  />
                                </Box>
                              )}
                            </Box>
                          </label>

                          <input
                            accept="image/*"
                            style={{ display: "none" }}
                            id={`image-upload-${index}`}
                            type="file"
                            multiple
                            onChange={(e) => handleImageUpload(index, e)}
                          />
                        </Box>
                          {errors[`work_${index}_image`] && (
                            <Typography
                              variant="caption"
                              color="#ff4444"
                              sx={{ display: "block", mt: 1 }}
                            >
                              {errors[`work_${index}_image`]}
                            </Typography>
                          )}
                        </Box>

                      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>

                        {/* Title, URL and Description */}
                        <Box sx={{ flex: 1 }}>
                          <TextInput
                            placeholder="Enter work title"
                            value={work.title}
                            onChange={(e) =>
                              handleWorkChange(index, "title", e.target.value)
                            }
                            error={errors[`work_${index}_title`]}
                            helperText={errors[`work_${index}_title`]}
                            showLabel="Work Title *"
                            inputBgColor="#1A1A1A"
                            sx={{ mb: 2 }}
                          />

                          <TextInput
                            placeholder="Enter work/project URL"
                            value={work.url}
                            onChange={(e) =>
                              handleWorkChange(index, "url", e.target.value)
                            }
                            error={errors[`work_${index}_url`]}
                            helperText={errors[`work_${index}_url`]}
                            showLabel="Project URL *"
                            inputBgColor="#1A1A1A"
                            sx={{ mb: 2 }}
                          />

                          <TextInput
                            placeholder="Enter work description"
                            value={work.description}
                            onChange={(e) =>
                              handleWorkChange(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            error={errors[`work_${index}_description`]}
                            helperText={errors[`work_${index}_description`]}
                            showLabel="Description *"
                            multiline={true}
                            rows={3}
                            inputBgColor="#1A1A1A"
                            sx={{ mb: 2 }}
                          />

                          <TextInput
                            placeholder="Enter purpose of this work"
                            value={work.purpose}
                            onChange={(e) =>
                              handleWorkChange(
                                index,
                                "purpose",
                                e.target.value
                              )
                            }
                            error={errors[`work_${index}_purpose`]}
                            helperText={errors[`work_${index}_purpose`]}
                            showLabel="Purpose *"
                            multiline={true}
                            rows={3}
                            inputBgColor="#1A1A1A"
                          />

                          {/* Work Status Switch */}
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="#FFFFFF">
                              Work Status
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                mt: 1,
                              }}
                            >
                              <CustomSwitch
                                checked={work.status === "Active" || work.status === "active"}
                                onChange={(e) =>
                                  handleWorkChange(
                                    index,
                                    "status",
                                    e.target.checked ? "Active" : "Inactive"
                                  )
                                }
                                showLabel={false}
                              />
                              <Chip
                                label={work.status || "Active"}
                                sx={{
                                  backgroundColor:
                                    (work.status === "Active" || work.status === "active") ? "#8CE600" : "#FF5050",
                                  color: (work.status === "Active" || work.status === "active") ? "#000" : "#FFF",
                                  fontWeight: 600,
                                  fontSize: "12px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  ))}

                  <Button
                    onClick={addWork}
                    startIcon={<Plus size={16} />}
                    sx={{
                      color: "#8CE600",
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: "rgba(140, 230, 0, 0.1)",
                      },
                    }}
                  >
                    Add Another Work
                  </Button>

                  {errors.works && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 1, display: "block" }}
                    >
                      {errors.works}
                    </Typography>
                  )}
                </Box>
              </Box>
            </DialogContent>

            {/* Dialog Actions */}
            <DialogActions sx={{ p: 4, pt: 0 }}>
              <Box
                display={"flex"}
                gap={2}
                width={"100%"}
                justifyContent={"flex-end"}
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
                    btnLabel={
                      isEdit ? "Update Work Category" : "Add Work Category"
                    }
                    handlePressBtn={handleSave}
                    loading={loading}
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

export default AddEditWorkDialog;
