import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { Mail, Phone, Building, MessageSquare, ExternalLink } from "lucide-react";
import useUserStore from "../../zustand/useUserStore";
import { getUserById } from "../../api/module/user";

const MyProjectsPage = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { enqueueSnackbar } = useSnackbar();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch assigned clients
  useEffect(() => {
    const fetchAssignedClients = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        const response = await getUserById(user._id);

        if (response.status === 200 || response.status === 201) {
          const userData = response.data?.data || {};
          const assignedClients = userData.assignedClients || [];
          setClients(assignedClients);

          if (assignedClients.length === 0) {
            enqueueSnackbar("No clients assigned to you yet", {
              variant: "info",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        enqueueSnackbar("Failed to load assigned clients", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedClients();
  }, [user?._id, enqueueSnackbar]);

  const handleViewDetails = (client) => {
    setSelectedClient(client);
    setShowDetails(true);
  };

  const handleChat = (client) => {
    // Navigate to chat page
    navigate("/chat");
    enqueueSnackbar(`Opening chat with ${client.name}`, {
      variant: "success",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      "Not Started": "#FF9800",
      "In Progress": "#2196F3",
      "On Hold": "#F44336",
      Completed: "#4CAF50",
    };
    return colors[status] || "#999";
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          My Projects
        </Typography>
        <Typography variant="body2" sx={{ color: "#999" }}>
          Manage your assigned clients and projects
        </Typography>
      </Box>

      {/* Empty State */}
      {clients.length === 0 ? (
        <Card
          sx={{
            backgroundColor: "#1A1A1A",
            border: "1px solid #333",
            textAlign: "center",
            p: 4,
          }}
        >
          <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
            No Clients Assigned
          </Typography>
          <Typography variant="body2" sx={{ color: "#999" }}>
            Your admin will assign clients to you soon. You'll see them here.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {clients.map((client) => (
            <Grid item xs={12} sm={6} md={4} key={client._id}>
              <Card
                sx={{
                  backgroundColor: "#1A1A1A",
                  border: "1px solid #333",
                  borderRadius: "12px",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    borderColor: "#9EFF00",
                    boxShadow: "0 0 20px rgba(158, 255, 0, 0.2)",
                  },
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent sx={{ flexGrow: 1, pb: 2 }}>
                  {/* Client Header */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{
                        backgroundColor: "#9EFF00",
                        color: "#1A1A1A",
                        fontWeight: 700,
                        mr: 2,
                      }}
                    >
                      {client.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box flex={1}>
                      <Typography
                        variant="h6"
                        sx={{ color: "#fff", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                      >
                        {client.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#999", display: "block" }}
                      >
                        ID: {client._id.substring(0, 8)}...
                      </Typography>
                    </Box>
                  </Box>

                  {/* Status Chip */}
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={client.status || "Not Started"}
                      sx={{
                        backgroundColor: getStatusColor(client.status),
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "12px",
                      }}
                    />
                  </Box>

                  {/* Contact Info */}
                  <Box sx={{ space: 1 }}>
                    {client.email && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Mail size={16} color="#9EFF00" />
                        <Typography
                          variant="caption"
                          sx={{ color: "#ccc", wordBreak: "break-all" }}
                        >
                          {client.email}
                        </Typography>
                      </Box>
                    )}
                    {client.phone && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Phone size={16} color="#9EFF00" />
                        <Typography variant="caption" sx={{ color: "#ccc" }}>
                          {client.phone}
                        </Typography>
                      </Box>
                    )}
                    {client.company && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Building size={16} color="#9EFF00" />
                        <Typography variant="caption" sx={{ color: "#ccc" }}>
                          {client.company}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Project Info */}
                  {client.projectName && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #333" }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#999", display: "block", mb: 1 }}
                      >
                        Project:
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#fff" }}>
                        {client.projectName}
                      </Typography>
                    </Box>
                  )}

                  {client.budget && (
                    <Box sx={{ mt: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#999", display: "block", mb: 0.5 }}
                      >
                        Budget: ${client.budget?.toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                </CardContent>

                {/* Action Buttons */}
                <Box sx={{ display: "flex", gap: 1, p: 2, pt: 0 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ExternalLink size={16} />}
                    onClick={() => handleViewDetails(client)}
                    sx={{
                      flex: 1,
                      color: "#9EFF00",
                      borderColor: "#9EFF00",
                      "&:hover": {
                        backgroundColor: "rgba(158, 255, 0, 0.1)",
                      },
                    }}
                  >
                    Details
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<MessageSquare size={16} />}
                    onClick={() => handleChat(client)}
                    sx={{
                      flex: 1,
                      backgroundColor: "#9EFF00",
                      color: "#1A1A1A",
                      fontWeight: 600,
                      "&:hover": {
                        backgroundColor: "#8FDD00",
                      },
                    }}
                  >
                    Chat
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Client Details Dialog */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#1A1A1A",
            borderRadius: "12px",
            border: "1px solid #333",
          },
        }}
      >
        <DialogTitle sx={{ color: "#fff", fontWeight: 700 }}>
          {selectedClient?.name}
        </DialogTitle>
        <DialogContent sx={{ color: "#ccc" }}>
          <Box sx={{ mt: 2, space: 2 }}>
            <DetailRow label="Email" value={selectedClient?.email} />
            <DetailRow label="Phone" value={selectedClient?.phone} />
            <DetailRow label="Company" value={selectedClient?.company} />
            <DetailRow label="Project" value={selectedClient?.projectName} />
            <DetailRow
              label="Status"
              value={selectedClient?.status || "Not Started"}
            />
            <DetailRow
              label="Budget"
              value={
                selectedClient?.budget
                  ? `$${selectedClient.budget.toLocaleString()}`
                  : "N/A"
              }
            />
            <DetailRow
              label="Description"
              value={selectedClient?.description || "N/A"}
            />
            <DetailRow label="Client ID" value={selectedClient?._id} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setShowDetails(false)}
            sx={{ color: "#9EFF00" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Helper component for detail rows
const DetailRow = ({ label, value }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="caption" sx={{ color: "#999", display: "block", mb: 0.5 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: "#fff", wordBreak: "break-all" }}>
      {value || "N/A"}
    </Typography>
  </Box>
);

export default MyProjectsPage;
