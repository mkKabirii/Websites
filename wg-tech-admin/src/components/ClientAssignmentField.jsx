import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Paper,
  Checkbox,
  Typography,
  CircularProgress,
  Chip,
  FormControlLabel,
  Stack,
} from "@mui/material";
import { Search, X } from "lucide-react";
import { getClients } from "../api/module/quotations";

const ClientAssignmentField = ({
  value = [],
  onChange,
  error,
  helperText,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await getClients();
        if (response.status === 200 || response.status === 201) {
          const clientList = response.data?.data || [];
          setClients(Array.isArray(clientList) ? clientList : []);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Filter clients based on search term
  const filteredClients = clients.filter((client) =>
    `${client.name} ${client.email} ${client.company || ""}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle client selection/deselection
  const handleToggleClient = (clientId) => {
    const newValue = value.includes(clientId)
      ? value.filter((id) => id !== clientId)
      : [...value, clientId];
    onChange(newValue);
  };

  // Handle removing a selected client via chip
  const handleRemoveClient = (clientId) => {
    onChange(value.filter((id) => id !== clientId));
  };

  // Get selected client objects for display
  const selectedClients = clients.filter((c) => value.includes(c._id));

  return (
    <Box>
      <Typography variant="body2" color="#FFFFFF" sx={{ mb: 2 }}>
        Assign Clients (Optional)
      </Typography>

      <Box
        sx={{
          position: "relative",
          backgroundColor: "#2A2A2A",
          borderRadius: "8px",
          border: error ? "1px solid #f44336" : "1px solid #444444",
        }}
      >
        {/* Search Input */}
        <Box sx={{ display: "flex", alignItems: "center", p: 1.5 }}>
          <Search size={18} color="#999" style={{ marginRight: "8px" }} />
          <TextField
            variant="standard"
            placeholder="Search clients by name, email, or company..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            disabled={disabled || loading}
            InputProps={{
              disableUnderline: true,
              style: {
                color: "#FFFFFF",
                fontSize: "14px",
                marginLeft: "4px",
              },
            }}
            sx={{
              flex: 1,
              "& input::placeholder": {
                color: "#999",
                opacity: 1,
              },
              "& input": {
                padding: "4px 0",
              },
            }}
          />
        </Box>

        {/* Selected Clients Display */}
        {selectedClients.length > 0 && (
          <Box sx={{ px: 1.5, pb: 1 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              {selectedClients.map((client) => (
                <Chip
                  key={client._id}
                  label={`${client.name} (${client._id.substring(0, 8)}...)`}
                  onDelete={() => handleRemoveClient(client._id)}
                  sx={{
                    backgroundColor: "#9EFF00",
                    color: "#1A1A1A",
                    fontWeight: 600,
                    fontSize: "13px",
                    "& .MuiChip-deleteIcon": {
                      color: "#1A1A1A",
                      "&:hover": {
                        color: "#1A1A1A",
                      },
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Dropdown List */}
        {showDropdown && (
          <Paper
            sx={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              mt: 0.5,
              maxHeight: "300px",
              overflowY: "auto",
              backgroundColor: "#2A2A2A",
              borderRadius: "8px",
              border: "1px solid #444444",
              zIndex: 1000,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <FormControlLabel
                  key={client._id}
                  control={
                    <Checkbox
                      checked={value.includes(client._id)}
                      onChange={() => handleToggleClient(client._id)}
                      disabled={disabled}
                      sx={{
                        color: "#9EFF00",
                        "&.Mui-checked": {
                          color: "#9EFF00",
                        },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ color: "#FFFFFF" }}>
                        {client.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#999" }}>
                        ID: {client._id} {client.email && `• ${client.email}`} {client.company ? `• ${client.company}` : ""}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    display: "flex",
                    width: "100%",
                    p: 1.5,
                    "&:hover": {
                      backgroundColor: "rgba(158, 255, 0, 0.1)",
                    },
                  }}
                />
              ))
            ) : (
              <Box sx={{ p: 2, textAlign: "center", color: "#999" }}>
                <Typography variant="body2">No clients found</Typography>
              </Box>
            )}
          </Paper>
        )}

        {/* Click outside to close dropdown */}
        {showDropdown && (
          <Box
            onClick={() => setShowDropdown(false)}
            sx={{
              position: "fixed",
              inset: 0,
              zIndex: 999,
            }}
          />
        )}
      </Box>

      {error && (
        <Typography variant="caption" sx={{ color: "#f44336", mt: 1, ml: 1 }}>
          {helperText}
        </Typography>
      )}

      <Typography variant="caption" sx={{ color: "#999", mt: 1, display: "block" }}>
        {selectedClients.length} client(s) assigned
      </Typography>
    </Box>
  );
};

export default ClientAssignmentField;
