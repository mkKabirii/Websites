import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#8CE600", // Brand Yellow
      maintwo: "#8CE600", // Brand Red
      text: "#151515",
      light: "#FFE066",
      dark: "#8CE600",
      contrastText: "#151515",
    },
    secondary: {
      main: "#8CE600",
      light: "#E74C3C",
      dark: "#8B0000",
      contrastText: "#ffffff",
    },
    background: {
      default: "#0F0F0F",
      paper: "#1A1A1A",
      dark: "#151515",
      card: "#2A2A2A",
    },
    gradient: {
      primary: "#8CE600",
      secondary: "#8CE600",
      card: "#8CE600",
      auth: "#8CE600",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#B0B0B0",
      disabled: "#666666",
      white: "#ffffff",
      dark: "#151515",
    },
    error: {
      main: "#d32f2f",
      light: "#ef5350",
      dark: "#c62828",
    },
    success: {
      main: "#2e7d32",
      light: "#4caf50",
      dark: "#1b5e20",
    },
  },
  typography: {
    fontFamily: '"Poppins", sans-serif',
    h1: {
      fontSize: 48,
      fontWeight: 700,
      color: "#FFFFFF",
      fontFamily: '"Poppins", sans-serif',
    },
    h2: {
      fontSize: 40,
      fontWeight: 700,
      color: "#FFFFFF",
      fontFamily: '"Poppins", sans-serif',
    },
    h3: {
      fontSize: 32,
      fontWeight: 700,
      color: "#FFFFFF",
      fontFamily: '"Poppins", sans-serif',
    },
    h4: {
      fontSize: 28,
      fontWeight: 600,
      color: "#FFFFFF",
      fontFamily: '"Poppins", sans-serif',
    },
    h5: {
      fontSize: 24,
      fontWeight: 600,
      color: "#FFFFFF",
      fontFamily: '"Poppins", sans-serif',
    },
    h6: {
      fontSize: 20,
      fontWeight: 600,
      color: "#FFFFFF",
      fontFamily: '"Poppins", sans-serif',
    },
    subtitle1: {
      fontSize: 16,
      fontWeight: 500,
      color: "#67768B",
      fontFamily: '"Poppins", sans-serif',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: 14,
      fontWeight: 400,
      color: "#67768B",
      fontFamily: '"Poppins", sans-serif',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: 16,
      fontWeight: 400,
      color: "#FFFFFF",
      fontFamily: '"Poppins", sans-serif',
    },
    body2: {
      fontSize: 14,
      fontWeight: 400,
      color: "#67768B",
      fontFamily: '"Poppins", sans-serif',
    },
    caption: {
      fontSize: 12,
      fontWeight: 400,
      color: "#67768B",
      fontFamily: '"Poppins", sans-serif',
    },
    button: {
      fontSize: 16,
      fontWeight: 500,
      color: "#ffffff",
      fontFamily: '"Poppins", sans-serif',
      textTransform: "none",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          transition: "all 0.3s ease",
        },
      },
      variants: [
        {
          props: { variant: "gradient" },
          style: {
            background: "linear-gradient(135deg,#8CE600,  #8CE600)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            "&:hover": {
              transform: "translateY(-5px)",
              boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
            },
          },
        },
      ],
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 12,
          fontWeight: 400,
          fontFamily: '"Poppins", sans-serif',
        },
      },
      variants: [
        {
          props: { variant: "gradient" },
          style: {
            backgroundColor: "#8CE600",
            color: "#ffffff",
            padding: "12px",
            fontSize: "16px",
            "&:hover": {
              backgroundColor: "#7BCC00",
              transform: "translateY(-2px)",
              boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
            },
          },
        },
        {
          props: { variant: "authbutton" },
          style: {
            backgroundColor: "#8CE600",
            color: "#fff",
            padding: "30px 30px",
            fontSize: "18px",
            borderRadius: "8px",
            fontWeight: 700,
            "&:hover": {
              backgroundColor: "#7BCC00",
              transform: "translateY(-2px)",
              boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
            },
          },
        },
        {
          props: { variant: "socail" },
          style: {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "4px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            padding: "5px 26px",
            color: "#ffffff",
            textTransform: "none",
            fontSize: "12px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            },
          },
        },
        {
          props: { variant: "webbutton" },
          style: {
            backgroundColor: "#8CE600",
            color: "#151515",
            padding: "30px 30px",
            fontSize: "18px",
            borderRadius: "12px",
            fontWeight: 500,
            "&:hover": {
              backgroundColor: "#7BCC00",
              transform: "translateY(-2px)",
              boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
            },
          },
        },

        {
          props: { variant: "gradientbtn" },
          style: {
            backgroundColor: "#8CE600",
            color: "#ffffff",
            padding: "12px 24px", // �� Better padding
            fontSize: "16px",
            fontWeight: "600", // 🟢 Bold text
            borderRadius: "12px",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", // 🟢 Smooth transition

            "&::before": {
              // �� Shine effect
              content: '""',
              position: "absolute",
              top: 0,
              left: "-100%",
              width: "100%",
              height: "100%",
              // background:
              //   "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              transition: "left 0.5s",
            },

            "&:hover": {
              backgroundColor: "#7BCC00",
              transform: "translateY(-3px) scale(1.02)", // 🟢 Enhanced lift effect
              // boxShadow:
              //   "0 8px 25px rgba(140, 230, 0, 0.4), 0 0 0 1px rgba(140, 230, 0, 0.1)", // 🟢 Glowing shadow

              "&::before": {
                left: "100%", // 🟢 Shine animation
              },
            },

            "&:active": {
              transform: "translateY(-1px) scale(0.98)", // 🟢 Press effect
            },
          },
        },
        {
          props: { variant: "errorbtn" },
          style: {
            backgroundColor: "#d32f2f",
            color: "#ffff",
            padding: "30px 30px",
            fontSize: "18px",
            borderRadius: "8px",
            fontWeight: 500,
            "&:hover": {
              backgroundColor: "#b71c1c",
              transform: "translateY(-2px)",
              boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
            },
          },
        },
        {
          props: { variant: "customGrey" },
          style: {
            backgroundColor: "#F8FAFC",
            fontSize: 12,
            height: 34,
            width: 80,
            textTransform: "none",
            border: "1px solid",
            borderColor: "#E5E7EB",
            color: "#374151",
            "&:hover": {
              backgroundColor: "#f1f5f9",
            },
          },
        },
        {
          props: { variant: "customOutlined" },
          style: {
            backgroundColor: "#F8FAFC",
            fontSize: 12,
            height: 34,
            width: 150,
            textTransform: "none",
            border: "1px solid",
            borderColor: "#8CE600",
            color: "#8CE600",
          },
        },
      ],
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 4,
          backgroundColor: "rgba(255,255,255,0.1)",
        },
        bar: {
          borderRadius: 4,
          background: "linear-gradient(90deg,#8CE600,  #8CE600)",
        },
      },
    },
    MuiBox: {
      variants: [
        {
          props: { variant: "authBox" },
          style: {
            backgroundColor: "#f4f4f4",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          },
        },
      ],
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: '"Poppins", sans-serif',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: "#0D0D0D", // aur bhi dark
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)", // dark shadow
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#0D0D0D", // head bhi dark
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #2A2A2A", // halka border
          color: "#EAEAEA", // thoda off-white for better readability
        },
        head: {
          color: "#FFFFFF",
          fontWeight: 700,
          fontSize: "0.9rem",
          letterSpacing: "0.5px",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:nth-of-type(even)": {
            backgroundColor: "#141414", // alternate row
          },
          "&:nth-of-type(odd)": {
            backgroundColor: "#0D0D0D",
          },
          "&:hover": {
            backgroundColor: "#1F1F1F", // smooth hover
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          backgroundColor: "#0D0D0D",
          borderTop: "1px solid #2A2A2A",
          color: "#EAEAEA",
        },
        toolbar: {
          color: "#EAEAEA",
        },
        selectLabel: {
          color: "#EAEAEA",
        },
        displayedRows: {
          color: "#EAEAEA",
        },
        selectIcon: {
          color: "#EAEAEA",
        },
        actions: {
          button: {
            color: "#EAEAEA",
          },
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
      variants: [
        {
          props: { variant: "softInput" },
          style: {
            backgroundColor: "#eaf3eb",
            borderRadius: "8px",
            "& .MuiOutlinedInput-root": {
              borderRadius: "15px",
              background: "#eaf3eb",
              "& fieldset": {
                borderColor: "transparent",
                borderRadius: "15px",
              },
              "&:hover fieldset": {
                borderColor: "#fff",
                borderRadius: "15px",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#ffff",
                borderRadius: "15px",
              },
            },
            "& .MuiInputBase-input": {
              padding: "10px 14px",
              borderRadius: "15px",
            },
          },
        },
        {
          props: { variant: "customInput" },
          style: {
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: "15px",
            "& .MuiOutlinedInput-root": {
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(140, 230, 0, 0.3)",
              "& fieldset": {
                borderColor: "transparent",
              },
              "&:hover fieldset": {
                borderColor: "#8CE600",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#8CE600",
                borderWidth: "2px",
              },
            },
            "& .MuiInputBase-input": {
              color: "white",
              "&::placeholder": {
                color: "rgba(255, 255, 255, 0.6)",
              },
            },
            "& .MuiInputLabel-root": {
              color: "rgba(255, 255, 255, 0.7)",
            },
          },
        },
        {
          props: { variant: "darkInput" },
          style: {
            backgroundColor: "rgba(42, 42, 42, 0.8)",
            borderRadius: "12px",
            "& .MuiOutlinedInput-root": {
              backgroundColor: "rgba(42, 42, 42, 0.8)",
              border: "1px solid rgba(140, 230, 0, 0.2)",
              "& fieldset": {
                borderColor: "transparent",
              },
              "&:hover fieldset": {
                borderColor: "#8CE600",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#8CE600",
                borderWidth: "2px",
                boxShadow: "0 0 0 3px rgba(140, 230, 0, 0.1)",
              },
            },
            "& .MuiInputBase-input": {
              color: "white",
              fontSize: "16px",
              "&::placeholder": {
                color: "rgba(255, 255, 255, 0.5)",
              },
            },
            "& .MuiInputLabel-root": {
              color: "rgba(255, 255, 255, 0.7)",
            },
          },
        },
      ],
      styleOverrides: {
        root: {
          fontFamily: '"Poppins", sans-serif',
        },
      },
    },
  },
});

export default theme;
