import React, { useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { motion } from "framer-motion";
import { Lock, ArrowLeft } from "lucide-react";
import TextInput from "../../components/textInput";
import CustomButton from "../../components/customButton";
import logo from "../../assets/Logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import { useSnackbar } from "notistack";
import { resetPassword } from "../../api/module/auth";

const SetNewPassword = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword] = useState(false);
  const [showConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const otp = location.state?.otp;

  if (!email || !otp) {
    navigate("/forgot-password");
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      enqueueSnackbar("Password must be at least 6 characters", {
        variant: "error",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      enqueueSnackbar("Passwords do not match", { variant: "error" });
      return;
    }

    setIsLoading(true);
    try {
      const payload = { email, otp, newPassword };
      const response = await resetPassword(payload);
      if (response?.status === 200 || response?.status === 201) {
        enqueueSnackbar("Password reset successfully! Please login.", {
          variant: "success",
        });
        navigate("/login");
      } else {
        enqueueSnackbar(response?.data?.message || "Failed to reset password", {
          variant: "error",
        });
      }
    } catch (error) {
      console.log(error, "error in reset password");
      enqueueSnackbar("An error occurred. Please try again.", {
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated Background Elements */}
      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          width: "100px",
          height: "100px",
          background: "linear-gradient(45deg, #8CE600, #6BBF00)",
          borderRadius: "50%",
          opacity: 0.1,
          filter: "blur(20px)",
        }}
      />
      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{
          position: "absolute",
          bottom: "20%",
          right: "15%",
          width: "150px",
          height: "150px",
          background: "linear-gradient(45deg, #8CE600, #6BBF00)",
          borderRadius: "50%",
          opacity: 0.08,
          filter: "blur(30px)",
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          width: "100%",
          maxWidth: "450px",
          padding: "0 20px",
        }}
      >
        <motion.div variants={itemVariants}>
          <Box
            sx={{
              background: "rgba(26, 26, 26, 0.8)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              padding: "40px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Glowing Border Effect */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: "24px",
                background:
                  "linear-gradient(45deg, transparent, rgba(140, 230, 0, 0.1), transparent)",
                opacity: 0.5,
              }}
            />

            {/* Header */}
            <motion.div variants={itemVariants}>
              <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
                <IconButton
                  onClick={() => navigate("/otp-verification", { state: { email } })}
                  sx={{ color: "#8CE600", padding: 0 }}
                >
                  <ArrowLeft size={24} />
                </IconButton>
              </Box>
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <img src={logo} alt="logo" width={100} height={100} />
                  </Box>
                </motion.div>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: "#FFFFFF",
                    my: 2,
                    background: "linear-gradient(45deg, #8CE600, #FFFFFF)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Set New Password
                </Typography>
                <Typography variant="body2" sx={{ color: "#B0B0B0" }}>
                  Please enter your new password
                </Typography>
              </Box>
            </motion.div>

            {/* Form */}
            <motion.div variants={itemVariants}>
              <Box sx={{ mb: 3 }}>
                <TextInput
                  placeholder="New Password"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  showLabel="New Password"
                  variant="darkInput"
                  InputStartIcon={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Lock size={20} color="#8CE600" />
                    </Box>
                  }
                  showPassIcon={false}
                />
              </Box>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Box sx={{ mb: 4 }}>
                <TextInput
                  placeholder="Confirm Password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type={showConfirmPassword ? "text" : "password"}
                  showLabel="Confirm Password"
                  variant="darkInput"
                  InputStartIcon={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Lock size={20} color="#8CE600" />
                    </Box>
                  }
                  showPassIcon={false}
                />
              </Box>
            </motion.div>

            <motion.div variants={itemVariants}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CustomButton
                  btnLabel={isLoading ? "Resetting..." : "Reset Password"}
                  handlePressBtn={handleResetPassword}
                  variant="authbutton"
                  width="100%"
                  height="56px"
                  btnTextSize="16px"
                  textWeight="600"
                  disabled={isLoading}
                  sx={{
                    backgroundColor: "#8CE600",
                    boxShadow: "0 8px 25px rgba(140, 230, 0, 0.3)",
                    "&:hover": {
                      backgroundColor: "#7BCC00",
                      boxShadow: "0 12px 35px rgba(140, 230, 0, 0.4)",
                    },
                  }}
                />
              </motion.div>
            </motion.div>
          </Box>
        </motion.div>
      </motion.div>
    </Box>
  );
};

export default SetNewPassword;