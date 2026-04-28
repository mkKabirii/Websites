import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  Button,
  Container,
  Divider,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  DollarSign,
  MessageSquare,
  Package,
  CheckCircle,
  Clock,
  Lock,
  FileText,
} from "lucide-react";
import { useSnackbar } from "notistack"; //new add here
import { sendProposalEmail } from "../../api/module/proposal"; //naya add here
import { useParams, useNavigate } from "react-router-dom";
import { getAllProposalById } from "../../api/module/proposal";
import {
  optionGetWorkService,
  optionGetWorkSubServiceById,
} from "../../api/module/work";

const ViewProposals = () => {
  const { proposalId, id: routeId } = useParams();
  const id = proposalId || routeId;
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar(); //new add here

  const [proposalData, setProposalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serviceTitles, setServiceTitles] = useState([]);
  const [subServiceTitles, setSubServiceTitles] = useState([]);

  // naya add here
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleOpenEmailDialog = () => {
    setEmailTo(proposalData.email);
    setEmailDialog(true);
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const response = await sendProposalEmail(id, { email: emailTo });
      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar("Email sent successfully!", { variant: "success" });
        setEmailDialog(false);
      }
    } catch (error) {
      enqueueSnackbar("Failed to send email", { variant: "error" });
    } finally {
      setSendingEmail(false);
    }
  };

  useEffect(() => {
    console.log("🔁 ViewProposals mounted, route param id:", id);

    const fetchProposal = async () => {
      setLoading(true);
      try {
        if (!id) {
          console.warn(
            "⚠️ No `id` found in route params for ViewProposals. Skipping API call.",
          );
          setProposalData(null);
          return;
        }

        console.log("🔍 Fetching proposal detail, id:", id);
        const response = await getAllProposalById(id);
        console.log("✅ Proposal detail response:", response);
        if (response.status === 200 || response.status === 201) {
          // Backends often return single records in slightly different shapes.
          // Try multiple common patterns so view detail works regardless.
          const payload = response?.data?.data ?? response?.data ?? {};

          const proposal =
            payload?.proposal || // { data: { proposal: {...} } }
            (Array.isArray(payload?.proposals) && payload.proposals[0]) || // { data: { proposals: [ {...} ] } }
            payload; // { data: { ...proposalFields } } or similar fallback

          setProposalData(proposal);
          const services = Array.isArray(proposal?.services)
            ? proposal.services.map(String)
            : [];
          const subs = Array.isArray(proposal?.subServices)
            ? proposal.subServices.map(String)
            : [];
          if (services.length > 0) {
            await loadServiceAndSubs(services, subs);
          } else {
            setServiceTitles([]);
            setSubServiceTitles([]);
          }
        } else {
          console.warn("⚠️ Unexpected status for proposal detail:", response);
          setProposalData(null);
        }
      } catch (e) {
        console.error("❌ Error while fetching proposal detail:", e);
        setProposalData(null);
      } finally {
        setLoading(false);
      }
    };

    const loadServiceAndSubs = async (serviceIds, subIds) => {
      try {
        const servicesResp = await optionGetWorkService();
        const subsResps = await Promise.all(
          serviceIds.map((id) => optionGetWorkSubServiceById(String(id))),
        );
        if (servicesResp.status === 200 || servicesResp.status === 201) {
          const list = servicesResp.data?.data?.services || [];
          const titles = serviceIds
            .map(
              (sid) => list.find((s) => String(s._id) === String(sid))?.title,
            )
            .filter(Boolean);
          setServiceTitles(titles);
        } else {
          setServiceTitles([]);
        }
        const mergedSubs = [];
        subsResps.forEach((resp) => {
          if (resp.status === 200 || resp.status === 201) {
            const raw = resp.data?.data;
            const subList = Array.isArray(raw) ? raw : raw?.subServices || [];
            subList.forEach((s) => {
              if (!mergedSubs.find((m) => String(m._id) === String(s._id))) {
                mergedSubs.push(s);
              }
            });
          }
        });
        const titlesSubs = mergedSubs
          .filter((s) => subIds.map(String).includes(String(s._id)))
          .map((s) => s.title || "");
        setSubServiceTitles(titlesSubs);
      } catch {
        setServiceTitles([]);
        setSubServiceTitles([]);
      }
    };

    fetchProposal();
  }, [id]);

  const handleBack = () => {
    navigate("/proposals");
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "transparent",
          p: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h4" sx={{ color: "#FFFFFF" }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!proposalData) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "transparent",
          p: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h4" sx={{ color: "#FFFFFF" }}>
          Proposal not found
        </Typography>
      </Box>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "#FF9800";
      case "in progress":
        return "#2196F3";
      case "locked":
        return "#F44336";
      case "completed":
        return "#4CAF50";
      default:
        return "#9E9E9E";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Clock size={16} />;
      case "in progress":
        return <Clock size={16} />;
      case "locked":
        return <Lock size={16} />;
      case "completed":
        return <CheckCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  // Generate initials from full name
  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "N/A"
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "transparent", p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#1A1A1A",
          borderRadius: "12px",
          p: 3,
          mb: 3,
          border: "1px solid #333333",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            onClick={handleBack}
            startIcon={<ArrowLeft size={20} />}
            sx={{
              color: "#8CE600",
              borderColor: "#8CE600",
              "&:hover": {
                borderColor: "#00D4AA",
                color: "#00D4AA",
              },
            }}
            variant="outlined"
          >
            Back to Proposals
          </Button>
          {/* new button add here */}
          <Button
            onClick={handleOpenEmailDialog}
            startIcon={<Mail size={20} />}
            variant="contained"
            sx={{
              backgroundColor: "#8CE600",
              color: "#000",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#00D4AA" },
            }}
          >
            Send Email
          </Button>
          <Typography
            variant="h4"
            sx={{
              color: "#FFFFFF",
              fontWeight: 600,
              background: "linear-gradient(135deg, #8CE600 0%, #00D4AA 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Proposal Details
          </Typography>
        </Box>
        <Chip
          label={proposalData.status || "Pending"}
          sx={{
            backgroundColor: getStatusColor(proposalData.status),
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: "14px",
            px: 2,
            py: 1,
          }}
          icon={getStatusIcon(proposalData.status)}
        />
      </Box>

      {/* ✅ Dialog yahan — Header Box ke baad */}

      <Dialog
        open={emailDialog}
        onClose={() => setEmailDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: "#1A1A1A",
            border: "1px solid #333",
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle sx={{ color: "#8CE600" }}>
          Send Confirmation Email
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#B0B0B0", mb: 2 }}>
            Edit email address if needed before sending:
          </Typography>
          <TextField
            fullWidth
            label="Email Address"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#fff",
                "& fieldset": { borderColor: "#333" },
              },
              "& .MuiInputLabel-root": { color: "#B0B0B0" },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setEmailDialog(false)}
            sx={{ color: "#B0B0B0" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={sendingEmail}
            sx={{
              backgroundColor: "#8CE600",
              color: "#000",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#00D4AA" },
            }}
          >
            {sendingEmail ? "Sending..." : "Send Email"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* <Container maxWidth="xxl"> */}
      <Box>
        {/* Client Information Section */}
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "#1A1A1A",
            borderRadius: "16px",
            p: 4,
            mb: 3,
            border: "1px solid #333333",
            background: "linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <User size={24} color="#8CE600" style={{ marginRight: "12px" }} />
            <Typography
              variant="h5"
              sx={{
                color: "#FFFFFF",
                fontWeight: 600,
                background: "linear-gradient(135deg, #8CE600 0%, #00D4AA 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Client Information
            </Typography>
          </Box>
          <Grid container spacing={3} alignItems="center">
            <Grid item size={{ xs: 12, md: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    border: "4px solid #8CE600",
                    boxShadow: "0 8px 32px rgba(140, 230, 0, 0.3)",
                    backgroundColor: "#8CE600",
                    fontSize: "32px",
                    fontWeight: "bold",
                    color: "#000",
                  }}
                >
                  {getInitials(proposalData.fullname)}
                </Avatar>
              </Box>
            </Grid>
            <Grid item size={{ xs: 12, md: 9 }}>
              <Typography
                variant="h3"
                sx={{
                  color: "#FFFFFF",
                  fontWeight: 700,
                  mb: 1,
                  fontSize: { xs: "28px", md: "32px" },
                }}
              >
                {proposalData.fullname}
              </Typography>
              <Grid container spacing={2}>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Mail
                      size={18}
                      color="#8CE600"
                      style={{ marginRight: "8px" }}
                    />
                    <Typography sx={{ color: "#B0B0B0", fontSize: "14px" }}>
                      {proposalData.email}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Calendar
                      size={18}
                      color="#8CE600"
                      style={{ marginRight: "8px" }}
                    />
                    <Typography sx={{ color: "#B0B0B0", fontSize: "14px" }}>
                      Proposal ID: #{proposalData.proposalId}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {/* Project Details Section */}
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "#1A1A1A",
            borderRadius: "16px",
            p: 4,
            mb: 3,
            border: "1px solid #333333",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Package
              size={24}
              color="#8CE600"
              style={{ marginRight: "12px" }}
            />
            <Typography
              variant="h5"
              sx={{
                color: "#FFFFFF",
                fontWeight: 600,
                background: "linear-gradient(135deg, #8CE600 0%, #00D4AA 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Project Details
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Services Required */}
            <Grid item size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  backgroundColor: "#0D0D0D",
                  border: "1px solid #333333",
                  borderRadius: "12px",
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ color: "#8CE600", fontWeight: 600, mb: 2 }}
                  >
                    Required Services
                  </Typography>
                  <Stack spacing={2} direction="row" gap={2} flexWrap="wrap">
                    {serviceTitles.map((title, idx) => (
                      <Chip
                        key={`svc-${idx}`}
                        label={title}
                        sx={{
                          backgroundColor: "#8CE600",
                          color: "#000000",
                          fontWeight: 600,
                          fontSize: "14px",
                          width: "fit-content",
                          my: 1,
                        }}
                      />
                    ))}
                    {subServiceTitles.map((title, idx) => (
                      <Chip
                        key={`sub-${idx}`}
                        label={title}
                        sx={{
                          backgroundColor: "#3b3b3b",
                          color: "#ffffff",
                          fontWeight: 600,
                          fontSize: "14px",
                          width: "fit-content",
                          border: "1px solid #8CE600",
                          my: 1,
                        }}
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Budget Information */}
            <Grid item size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  backgroundColor: "#0D0D0D",
                  border: "1px solid #333333",
                  borderRadius: "12px",
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ color: "#8CE600", fontWeight: 600, mb: 2 }}
                  >
                    Budget
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <DollarSign
                      size={24}
                      color="#00D4AA"
                      style={{ marginRight: "8px" }}
                    />
                    <Typography
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 600,
                        fontSize: "18px",
                      }}
                    >
                      {typeof proposalData.budget === "number"
                        ? `$${proposalData.budget.toLocaleString()}`
                        : proposalData.budget}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Project Message Section */}
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "#1A1A1A",
            borderRadius: "16px",
            p: 4,
            mb: 3,
            border: "1px solid #333333",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <MessageSquare
              size={24}
              color="#8CE600"
              style={{ marginRight: "12px" }}
            />
            <Typography
              variant="h5"
              sx={{
                color: "#FFFFFF",
                fontWeight: 600,
                background: "linear-gradient(135deg, #8CE600 0%, #00D4AA 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Project Description
            </Typography>
          </Box>

          <Card
            sx={{
              backgroundColor: "#0D0D0D",
              border: "1px solid #333333",
              borderRadius: "12px",
            }}
          >
            <CardContent>
              <Typography
                sx={{
                  color: "#FFFFFF",
                  fontSize: "16px",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {proposalData.messages || "No description provided"}
              </Typography>
            </CardContent>
          </Card>
        </Paper>

        {/* Action Buttons Section */}
        {/* <Paper
            elevation={0}
            sx={{
              backgroundColor: "#1A1A1A",
              borderRadius: "16px",
              p: 4,
              border: "1px solid #333333",
            }}
          > */}
        {/* <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "#8CE600",
                  color: "#000000",
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  "&:hover": {
                    backgroundColor: "#7BCC00",
                  },
                }}
              >
                Permission to Login
              </Button>
            </Stack> */}
        {/* </Paper> */}
      </Box>
      {/* </Container> */}
    </Box>
  );
};

export default ViewProposals;
