import React, { useState } from "react";
import { Box, Typography, Link, IconButton , Divider } from "@mui/material";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, LogIn, Shield } from "lucide-react";
import TextInput from "../../components/textInput";
import CustomButton from "../../components/customButton";
import logo from "../../assets/Logo.png";
import useUserStore from "../../zustand/useUserStore";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { loginUser } from "../../api/module/auth";
const Login = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { setUserData } = useUserStore();

  // Fake admin credentials
  // const FAKE_ADMIN = {
  //   email: "admin@wgtech.com",
  //   password: "Admin@123",
  // };

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async () => {
    setIsLoading(true);
    // console.log("Login data:", formData);

    try {
      let payload = {
        email: formData.email,
        password: formData.password,
      };
      const response = await loginUser(payload);
      // console.log(response, "responseresponseresponse");
      if (response?.status == 200 || response?.status == 201) {
        const data = response.data.data.user;
        const token = response.data.data.token;
        localStorage.setItem("token", token);
        localStorage.setItem("userId", data._id);
        setUserData(data);
        console.log(data, "ghjgfjfg");
        console.log(token, "tokennnnnnnnn");

        navigate("/access-granted");
      } else {
        enqueueSnackbar(response.data.message, {
          variant: "error",
        });
      }
    } catch (error) {
      console.log(error, "errorerrorerrorerrorerror");
    } finally {
      setIsLoading(false);
    }
  };

  // Check credentials
  // const isValidCredentials =
  //   formData.email === FAKE_ADMIN.email &&
  //   formData.password === FAKE_ADMIN.password;

  // console.log("isValidCredentials:", isValidCredentials);

  // if (isValidCredentials) {
  //   // Correct credentials - store user data and navigate to access granted
  //   console.log("Valid credentials - navigating to access granted");

  //   // Store user data
  //   useUserStore.getState().setUserData({
  //     email: formData.email,
  //     password: formData.password,
  //     isAdmin: true,
  //   });

  // Navigate to access granted video
  // Wrong credentials - navigate to access denied video

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
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
              //   border: "1px solid rgba(140, 230, 0, 0.2)",
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
                  Admin Portal
                </Typography>
                <Typography variant="body2" sx={{ color: "#B0B0B0" }}>
                  Secure access to your dashboard
                </Typography>
              </Box>
            </motion.div>

            {/* Form */}
            <motion.div variants={itemVariants}>
              <Box sx={{ mb: 3 }}>
                <TextInput
                  placeholder="admin@wgtech.com"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  type="email"
                  showLabel="Email Address"
                  variant="darkInput"
                  InputStartIcon={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Mail size={20} color="#8CE600" />
                    </Box>
                  }
                />
              </Box>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Box sx={{ mb: 4 }}>
                <TextInput
                  placeholder="Admin@123"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  type={showPassword ? "text" : "password"}
                  showLabel="Password"
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
                  btnLabel={isLoading ? "Signing In..." : "Sign In"}
                  handlePressBtn={handleLogin}
                  variant="authbutton"
                  width="100%"
                  height="56px"
                  btnTextSize="16px"
                  textWeight="600"
                  disabled={isLoading}
                  startIcon={
                    !isLoading && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", mr: 1 }}
                      >
                        <LogIn size={20} />
                      </Box>
                    )
                  }
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

            <motion.div variants={itemVariants}>
              <Divider sx={{ my: 3, borderColor: "rgba(140, 230, 0, 0.2)" }} />

              {/* <Box sx={{ textAlign: "center" }}>
                <Link
                  href="/forgot-password"
                  sx={{
                    color: "#8CE600",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                    "&:hover": {
                      textDecoration: "underline",
                      color: "#6BBF00",
                    },
                  }}
                >
                  Forgot your password?
                </Link>
              </Box> */}
            </motion.div>
          </Box>
        </motion.div>
      </motion.div>
    </Box>
  );
};

export default Login;
