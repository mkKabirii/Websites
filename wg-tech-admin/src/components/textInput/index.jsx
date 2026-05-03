import { Box, InputAdornment, TextField } from "@mui/material";
import React, { useState } from "react";

import CustomInputLabel from "../customInputLabel";
import { Eye, EyeClosed } from "lucide-react";

function TextInput({
  placeholder,
  name,
  value,
  onChange,
  InputStartIcon,
  type,
  InputEndIcon,
  id,
  fullWidth,
  multiline,
  rows,
  disabled,
  readonly,
  showPassIcon,
  handleClickEndIcon,
  showLabel,
  inputBgColor,
  onKeyDown,
  helperText,
  error,
  label,
  sx = {}, // 🟢 sx ko default empty object rakha
}) {
  const [showPass, setShowPass] = useState(false);

  return (
    <>
      <Box textAlign={"left"}>
        {showLabel && <CustomInputLabel label={showLabel} />}
        <TextField
          id={id}
          label={label}
          error={!!error}
          helperText={helperText}
          type={type === "password" && showPass ? "text" : type}
          variant="outlined"
          size="small"
          fullWidth={fullWidth ?? true}
          placeholder={placeholder}
          name={name}
          value={value}
          onChange={onChange}
          multiline={multiline ?? false}
          rows={rows}
          disabled={disabled ?? false}
          onWheel={(e) => e.target.blur()}
          fontFamily={"Poppins"}
          onKeyDown={onKeyDown}
          // Line 56-108 ke sx object ko replace karo:
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              fontFamily: "Poppins",
              padding: "6px 16px",
              background: inputBgColor || "#2A2A2A",
              border: `1px solid ${error ? "#FF5050" : "#333333"}`, // 🟢 Dynamic border color
              transition: "all 0.3s ease",

              "&:hover": {
                borderColor: error ? "#FF5050" : "#9EFF00", // 🟢 Dynamic hover color
                borderWidth: "1px",
              },

              "&.Mui-focused": {
                borderColor: error ? "#FF5050" : "#9EFF00", // 🟢 Dynamic focus color
                borderWidth: "2px",
                borderRadius: "12px",
                fontFamily: "Poppins",
                boxShadow: error
                  ? "0 0 0 3px rgba(255, 80, 80, 0.1)" // 🟢 Error shadow
                  : "0 0 0 3px rgba(158, 255, 0, 0.1)", // 🟢 Normal shadow
              },

              "& fieldset": {
                border: "none",
              },
            },

            "& .MuiInputBase-input": {
              fontSize: "14px",
              color: "#FFFFFF",
              fontWeight: "500",
              "&::placeholder": {
                color: "#B0B0B0",
                opacity: 1,
              },
            },

            "& .MuiFormLabel-root": {
              color: error ? "#FF5050" : "#FFFFFF", // 🟢 Dynamic label color
              fontWeight: "600",
              "&.Mui-focused": {
                color: error ? "#FF5050" : "#9EFF00", // 🟢 Dynamic focused label color
              },
            },

            "& .MuiFormHelperText-root": {
              color: "#FF5050",
              fontSize: "12px",
              fontWeight: "500",
            },

            ...sx,
          }}
          InputProps={{
            readOnly: readonly ?? false,
            startAdornment: InputStartIcon && (
              <InputAdornment position="start" sx={{ mr: 1 }}>
                {InputStartIcon}
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment
                position="end"
                sx={{ cursor: "pointer" }}
                onClick={() => {
                  if (showPassIcon) {
                    setShowPass(!showPass);
                  } else {
                    handleClickEndIcon && handleClickEndIcon();
                  }
                }}
              >
                {showPassIcon ? (
                  showPass ? (
                    <Eye color="#9EFF00" />
                  ) : (
                    <EyeClosed color="#9EFF00" />
                  )
                ) : (
                  InputEndIcon
                )}
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </>
  );
}

export default TextInput;
