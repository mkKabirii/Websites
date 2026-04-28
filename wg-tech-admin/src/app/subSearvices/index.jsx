import { Box, Button, Paper, Typography } from "@mui/material";
import { Plus } from "lucide-react";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  createSubService,
  deleteSubService,
  getAllSubServices,
  optionGetService,
  updateSubService,
} from "../../api/module/subService";
import PaginatedTable from "../../components/dynamicTable";
import AddEditSubServiceDialog from "./addEditsubSearvices";
import { deleteConfirm } from "../../components/customSweetAlert";
import useUserStore from "../../zustand/useUserStore";
import { useLocation } from "react-router-dom";

const SubServicesManagement = () => {
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));
  const tableHeaders = [
    { id: "id", title: "ID", align: "center" },
    { id: "image", title: "Image", align: "center" },
    { id: "title", title: "Sub Service Title", align: "left" },
    { id: "description", title: "Description", align: "left" },
    { id: "serviceId", title: "Service", align: "center" },
    { id: "status", title: "Status", align: "center" },
    { id: "actions", title: "Actions", align: "center" },
  ];

  const displayRows = [
    "id",
    "image",
    "title",
    "description",
    "serviceId",
    "status",
    "actions",
  ];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [subService, setSubService] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [services, setService] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  console.log(services, "servicesservices");

  useEffect(() => {
    fetchServices();
    handleGetSubService(currentPage, rowsPerPage);
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const response = await optionGetService();
      console.log(response.data.data.services, "Full services API response");

      if (response.status === 200 || response.status === 201) {
        const servicesList = response.data?.data?.services || [];
        const formatted = servicesList.map((s) => ({
          id: s._id,
          title: s.title,
          image: s.image,
        }));

        setService(formatted);
      } else {
        console.warn("Unexpected response format:", response);
        setService([]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetSubService = async (page = 1, limit = 10) => {
    setIsLoading(true);
    try {
      const response = await getAllSubServices(page, limit);
      console.log(response?.data?.data, "subServices response");
      if (response.status == 200 || response.status == 201) {
        const data = response?.data?.data || {};
        setSubService(data.subServices || []);
        setTotalPages(data.totalPages || 0);
        setCurrentPage(data.currentPage || 1);
        setTotal(data.total || 0);
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log(error, "subService error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage, newRowsPerPage) => {
    setCurrentPage(newPage);
    setRowsPerPage(newRowsPerPage);
    handleGetSubService(newPage, newRowsPerPage);
  };

  const handleRowsPerPageChange = (newPage, newRowsPerPage) => {
    setCurrentPage(newPage);
    setRowsPerPage(newRowsPerPage);
    handleGetSubService(newPage, newRowsPerPage);
  };

  const handleAddSubService = () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };

  const handleEditSubService = (subServiceId) => {
    const subServicess = subService.find((s) => s._id === subServiceId);

    if (subServicess) {
      setEditData(subServicess);
      setIsEdit(true);
      setDialogOpen(true);
    }
  };

  const handleSaveSubService = async (formData) => {
    setIsLoading(true);
    try {
      const payload = {
        image: formData.image,
        title: formData.title,
        description: formData.description,
        serviceId: formData.serviceId,
        status: formData.status,
      };

      const response = isEdit
        ? await updateSubService(editData._id, payload)
        : await createSubService(payload);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message || "Add ssuccessfully!", {
          variant: "success",
        });
        console.log(response.data.data, "responeRoleeeeeee");
        setDialogOpen(false);

        await handleGetSubService(currentPage, rowsPerPage);
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

  //   const handleDeleteSubService = async (id) => {
  //   const result = await deleteConfirm({
  //     title: "Delete Sub Service?",
  //     text: "Are you sure you want to delete the sub service?",
  //     confirmButtonText: "Delete"
  //   });

  //   if (result.isConfirmed) {
  //     setIsLoading(true);
  //     try {
  //       const response = await deleteSubService(id);

  //       if (response.status === 200 || response.status === 201) {
  //         Swal.fire("Deleted!", response.data.message, "success");
  //         await handleGetSubService(currentPage, rowsPerPage);
  //       } else {
  //         enqueueSnackbar(response.data.message, { variant: "error" });
  //       }

  //     } catch (error) {
  //       console.log(error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }
  // };
  const handleDeleteSubService = async (id) => {
    try {
      const result = await deleteConfirm({
        title: "Delete Sub Service?",
        text: "Are you sure you want to delete the sub service?",
        confirmButtonText: "Delete",
      });

      if (!result.isConfirmed) return;

      setIsLoading(true);

      const response = await deleteSubService(id);
      console.log(response, "delete sub service");

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message, { variant: "sucess" });

        handleGetSubService(currentPage, rowsPerPage);
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
          Sub Services Management
        </Typography>
        <Typography variant="body1" sx={{ color: "#B0B0B0", fontSize: "16px" }}>
          Manage your sub services, add new ones, and update existing entries
        </Typography>
      </Box>

      {/* Add Button */}
      {perms.isCreate && (
        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleAddSubService}
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
            Add New Sub Service
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
          tableData={subService || []}
          displayRows={displayRows}
          handleEditService={handleEditSubService}
          handleDeleteService={handleDeleteSubService}
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

      {/* Add/Edit Dialog */}
      <AddEditSubServiceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveSubService}
        editData={editData}
        isEdit={isEdit}
        services={services}
        loading={isLoading}
      />
    </Box>
  );
};

export default SubServicesManagement;
