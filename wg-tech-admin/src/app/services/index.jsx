import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Paper, Chip, Avatar } from "@mui/material";
import { Plus, Edit, Trash } from "lucide-react";
import PaginatedTable from "../../components/dynamicTable";
import useUserStore from "../../zustand/useUserStore";
import AddEditServicesDialog from "./addEditServices";
import {
  createService,
  deleteService,
  getAllServices,
  updateService,
} from "../../api/module/service";
import { deleteConfirm } from "../../components/customSweetAlert";
import { useSnackbar } from "notistack";
import { useLocation } from "react-router-dom";

const ServicesManagement = () => {
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));
  console.log(perms, "permsServicess");
  // Table headers configuration
  const tableHeaders = [
    { id: "id", title: "ID", align: "center" },
    { id: "image", title: "Image", align: "center" },

    { id: "title", title: "Service Title", align: "left" },
    { id: "description", title: "Description", align: "left" },
    { id: "status", title: "Status", align: "center" },
    { id: "actions", title: "Actions", align: "center" },
  ];

  const displayRows = [
    "id",
    "image",
    "title",
    "description",
    "status",
    "actions",
  ];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [servicesData, setServicesData] = useState([]);
  const [saving, setSaving] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    handleGetServices(currentPage, rowsPerPage);
  }, []);

  const handleGetServices = async (page = 1, limit = 10) => {
    setLoading(true);

    try {
      const response = await getAllServices(page, limit);
      console.log(response.data.data, "services response");

      if (response.status === 200 || response.status === 201) {
        const data = response?.data?.data || {};
        setServicesData(data.services || []);
        setTotalPages(data.totalPages || 0);
        setCurrentPage(data.currentPage || 1);
        setTotal(data.total || 0);
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("Services Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage, newRowsPerPage) => {
    setCurrentPage(newPage);
    setRowsPerPage(newRowsPerPage);
    handleGetServices(newPage, newRowsPerPage);
  };

  const handleRowsPerPageChange = (newPage, newRowsPerPage) => {
    setCurrentPage(newPage);
    setRowsPerPage(newRowsPerPage);
    handleGetServices(newPage, newRowsPerPage);
  };
  const handleSaveService = async (formData) => {
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        image: formData.image,
        status: formData.status,
      };

      const response = isEdit
        ? await updateService(editData._id, payload)
        : await createService(payload);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message || "FAQ saved successfully!", {
          variant: "success",
        });

        await handleGetServices(currentPage, rowsPerPage);
        setDialogOpen(false);
      } else {
        enqueueSnackbar(response.data.message || "Failed to save FAQ", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Save FAQ Error:", error);
      enqueueSnackbar("Something went wrong", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id) => {
    try {
      const result = await deleteConfirm({
        title: "Delete Service?",
        text: "Are you sure you want to delete this Service?",
        confirmButtonText: "Delete",
      });

      if (!result.isConfirmed) return;

      setLoading(true);

      const response = await deleteService(id);
      console.log(response, "delte service");

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message, { variant: "sucess" });

        handleGetServices(currentPage, rowsPerPage);
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("Delete FAQ error:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleAddService = async () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };

  const handleEditService = (_id) => {
    const service = servicesData.find((s) => s._id === _id);
    if (service) {
      setEditData(service);
      setIsEdit(true);
      setDialogOpen(true);
    }
  };

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
          Services Management
        </Typography>
        <Typography variant="body1" sx={{ color: "#B0B0B0", fontSize: "16px" }}>
          Manage your services, add new services, and update existing ones
        </Typography>
      </Box>

      {/* Add Button */}
      {perms.isCreate && (
        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleAddService}
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
            Add New Service
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
          tableData={servicesData}
          displayRows={displayRows}
          handleEditService={handleEditService}
          handleDeleteService={handleDeleteService}
          isLoading={isLoading}
          showPagination={true}
          showEdit={perms.isEdit ? true : false}
          showDelete={perms.isDelete ? true : false}
          totalPages={totalPages}
          currentPage={currentPage}
          total={total}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>
      <AddEditServicesDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveService}
        editData={editData}
        isEdit={isEdit}
        loading={isLoading}
      />
    </Box>
  );
};

export default ServicesManagement;
