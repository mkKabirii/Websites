import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { Plus } from "lucide-react";
import PaginatedTable from "../../components/dynamicTable";
import AddEditOurStoryDialog from "./addEditOurStory";
import {
  getStory,
  createStory,
  updateStory,
  deleteStory,
} from "../../api/module/ourStory";
import { useSnackbar } from "notistack";
import { deleteConfirm } from "../../components/customSweetAlert";
import useUserStore from "../../zustand/useUserStore";
import { useLocation } from "react-router-dom";

const OurStoryManagement = () => {
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));
  const tableHeaders = [
    { id: "id", title: "ID", align: "center" },
    { id: "title", title: "Title", align: "center" },
    { id: "description", title: "Description", align: "center" },
    { id: "actions", title: "Actions", align: "center" },
  ];
  const displayRows = ["id", "title", "description", "actions"];

  const [ourStory, setOurStory] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    handleGetOurStory();
  }, []);

  const handleGetOurStory = async () => {
    try {
      setIsLoading(true);
      const response = await getStory();
      if (response.status === 200 || response.status === 201) {
        setOurStory(response?.data?.data?.ourStories || []);
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

  const handleSaveStory = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
      };

      const response = isEdit
        ? await updateStory(editData._id, payload)
        : await createStory(payload);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message, { variant: "success" });
        await handleGetOurStory();
        setDialogOpen(false);
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.error("Save Story Error:", error);
      enqueueSnackbar("Something went wrong!", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  //   const handleDeleteStory = async (id) => {
  //   try {
  //     const result = await deleteConfirm({
  //       title: "Delete Story?",
  //       text: "Are you sure you want to delete this story?",
  //       confirmButtonText: "Delete"
  //     });

  //     if (!result.isConfirmed) return;

  //     setIsLoading(true);

  //     const response = await deleteStory(id);

  //     if (response.status === 200 || response.status === 201) {

  //       await Swal.fire({
  //         title: "Deleted!",
  //         text: response.data.message,
  //         icon: "success"
  //       });

  //       await handleGetOurStory();

  //     } else {
  //       enqueueSnackbar(response.data.message, { variant: "error" });
  //     }

  //   } catch (error) {
  //     console.log("Delete Story Error:", error);

  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleDeleteStory = async (id) => {
    try {
      const confirmation = await deleteConfirm({
        title: "Delete Story?",
        text: "Are you sure you want to delete this story?",
        confirmButtonText: "Delete",
      });

      if (!confirmation.isConfirmed) return;

      setIsLoading(true);

      const response = await deleteStory(id);
      console.log(response, "delete  Work Category");

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message, { variant: "sucess" });

        handleGetOurStory();
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("Delete FAQ error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStory = () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };

  const handleEditStory = (storyId) => {
    const story = ourStory.find((s) => s._id === storyId);
    if (story) {
      setEditData(story);
      setIsEdit(true);
      setDialogOpen(true);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
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
          Our Story Management
        </Typography>
        <Typography variant="body1" sx={{ color: "#B0B0B0", fontSize: "16px" }}>
          Manage your story timeline, add new entries, and update existing ones
        </Typography>
      </Box>

      {/* Add Button */}
      {perms.isCreate && (
        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleAddStory}
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
            Add New Story
          </Button>
        </Box>
      )}

      {/* Table */}
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
          tableData={ourStory || []}
          displayRows={displayRows}
          handleEditService={handleEditStory}
          handleDeleteService={handleDeleteStory}
          isLoading={isLoading}
          showPagination
          showEdit={perms.isEdit ? true : false}
          showDelete={perms.isDelete ? true : false}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <AddEditOurStoryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveStory}
        editData={editData}
        isEdit={isEdit}
        loading={saving}
      />
    </Box>
  );
};

export default OurStoryManagement;
