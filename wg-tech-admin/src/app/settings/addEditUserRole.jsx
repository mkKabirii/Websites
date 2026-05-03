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
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Edit } from "lucide-react";
import TextInput from "../../components/textInput";
import CustomButton from "../../components/customButton";
import DesignationPermissions from "./rolePermissions";
import { ADMIN_ROUTES } from "../../routes";

const AddEditUserRoleDialog = ({
  open,
  onClose,
  onSave,
  editData = null,
  isEdit = false,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    roleName: "",
    routes: [],
  });
  const [errors, setErrors] = useState({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (isEdit && editData) {
        setFormData({
          roleName: editData.roleName || "",
          routes: editData.routes || [],
        });
      } else {
        setFormData({
          roleName: "",
          routes: [],
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

  const handlePermissionsChange = (updatedRoutes) => {
    setFormData((prev) => ({
      ...prev,
      routes: updatedRoutes,
    }));

    if (errors.routes) {
      setErrors((prev) => ({
        ...prev,
        routes: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.roleName.trim()) {
      newErrors.roleName = "Role name is required";
    }

    if (!formData.routes || formData.routes.length === 0) {
      newErrors.routes = "At least one module must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const payload = {
      roleName: formData.roleName.trim(),
      routes: formData.routes,
    };

    await onSave?.(payload, editData?._id);
  };

  const handleClose = () => {
    setFormData({
      roleName: "",
      routes: [],
    });
    setErrors({});
    onClose();
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
                      {isEdit ? "Edit User Role" : "Add New User Role"}
                    </Typography>
                    <Typography variant="body2">
                      {isEdit
                        ? "Update role information and permissions"
                        : "Create a new role with specific page access"}
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
                {/* Role Name Field */}
                <Box>
                  <TextInput
                    placeholder="Enter role name"
                    value={formData.roleName}
                    onChange={(e) => handleInputChange("roleName", e.target.value)}
                    error={errors.roleName}
                    helperText={errors.roleName}
                    showLabel="Role Name *"
                    inputBgColor="#2A2A2A"
                  />
                </Box>

                {/* Assigned Pages Field */}
                <Box>
                  <DesignationPermissions
                    routes={ADMIN_ROUTES}
                    initialPermissions={formData.routes}
                    onPermissionsChange={handlePermissionsChange}
                  />
                  {errors.routes && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 1, display: "block" }}
                    >
                      {errors.routes}
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
                          ? "Update Role"
                          : "Add Role"
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

export default AddEditUserRoleDialog;
