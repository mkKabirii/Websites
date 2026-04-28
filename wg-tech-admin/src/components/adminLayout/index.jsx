import React from "react";
import { Box } from "@mui/material";
import { motion } from "framer-motion";
import authbg from "../../assets/web-bg-2.png";

const AdminLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        backgroundImage: `url(${authbg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Animated Background Elements */}
      <motion.div
        animate={{
          y: [-20, 20, -20],
          x: [-10, 10, -10],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '200px',
          height: '200px',
        //   background: 'linear-gradient(45deg, #8CE600, #6BBF00)',
          borderRadius: '50%',
          opacity: 0.05,
          filter: 'blur(40px)'
        }}
      />
      
      <motion.div
        animate={{
          y: [20, -20, 20],
          x: [10, -10, 10],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '300px',
          height: '300px',
          background: 'linear-gradient(45deg, #8CE600, #6BBF00)',
          borderRadius: '50%',
          opacity: 0.03,
          filter: 'blur(60px)'
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "0 20px",
          zIndex: 1
        }}
      >
        {children}
      </motion.div>
    </Box>
  );
};

export default AdminLayout;
