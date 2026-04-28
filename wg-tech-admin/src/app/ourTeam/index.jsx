import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Paper, Tabs, Tab } from "@mui/material";
import { Plus } from "lucide-react";
import PaginatedTable from "../../components/dynamicTable";
import AddEditOurTeamDialog from "./addEditOurTeam";
import RoleManagement from "../role";
import {
  createOurTeam,
  deleteOurTeam,
  getOurTeam,
  getRollOptions,
  updateOurTeam,
} from "../../api/module/ourTeam";
import { useSnackbar } from "notistack";
import { deleteConfirm } from "../../components/customSweetAlert";
import useUserStore from "../../zustand/useUserStore";
import { useLocation } from "react-router-dom";

const OurTeamManagement = () => {
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Table headers configuration
  const tableHeaders = [
    { id: "id", title: "ID", align: "center" },
    { id: "image", title: "Photo", align: "center" },
    { id: "name", title: "Name", align: "center" },
    { id: "role", title: "Role", align: "center" },
    { id: "shortDescription", title: "Description", align: "center" },
    { id: "actions", title: "Actions", align: "center" },
  ];

  const displayRows = [
    "id",
    "image",
    "name",
    "role_Team",
    "shortDescription",
    "actions",
  ];

  // Sample data with your structure
  const [ourTeamData, setOurTeamData] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [roleOptions, setRoleOptions] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [ourTeam, setOurTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  console.log();

  console.log(ourTeam, "ourStoryourStoryourStory");

  useEffect(() => {
    fetchRoles();
    handleGetOurTeam();
  }, []);
  // console.log(roleOptions, "roleOptionsroleOptionsroleOptions");

  const handleAddTeamMember = () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };

  const handleEditTeamMember = (memberId) => {
    const member = ourTeam.find((m) => m._id === memberId); // <-- fixed line
    if (member) {
      setEditData(member);
      setIsEdit(true);
      setDialogOpen(true);
    }
  };

  // const handleSaveTeamMember = (formData) => {
  //   if (isEdit && editData) {
  //     // Update existing team member
  //     setOurTeamData((prev) =>
  //       prev.map((member) =>
  //         member.id === editData.id ? { ...formData, id: editData.id } : member
  //       )
  //     );
  //   } else {
  //     // Add new team member
  //     const newMember = {
  //       ...formData,
  //       id: ourTeamData.length
  //         ? Math.max(...ourTeamData.map((m) => m.id)) + 1
  //         : 1,
  //     };
  //     setOurTeamData((prev) => [...prev, newMember]);
  //   }
  // };

  const handleSaveTeamMember = async (formData) => {
    setIsLoading(true);
    try {
      const payload = {
        role: formData.role,
        name: formData.name,
        shortDescription: formData.shortDescription,
        url: formData.url,
        image: formData.image,
      };

      console.log("Payload to send:", payload);

      const response = isEdit
        ? await updateOurTeam(editData._id, payload)
        : await createOurTeam(payload);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data?.message || "Success!", {
          variant: "success",
        });
        setDialogOpen(false);
        await handleGetOurTeam();
      } else {
        enqueueSnackbar(response.data?.message || "Something went wrong!", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Save Team Error:", error);
      enqueueSnackbar("Something went wrong!", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await getRollOptions();
      if (response.status === 200 || response.status === 201) {
        console.log(response, "dfdsfvsdfdsfsdf");

        const roles = response.data.data.teamRoles || [];

        setRoleOptions(roles);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleGetOurTeam = async () => {
    try {
      setIsLoading(true);
      const response = await getOurTeam();
      console.log(response, "responseresponse");

      if (response.status === 200 || response.status === 201) {
        setOurTeam(response?.data?.data?.teamMembers || []);
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
      enqueueSnackbar("Failed to fetch stories!", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };
  // const handleDeleteOurTeam = async (id) => {
  //   try {
  //     setIsLoading(true);
  //     const response = await deleteOurTeam(id);
  //     console.log(response,'NomanAli');

  //     if (response.status === 200 || response.status === 201) {
  //       enqueueSnackbar(response.data.message, { variant: "success" });
  //       await handleGetOurTeam(); // ✅ Refresh list after delete
  //     } else {
  //       enqueueSnackbar(response.data.message, { variant: "error" });
  //     }
  //   } catch (error) {
  //     console.log(error, "errorerrorerrorerrorerror22131231");
  //     enqueueSnackbar("Something went wrong while deleting!", { variant: "error" });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const handleDeleteOurTeam = async (id) => {
    try {
      const confirmation = await deleteConfirm({
        title: "Delete OurTeam?",
        text: "Are you sure you want to delete this OurTeam?",
        confirmButtonText: "Delete",
      });

      if (!confirmation.isConfirmed) return;

      setIsLoading(true);

      const response = await deleteOurTeam(id);
      console.log(response, "delete  Work Category");

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message, { variant: "sucess" });

        handleGetOurTeam();
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("Delete FAQ error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }} mt={3}>
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
          Our Team Management
        </Typography>
        <Typography variant="body1" sx={{ color: "#B0B0B0", fontSize: "16px" }}>
          Manage team members, roles, add new ones, and update existing entries
        </Typography>
      </Box>

      {/* Tabs Container */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: "#1A1A1A",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #333333",
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              "& .MuiTab-root": {
                color: "#B0B0B0",
                textTransform: "none",
                fontSize: "16px",
                fontWeight: 500,
                minHeight: 60,
                "&.Mui-selected": {
                  color: "#8CE600",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#8CE600",
                height: 3,
              },
            }}
          >
            <Tab label="Teams Role" />
            <Tab label="Our Team" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 0 }}>
          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
              {" "}
              <RoleManagement />{" "}
            </Box>
          )}
          {activeTab === 1 && (
            <>
              {/* Add Button */}
              {perms.isCreate && (
                <Box
                  sx={{
                    mb: 3,
                    display: "flex",
                    justifyContent: "flex-end",
                    p: 3,
                    pt: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={<Plus size={20} />}
                    onClick={handleAddTeamMember}
                    sx={{
                      backgroundColor: "#8CE600",
                      color: "#000",
                      fontWeight: 600,
                      px: 3,
                      py: 1.5,
                      borderRadius: "12px",
                      textTransform: "none",
                      fontSize: "16px",
                      "&:hover": {
                        backgroundColor: "#7BCC00",
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 25px rgba(140, 230, 0, 0.3)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    Add New Team Member
                  </Button>
                </Box>
              )}

              {/* Table Container */}
              <Box sx={{ px: 3, pb: 3 }}>
                <PaginatedTable
                  tableWidth="100%"
                  tableHeader={tableHeaders}
                  tableData={ourTeam}
                  displayRows={displayRows}
                  handleEditService={handleEditTeamMember}
                  isLoading={isLoading}
                  showPagination={true}
                  handleDeleteService={handleDeleteOurTeam}
                  showEdit={perms.isEdit ? true : false}
                  showDelete={perms.isDelete ? true : false}
                />
              </Box>
            </>
          )}
        </Box>
      </Paper>

      {/* Add/Edit Dialog */}
      <AddEditOurTeamDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveTeamMember}
        editData={editData}
        isEdit={isEdit}
        roleOptions={roleOptions}
      />
    </Box>
  );
};

export default OurTeamManagement;
