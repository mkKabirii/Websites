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
  CircularProgress,
} from "@mui/material";
import {
  ArrowLeft,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  GraduationCap,
  Briefcase,
  FileText,
  CheckCircle,
  Image as ImageIcon,
  Trash,
} from "lucide-react";
import { getAppliedFormById, deleteAppliedForm } from "../../api/module/application";
import { deleteConfirm } from "../../components/customSweetAlert";
import { useSnackbar } from "notistack";

const ViewFullForms = ({ formData, onBack }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [applicationData, setApplicationData] = useState(formData);

  const handleFetchApplication = async () => {
    const applicationId = formData?.id || formData?._id;
    if (!applicationId) return;

    setLoading(true);
    try {
      const response = await getAppliedFormById(applicationId);
      
      if (response.status === 200 || response.status === 201) {
        const apiData = response?.data?.data?.application || response?.data?.data;
        
        // Transform API data to UI format
        const transformedData = {
          id: apiData._id,
          _id: apiData._id,
          firstName: apiData.firstName || "",
          lastName: apiData.lastName || "",
          email: apiData.email || "",
          idType: apiData.idType || "",
          idNumber: apiData.idNumber || "",
          streetName: apiData.address?.streetName || "",
          city: apiData.address?.city || "",
          postalCode: apiData.address?.postalCode || "",
          dob: apiData.dateOfBirth || null,
          contact: apiData.phone?.phoneNumber || "",
          secondaryContact: apiData.phone?.landlineNumber || "",
          higherSchool: {
            name: apiData.education?.highSchool?.name || "",
            city: apiData.education?.highSchool?.city || "",
          },
          university: {
            name: apiData.education?.university?.name || "",
            city: apiData.education?.university?.city || "",
          },
          skills: apiData.skills || [],
          docsCV: apiData.cvResume || null,
          employPicture: apiData.picture || null,
          passportImages: [], // API se nahi aa raha
          isAgree: apiData.certification || false,
          jobType: "N/A",
          status: apiData.status
            ? apiData.status.charAt(0).toUpperCase() + apiData.status.slice(1)
            : "Pending",
        };
        
        setApplicationData(transformedData);
      } else {
        enqueueSnackbar(
          response.data?.message || "Failed to fetch application details",
          { variant: "error" }
        );
      }
    } catch (error) {
      console.error("Error fetching application details:", error);
      enqueueSnackbar("Failed to fetch application details!", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Agar formData mein id hai toh API se fresh data fetch karo
    if (formData && (formData.id || formData._id)) {
      handleFetchApplication();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.id, formData?._id]);

  // Download image function
  const handleDownloadImage = async (imageUrl, fileName) => {
    if (!imageUrl) {
      enqueueSnackbar("No image available to download", { variant: "warning" });
      return;
    }

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Failed to fetch image");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      enqueueSnackbar("Image downloaded successfully", { variant: "success" });
    } catch (error) {
      console.error("Error downloading image:", error);
      // Fallback: open in new tab
      window.open(imageUrl, "_blank");
      enqueueSnackbar("Opening image in new tab", { variant: "info" });
    }
  };

  // Download CV/Resume function
  const handleDownloadCV = async (cvUrl) => {
    if (!cvUrl) {
      enqueueSnackbar("No CV available to download", { variant: "warning" });
      return;
    }

    try {
      const response = await fetch(cvUrl);
      if (!response.ok) throw new Error("Failed to fetch CV");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CV_${applicationData?.firstName || "applicant"}_${applicationData?.lastName || ""}.pdf` || "resume.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      enqueueSnackbar("CV downloaded successfully", { variant: "success" });
    } catch (error) {
      console.error("Error downloading CV:", error);
      // Fallback: open in new tab
      window.open(cvUrl, "_blank");
      enqueueSnackbar("Opening CV in new tab", { variant: "info" });
    }
  };

  const handleDelete = async () => {
    const applicationId = formData?.id || formData?._id;
    if (!applicationId) return;

    try {
      const result = await deleteConfirm({
        title: "Delete Application?",
        text: "Are you sure you want to delete this application permanently?",
        confirmButtonText: "Delete",
      });

      if (!result.isConfirmed) return;

      setLoading(true);

      const response = await deleteAppliedForm(applicationId);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar("Application deleted successfully", {
          variant: "success",
        });
        onBack(true);
      } else {
        enqueueSnackbar(response.data?.message || "Failed to delete application", {
          variant: "error",
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("Delete error:", error);
      enqueueSnackbar("Something went wrong", { variant: "error" });
      setLoading(false);
    }
  };

  if (!applicationData && !formData) return null;

  const data = applicationData || formData;

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress sx={{ color: "#8CE600" }} />
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
      case "approved":
        return "#4CAF50";
      case "rejected":
        return "#F44336";
      case "pending":
        return "#FF9800";
      default:
        return "#9E9E9E";
    }
  };

  const getSkillLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case "expert":
        return "#4CAF50";
      case "advanced":
        return "#2196F3";
      case "intermediate":
        return "#FF9800";
      case "beginner":
        return "#9E9E9E";
      default:
        return "#9E9E9E";
    }
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
            onClick={onBack}
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
            Back
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
            Application Details
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Chip
            label={data.status || "Pending"}
            sx={{
              backgroundColor: getStatusColor(data.status),
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "14px",
              px: 2,
              py: 1,
            }}
            icon={<CheckCircle size={16} />}
          />
          <Button
            variant="contained"
            color="error"
            startIcon={<Trash size={18} />}
            onClick={handleDelete}
            sx={{
              backgroundColor: "#FF5050",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "#D32F2F",
              },
            }}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Box>
        {/* Header Section - Personal Info */}
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
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Avatar
                  src={data.employPicture}
                  sx={{
                    width: 120,
                    height: 120,
                    border: "4px solid #8CE600",
                    boxShadow: "0 8px 32px rgba(140, 230, 0, 0.3)",
                  }}
                />
                {data.employPicture && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Download size={14} />}
                    onClick={() => handleDownloadImage(
                      data.employPicture,
                      `Profile_${data.firstName}_${data.lastName}.jpg`
                    )}
                    sx={{
                      borderColor: "#8CE600",
                      color: "#8CE600",
                      fontSize: "12px",
                      "&:hover": {
                        borderColor: "#00D4AA",
                        color: "#00D4AA",
                      },
                    }}
                  >
                    Download Picture
                  </Button>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={9}>
              <Typography
                variant="h3"
                sx={{
                  color: "#FFFFFF",
                  fontWeight: 700,
                  mb: 1,
                  fontSize: { xs: "28px", md: "36px" },
                }}
              >
                {data.firstName} {data.lastName}
              </Typography>
              {/* <Typography
                variant="h6"
                sx={{
                  color: "#8CE600",
                  fontWeight: 500,
                  mb: 2,
                  fontSize: "18px",
                }}
              >
                {data.jobType}
              </Typography> */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Mail
                      size={18}
                      color="#8CE600"
                      style={{ marginRight: "8px" }}
                    />
                    <Typography sx={{ color: "#B0B0B0", fontSize: "14px" }}>
                      {data.email || "N/A"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Phone
                      size={18}
                      color="#8CE600"
                      style={{ marginRight: "8px" }}
                    />
                    <Typography sx={{ color: "#B0B0B0", fontSize: "14px" }}>
                      {data.contact || "N/A"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <MapPin
                      size={18}
                      color="#8CE600"
                      style={{ marginRight: "8px" }}
                    />
                    <Typography sx={{ color: "#B0B0B0", fontSize: "14px" }}>
                      {data.streetName ? `${data.streetName}, ${data.city}, ${data.postalCode}` : "N/A"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Calendar
                      size={18}
                      color="#8CE600"
                      style={{ marginRight: "8px" }}
                    />
                    <Typography sx={{ color: "#B0B0B0", fontSize: "14px" }}>
                      {formatDate(data.dob)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <User
                      size={18}
                      color="#8CE600"
                      style={{ marginRight: "8px" }}
                    />
                    <Typography sx={{ color: "#B0B0B0", fontSize: "14px" }}>
                      {data.idType}: {data.idNumber}
                     
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {/* Education Section */}
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
            <GraduationCap
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
              Education
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
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
                    sx={{ color: "#8CE600", fontWeight: 600, mb: 1 }}
                  >
                    Higher School
                  </Typography>
                  <Typography sx={{ color: "#FFFFFF", fontWeight: 500, mb: 1 }}>
                    {data.higherSchool?.name || "N/A"}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <MapPin
                      size={16}
                      color="#B0B0B0"
                      style={{ marginRight: "6px" }}
                    />
                    <Typography sx={{ color: "#B0B0B0", fontSize: "14px" }}>
                      {data.higherSchool?.city || "N/A"}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
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
                    sx={{ color: "#8CE600", fontWeight: 600, mb: 1 }}
                  >
                    University
                  </Typography>
                  <Typography sx={{ color: "#FFFFFF", fontWeight: 500, mb: 1 }}>
                    {data.university?.name || "N/A"}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <MapPin
                      size={16}
                      color="#B0B0B0"
                      style={{ marginRight: "6px" }}
                    />
                    <Typography sx={{ color: "#B0B0B0", fontSize: "14px" }}>
                      {data.university?.city || "N/A"}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Skills Section */}
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
            <Briefcase
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
              Skills & Expertise
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {data.skills?.map((skill, index) => (
              <Chip
                key={index}
                label={`${skill.skill} (${skill.level})`}
                sx={{
                  backgroundColor: getSkillLevelColor(skill.level),
                  color: "#FFFFFF",
                  fontWeight: 500,
                  fontSize: "14px",
                  px: 2,
                  py: 1,
                  "& .MuiChip-label": {
                    px: 2,
                  },
                }}
              />
            ))}
          </Box>
        </Paper>

        {/* Documents & Agreement Section */}
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
            <FileText
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
              Documents & Agreement
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Typography sx={{ color: "#B0B0B0", mr: 2, minWidth: "120px" }}>
                  CV Document:
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Download size={16} />}
                  onClick={() => handleDownloadCV(data.docsCV)}
                  disabled={!data.docsCV}
                  sx={{
                    borderColor: data.docsCV ? "#8CE600" : "#666666",
                    color: data.docsCV ? "#8CE600" : "#666666",
                    "&:hover": {
                      borderColor: data.docsCV ? "#00D4AA" : "#666666",
                      color: data.docsCV ? "#00D4AA" : "#666666",
                    },
                    "&:disabled": {
                      borderColor: "#666666",
                      color: "#666666",
                    },
                  }}
                >
                  {data.docsCV ? "Download CV" : "No CV Available"}
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Typography sx={{ color: "#B0B0B0", mr: 2, minWidth: "120px" }}>
                  Agreement:
                </Typography>
                <Chip
                  label={data.isAgree ? "Agreed" : "Not Agreed"}
                  sx={{
                    backgroundColor: data.isAgree ? "#4CAF50" : "#F44336",
                    color: "#FFFFFF",
                    fontWeight: 500,
                  }}
                  icon={data.isAgree ? <CheckCircle size={16} /> : null}
                />
              </Box>
            </Grid>
            {data.employPicture && (
              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Typography sx={{ color: "#B0B0B0", mr: 2, minWidth: "120px" }}>
                    Profile Picture:
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<ImageIcon size={16} />}
                    onClick={() => handleDownloadImage(
                      data.employPicture,
                      `Profile_${data.firstName}_${data.lastName}.jpg`
                    )}
                    sx={{
                      borderColor: "#8CE600",
                      color: "#8CE600",
                      "&:hover": {
                        borderColor: "#00D4AA",
                        color: "#00D4AA",
                      },
                    }}
                  >
                    Download Profile Picture
                  </Button>
                </Box>
              </Grid>
            )}
            {data.passportImages && data.passportImages.length > 0 && (
              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Typography sx={{ color: "#B0B0B0", mr: 2, minWidth: "120px" }}>
                    Passport Images:
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Download size={16} />}
                    onClick={async () => {
                      const passportImages = data.passportImages || [];
                      if (passportImages.length === 0) {
                        enqueueSnackbar("No passport images available", { variant: "warning" });
                        return;
                      }

                      // Download all passport images
                      for (let i = 0; i < passportImages.length; i++) {
                        const imageUrl = passportImages[i];
                        if (imageUrl) {
                          await handleDownloadImage(
                            imageUrl,
                            `passport_image_${i + 1}.jpg`
                          );
                          // Add small delay between downloads
                          await new Promise((resolve) => setTimeout(resolve, 500));
                        }
                      }
                    }}
                    sx={{
                      borderColor: "#8CE600",
                      color: "#8CE600",
                      "&:hover": {
                        borderColor: "#00D4AA",
                        color: "#00D4AA",
                      },
                    }}
                  >
                    Download All Passport Images ({data.passportImages?.length || 0})
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};

export default ViewFullForms;
