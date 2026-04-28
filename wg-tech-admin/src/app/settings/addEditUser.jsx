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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Edit } from "lucide-react";
import TextInput from "../../components/textInput";
import CustomButton from "../../components/customButton";
import { CustomSelect } from "../../components";
import ClientAssignmentField from "../../components/ClientAssignmentField";

const AddEditUserDialog = ({
  open,
  onClose,
  onSave,
  editData = null,
  isEdit = false,
  roles = [],
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    username: "",
    userEmail: "",
    password: "",
    designation: null,
    assignedClients: [],
  });
  const [errors, setErrors] = useState({});

  // AppRole removed

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (isEdit && editData) {
        setFormData({
          username: editData.username || "",
          userEmail: editData.email || "",
          password: "",
          designation: editData.designation || null,
          assignedClients: (editData.assignedClients || []).map((client) =>
            typeof client === "string" ? client : client._id,
          ),
        });
      } else {
        setFormData({
          username: "",
          userEmail: "",
          password: "",
          designation: null,
          assignedClients: [],
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.userEmail.trim()) {
      newErrors.userEmail = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.userEmail)) {
      newErrors.userEmail = "Please enter a valid email address";
    }

    if (!isEdit || (isEdit && formData.password)) {
      if (!formData.password.trim()) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters long";
      }
    }

    if (!formData.designation || !formData.designation._id) {
      newErrors.designation = "Designation (UserRole) is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(
        {
          ...formData,
        },
        editData?._id
      );
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      username: "",
      userEmail: "",
      password: "",
      designation: null,
      assignedClients: [],
    });
    setErrors({});
    onClose();
  };

  const selectedRoleName = String(formData.designation?.roleName || "").toLowerCase();
  const isWorker = selectedRoleName === "worker";

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
                      {isEdit ? "Edit User" : "Add New User"}
                    </Typography>
                    <Typography variant="body2">
                      {isEdit
                        ? "Update user information and role"
                        : "Create a new user account with specific role"}
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
                {/* Username Field */}
                <Box>
                  <TextInput
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    error={errors.username}
                    helperText={errors.username}
                    showLabel="Username *"
                    inputBgColor="#2A2A2A"
                  />
                </Box>

                {/* Email Field */}
                <Box>
                  <TextInput
                    placeholder="Enter email address"
                    value={formData.userEmail}
                    onChange={(e) =>
                      handleInputChange("userEmail", e.target.value)
                    }
                    error={errors.userEmail}
                    helperText={errors.userEmail}
                    showLabel="Email Address *"
                    inputBgColor="#2A2A2A"
                    type="email"
                  />
                </Box>

                {/* Password Field */}
                <Box>
                  <TextInput
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    error={errors.password}
                    helperText={errors.password}
                    showLabel="Password *"
                    inputBgColor="#2A2A2A"
                    type="password"
                  />
                </Box>

                {/* Designation (UserRole) */}
                <Box>
                  <Typography variant="body2" color="#FFFFFF" sx={{ mb: 2 }}>
                    Designation (UserRole) *
                  </Typography>
                  <CustomSelect
                    value={formData.designation?._id || ""}
                    onChange={(e) => {
                      const id = e.target.value;
                      const selected = roles.find((r) => r._id === id) || null;
                      setFormData((prev) => ({
                        ...prev,
                        designation: selected,
                        assignedClients:
                          String(selected?.roleName || "").toLowerCase() === "worker"
                            ? prev.assignedClients
                            : [],
                      }));
                    }}
                    label="Designation *"
                    sx={{
                      color: "#FFFFFF",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#444444",
                      },
                    }}
                  >
                    {roles.map((r) => (
                      <MenuItem key={r._id} value={r._id}>
                        {r.roleName}
                      </MenuItem>
                    ))}
                  </CustomSelect>
                  {errors.designation && (
                    <Typography
                      variant="caption"
                      sx={{ color: "#f44336", mt: 1, ml: 2 }}
                    >
                      {errors.designation}
                    </Typography>
                  )}
                </Box>

                {isWorker && (
                  <ClientAssignmentField
                    value={formData.assignedClients}
                    onChange={(value) =>
                      handleInputChange("assignedClients", value)
                    }
                    error={errors.assignedClients}
                    helperText={errors.assignedClients}
                    disabled={isSubmitting}
                  />
                )}
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
                  disabled={isSubmitting}
                />

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CustomButton
                    variant="gradientbtn"
                    btnLabel={
                      isSubmitting
                        ? isEdit
                          ? "Updating..."
                          : "Creating..."
                        : isEdit
                        ? "Update User"
                        : "Add User"
                    }
                    handlePressBtn={handleSave}
                    disabled={isSubmitting}
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

export default AddEditUserDialog;
