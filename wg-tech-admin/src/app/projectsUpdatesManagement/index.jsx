import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Button,
  IconButton,
} from "@mui/material";
import { Plus, FileText, Edit, Trash } from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import AddEditProjectUpdatesDialog from "./addEditProjectUpdates";
import {
  createPhases,
  getAllPhases,
  updatePhases,
} from "../../api/module/projectsUpdates";
import { useSnackbar } from "notistack";
import { getProposal } from "../../api/module/proposal";
import useUserStore from "../../zustand/useUserStore";
import { useLocation } from "react-router-dom";
import ProgressCardSkeleton from "../../components/skeleton/progressCardSkeleton";
const decodeHtml = (encoded) => {
  if (!encoded) return "";
  const txt = document.createElement("textarea");
  txt.innerHTML = encoded;
  return txt.value;
};
const ProjectsUpdatesManagement = () => {
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));

  const [updatesData, setUpdatesData] = useState([
    // {
    //   id: 1,
    //   title: "Website Redesign Phase 1",
    //   description:
    //     "<p><strong>Phase 1 Complete:</strong> Successfully completed the initial design mockups and user interface wireframes for the new website.</p><p>All stakeholders have <em>approved</em> the design direction and we are ready to move to the next phase.</p><ul><li>Design mockups finalized</li><li>UI wireframes completed</li><li>Stakeholder approval received</li></ul>",
    //   proposalId: "12345678",
    //   images: [
    //     "https://images.unsplash.com/photo-1551434678-e076c223a692?w=500&h=300&fit=crop",
    //     "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=300&fit=crop",
    //     "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=300&fit=crop",
    //   ],
    // },
    // {
    //   id: 2,
    //   title: "Mobile App Development",
    //   description:
    //     "<p><strong>Mobile App Development Progress:</strong></p><p>Successfully implemented core features including:</p><ol><li><strong>User Authentication:</strong> Complete login/signup system</li><li><strong>Dashboard:</strong> Interactive user dashboard with real-time data</li><li><strong>Navigation:</strong> Smooth navigation between screens</li></ol><p>Next steps include <em>testing and optimization</em>.</p>",
    //   proposalId: "87654321",
    //   images: [
    //     "https://images.unsplash.com/photo-1555066931-4365d14bb8c0?w=500&h=300&fit=crop",
    //     "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&h=300&fit=crop",
    //   ],
    // },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [proposal, setProposal] = useState([]);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    adaptiveHeight: true,
  };

  useEffect(() => {
    fetchProposal();
    handleGetPhases();
  }, []);

  const handleGetPhases = async () => {
    setIsLoading(true);
    try {
      const response = await getAllPhases();
      console.log(response?.data?.data?.phases, "responcsssss");
      if (response.status == 200 || response.status == 201) {
        setUpdatesData(response?.data?.data?.phases || []);
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log(error, "faqerrorerrorerrorerror");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProposal = async () => {
    setIsLoading(true);
    try {
      const response = await getProposal();
      console.log(response.data.data.proposals, "Full proposals API response");

      if (response.status === 200 || response.status === 201) {
        const proposalsList = response.data?.data?.proposals || [];
        const formatted = proposalsList.map((p) => ({
          id: p._id, // for internal matching
          proposalId: p.proposalId, // for display
          fullname: p.fullname,
          company: p.company,
        }));

        setProposal(formatted);
      } else {
        console.warn("Unexpected response format:", response);
        setProposal([]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUpdate = () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };

  const handleEditUpdate = (update) => {
    setEditData(update);
    setIsEdit(true);
    setDialogOpen(true);
  };

  const handleDeleteUpdate = (id) => {
    setUpdatesData((prev) => prev.filter((item) => item.id !== id));
  };
  const handleSaveUpdate = async (formData) => {
    setIsLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        proposalId: formData.proposalId,
        images: formData.images,
      };

      const response = isEdit
        ? await updatePhases(editData._id, payload)
        : await createPhases(payload);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message || "Add ssuccessfully!", {
          variant: "success",
        });
        console.log(response.data.data, "responeRoleeeeeee");
        setDialogOpen(false);

        await handleGetPhases();
      } else {
        enqueueSnackbar(response.data.message || "Failed role", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("roleErrorrr:", error);
      enqueueSnackbar("Something went wrong", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };
  // const handleSaveUpdate = (formData) => {
  //   if (isEdit) {
  //     setUpdatesData((prev) =>
  //       prev.map((item) =>
  //         item.id === editData.id ? { ...item, ...formData } : item
  //       )
  //     );
  //   } else {
  //     const newUpdate = {
  //       id: Date.now(),
  //       ...formData,
  //     };
  //     setUpdatesData((prev) => [...prev, newUpdate]);
  //   }

  //   setDialogOpen(false);
  //   setEditData(null);
  //   setIsEdit(false);
  // };

  // const getProposalDetails = (proposalId) => {
  //   if (!proposal || proposal.length === 0) return null;

  //   const found = proposal.find(
  //     (p) => p.id === proposalId || p.proposalId === proposalId
  //   );

  //   if (!found) return null;

  //   return {
  //     fullname: found.fullname || "-",
  //     company: found.company || "N/A",
  //     proposalId: found.proposalId,
  //   };
  // };

  return (
    <Box sx={{ p: 3 }}>
      {/* Main Heading */}
      <Box sx={{ mb: 4 }} mt={3}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: "#FFFFFF",
                fontWeight: 700,
                mb: 1,
                background: "linear-gradient(135deg, #8CE600 0%, #00D4AA 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Projects Updates Management
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "#B0B0B0", fontSize: "16px" }}
            >
              Manage project updates, add new milestones, and track progress
            </Typography>
          </Box>

          {perms.isCreate && (
            <Button
              variant="contained"
              startIcon={<Plus size={20} />}
              onClick={handleAddUpdate}
              sx={{
                backgroundColor: "#8CE600",
                color: "#000000",
                fontWeight: 600,
                px: 3,
                py: 1.5,
                borderRadius: "12px",
                textTransform: "none",
                fontSize: "16px",
                "&:hover": {
                  backgroundColor: "#7BCC00",
                },
              }}
            >
              Add Update
            </Button>
          )}
        </Box>

        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <ProgressCardSkeleton key={index} />
            ))
          : updatesData.map((item) => (
              <Card
                key={item.id}
                sx={{
                  my: 2,
                  backgroundColor: "#1A1A1A",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid #333333",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 25px rgba(140, 230, 0, 0.15)",
                    borderColor: "#8CE600",
                  },
                }}
              >
                {/* Header with Title and Actions */}
                <Box
                  sx={{
                    p: 3,
                    backgroundColor: "#2A2A2A",
                    borderBottom: "1px solid #333333",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 600,
                        fontSize: "1.3rem",
                        mb: 0.5,
                      }}
                    >
                      {item.title}
                    </Typography>
                    {item.proposalId && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#8CE600",
                          fontSize: "0.9rem",
                          fontWeight: 500,
                        }}
                      >
                        Proposal #{item.proposalId.proposalId} -{" "}
                        {item.proposalId.fullname}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: "flex", gap: 1 }}>
                    {perms.isEdit && (
                      <IconButton
                        onClick={() => handleEditUpdate(item)}
                        sx={{
                          color: "#8CE600",
                          backgroundColor: "#333333",
                          "&:hover": {
                            backgroundColor: "#444444",
                          },
                        }}
                      >
                        <Edit size={18} />
                      </IconButton>
                    )}
                    {/* {perms.isDelete && <IconButton
                    onClick={() => handleDeleteUpdate(item.id)}
                    sx={{
                      color: "#FF5050",
                      backgroundColor: "#333333",
                      "&:hover": {
                        backgroundColor: "#444444",
                      },
                    }}
                  >
                    <Trash size={18} />
                  </IconButton>} */}
                  </Box>
                </Box>

                {/* Image Carousel */}
                {item.images.length > 0 && (
                  <Box sx={{ backgroundColor: "#2A2A2A", p: 7 }}>
                    <Slider {...sliderSettings}>
                      {item.images.map((image, index) => (
                        <Box key={index} sx={{ px: 1 }}>
                          <CardMedia
                            component="img"
                            image={image}
                            alt={`${item.title} - Image ${index + 1}`}
                            sx={{
                              height: 300,
                              borderRadius: "12px",
                              objectFit: "cover",
                              border: "2px solid #333333",
                            }}
                          />
                        </Box>
                      ))}
                    </Slider>
                  </Box>
                )}

                {/* Description */}
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}
                  >
                    <Avatar
                      sx={{
                        backgroundColor: "#8CE600",
                        width: 32,
                        height: 32,
                      }}
                    >
                      <FileText size={18} color="#000" />
                    </Avatar>
                    <Box
                      sx={{
                        color: "#B0B0B0",
                        // lineHeight: 1.6,
                        fontSize: "14px",
                        textAlign: "justify",
                        marginTop: "0px",
                        "& p": {
                          margin: 0,
                          marginBottom: "8px",
                        },

                        "& p:last-child": {
                          marginBottom: 0,
                        },
                        "& strong": {
                          color: "#FFFFFF",
                          fontWeight: 600,
                        },
                        "& em": {
                          fontStyle: "italic",
                        },
                        "& ul, & ol": {
                          paddingLeft: "20px",
                          marginBottom: "8px",
                        },
                        "& li": {
                          marginBottom: "4px",
                        },
                        "& h2": {
                          margin: 0,
                          padding: 0,
                        },
                        // maxHeight: 120,
                        overflow: "hidden",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: decodeHtml(item.description || ""),
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
      </Box>

      {/* Add/Edit Dialog */}
      <AddEditProjectUpdatesDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveUpdate}
        editData={editData}
        isEdit={isEdit}
        proposals={proposal} // <-- pass it here
        isLoading={isLoading}
      />
    </Box>
  );
};

export default ProjectsUpdatesManagement;
