import { Box, Button, Paper, Typography } from "@mui/material";
import { Plus } from "lucide-react";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  createOpportunities,
  deleteOpportunities,
  getAllOpportunities,
  updateOpportunities,
} from "../../api/module/opportunities";
import { deleteConfirm } from "../../components/customSweetAlert";
import PaginatedTable from "../../components/dynamicTable";
import AddEditOpportunitiesDialog from "./addEditOpportunities";
import ViewOpportunitiesDialog from "./viewOpportunitiesDialog";
import useUserStore from "../../zustand/useUserStore";
import { useLocation } from "react-router-dom";

const OpportunitiesManagement = () => {
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));

  // Table headers configuration
  const tableHeaders = [
    { id: "id", title: "ID", align: "center" },
    { id: "oppurtunityName", title: "Opportunity Name", align: "center" },
    { id: "view", title: "View Opportunities", align: "center" },
    { id: "actions", title: "Actions", align: "center" },
  ];

  const displayRows = ["id", "name", "view", "actions"];

  // Sample data with your structure
  const [opportunitiesData, setOpportunitiesData] = useState([]);
  console.log(opportunitiesData, "opportunitiesDataopportunitiesData");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  //setOpportunitiesData
  const handleAddOpportunity = () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };
  useEffect(() => {
    handleGetOpportunities();
  }, []);

  const handleGetOpportunities = async () => {
    try {
      setIsLoading(true);
      const response = await getAllOpportunities();
      if (response.status === 200 || response.status === 201) {
        setOpportunitiesData(response?.data?.data?.opportunities || []);
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

  const handleSaveOpportunity = async (formData) => {
    setSaving(true);
    try {
      // Filter out empty opportunities and prepare payload
      const filteredOpportunities = formData.oppurtunities
        .filter((opp) => opp.title?.trim() && opp.description?.trim())
        .map((opp) => ({
          title: opp.title?.trim(),
          description: opp.description?.trim(),
          image: opp.image || "",
        }));

      const payload = {
        name: formData.oppurtunityName?.trim(),
        opportunity: filteredOpportunities,
        status: formData.status || "Active",
      };

      console.log("Payload being sent:", payload);

      const response = isEdit
        ? await updateOpportunities(editData._id, payload)
        : await createOpportunities(payload);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(
          response.data?.message || "Opportunity saved successfully",
          { variant: "success" },
        );
        await handleGetOpportunities();
        // Close dialog only on successful save
        setDialogOpen(false);
      } else {
        enqueueSnackbar(
          response.data?.message || "Failed to save opportunity",
          { variant: "error" },
        );
        // Don't close dialog on error - let user retry or cancel
      }
    } catch (error) {
      console.error("Save Opportunity Error:", error);
      enqueueSnackbar(
        error.response?.data?.message || "Something went wrong!",
        { variant: "error" },
      );
      // Don't close dialog on error - let user retry or cancel
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOpportunity = async (id) => {
    try {
      const result = await deleteConfirm({
        title: "Delete Story?",
        text: "Are you sure you want to delete this story?",
        confirmButtonText: "Delete",
      });

      if (!result.isConfirmed) return;

      setIsLoading(true);

      const response = await deleteOpportunities(id);

      if (response.status === 200 || response.status === 201) {
        await Swal.fire({
          title: "Deleted!",
          text: response.data.message,
          icon: "success",
        });

        await handleGetOpportunities();
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("Delete Story Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditOpportunity = (opportunityId) => {
    const opportunity = opportunitiesData.find((o) => o._id === opportunityId);
    if (opportunity) {
      setEditData(opportunity);
      setIsEdit(true);
      setDialogOpen(true);
    }
  };

  const handleViewOpportunity = (opportunityId) => {
    const opportunity = opportunitiesData.find((o) => o._id === opportunityId);
    if (opportunity) {
      setViewData(opportunity);
      setViewDialogOpen(true);
    }
  };

  // const handleSaveOpportunity = (formData) => {
  //   if (isEdit && editData) {
  //     // Update existing opportunity
  //     setOpportunitiesData((prev) =>
  //       prev.map((opp) =>
  //         opp.id === editData.id ? { ...formData, id: editData.id } : opp
  //       )
  //     );
  //   } else {
  //     // Add new opportunity
  //     const newOpportunity = {
  //       ...formData,
  //       id: opportunitiesData.length
  //         ? Math.max(...opportunitiesData.map((o) => o.id)) + 1
  //         : 1,
  //     };
  //     setOpportunitiesData((prev) => [...prev, newOpportunity]);
  //   }
  // };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
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
          Opportunities Management
        </Typography>
        <Typography variant="body1" sx={{ color: "#B0B0B0", fontSize: "16px" }}>
          Manage job opportunities, add new ones, and update existing entries
        </Typography>
      </Box>

      {/* Add Button */}
      {perms.isCreate && (
        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleAddOpportunity}
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
            Add New Opportunity
          </Button>
        </Box>
      )}

      {/* Table Container */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: "#1A1A1A",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #333333",
        }}
      >
        <PaginatedTable
          tableWidth="100%"
          tableHeader={tableHeaders}
          tableData={opportunitiesData}
          displayRows={displayRows}
          handleEditService={handleEditOpportunity}
          handleViewService={handleViewOpportunity}
          isLoading={isLoading}
          showPagination={true}
          handleDeleteService={handleDeleteOpportunity}
          showEdit={perms.isEdit ? true : false}
          showDelete={perms.isDelete ? true : false}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <AddEditOpportunitiesDialog
        open={dialogOpen}
        onClose={() => {
          if (!saving) {
            setDialogOpen(false);
          }
        }}
        onSave={handleSaveOpportunity}
        editData={editData}
        isEdit={isEdit}
        saving={saving}
      />

      {/* View Dialog */}
      <ViewOpportunitiesDialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        opportunityData={viewData}
      />
    </Box>
  );
};

export default OpportunitiesManagement;
