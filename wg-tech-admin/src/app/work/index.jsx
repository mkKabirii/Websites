import { Box, Button, Paper, Typography } from "@mui/material";
import { Plus } from "lucide-react";
import Swal from "sweetalert2";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import {
  createWork,
  deleteWork,
  getAllWork,
  updateWork,
} from "../../api/module/work";
import { deleteConfirm } from "../../components/customSweetAlert";
import PaginatedTable from "../../components/dynamicTable";
import AddEditWorkDialog from "./addEditWork";
import ViewWorkDialog from "./viewWorkDialog";
import useUserStore from "../../zustand/useUserStore";
import { useLocation } from "react-router-dom";

const TABLE_HEADERS = [
  { id: "id", title: "ID", align: "center" },
  { id: "workCategory", title: "Work Category", align: "center" },
  { id: "view", title: "View Works", align: "center" },
  { id: "actions", title: "Actions", align: "center" },
];

const DISPLAY_ROWS = ["id", "workCategory", "view", "actions"];

const mapWorkRecord = (work = {}) => {
  const id = String(work._id || "");
  return {
    _id: id,
    id,
    workCategory: work.workCategory || "",
    categoryDescription: work.categoryDescription || "",
    works: Array.isArray(work.works) ? work.works : [],
  };
};

const WorkManagement = () => {
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));

  const [workData, setWorkData] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchWorkCategories = useCallback(
    async (page = 1, limit = 10) => {
      setIsLoading(true);
      try {
        const response = await getAllWork(page, limit);
        if (response.status === 200 || response.status === 201) {
          const data = response.data?.data || {};
          const workCategories = data.works || [];
          setWorkData(workCategories.map(mapWorkRecord));
          setTotalPages(data.totalPages || 0);
          setCurrentPage(data.currentPage || 1);
          setTotal(data.total || 0);
        } else {
          setWorkData([]);
          enqueueSnackbar(
            response.data?.message || "Unable to load work categories.",
            {
              variant: "error",
            },
          );
        }
      } catch (error) {
        console.error("Error fetching work categories:", error);
        setWorkData([]);
        enqueueSnackbar("Work categories load failed.", { variant: "error" });
      } finally {
        setIsLoading(false);
      }
    },
    [enqueueSnackbar],
  );

  useEffect(() => {
    fetchWorkCategories(currentPage, rowsPerPage);
  }, []);

  const handlePageChange = (newPage, newRowsPerPage) => {
    setCurrentPage(newPage);
    setRowsPerPage(newRowsPerPage);
    fetchWorkCategories(newPage, newRowsPerPage);
  };

  const handleRowsPerPageChange = (newPage, newRowsPerPage) => {
    setCurrentPage(newPage);
    setRowsPerPage(newRowsPerPage);
    fetchWorkCategories(newPage, newRowsPerPage);
  };

  const handleAddWork = () => {
    setSelectedWork(null);
    setIsEditMode(false);
    setDialogOpen(true);
  };

  const handleEditWork = (workId) => {
    const workRecord = workData.find((item) => item.id === workId);
    if (!workRecord) return;
    setSelectedWork(workRecord);
    setIsEditMode(true);
    setDialogOpen(true);
  };

  const handleViewWork = (workId) => {
    const workRecord = workData.find((item) => item.id === workId);
    if (!workRecord) return;
    setSelectedWork(workRecord);
    setViewDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setIsEditMode(false);
    setSelectedWork(null);
  };

  const handleViewClose = () => {
    setViewDialogOpen(false);
    setSelectedWork(null);
  };

  const handleSaveWork = async (formData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        workCategory: formData.workCategory,
        categoryDescription: formData.categoryDescription || "",
        works: formData.works.map((workItem) => ({
          image: Array.isArray(workItem.image)
            ? workItem.image
            : workItem.image
              ? [workItem.image]
              : [],
          title: workItem.title,
          url: workItem.url,
          description: workItem.description,
          purpose: workItem.purpose || "",
        })),
      };

      const response = isEditMode
        ? await updateWork(selectedWork.id, payload)
        : await createWork(payload);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(
          response.data?.message || "Work category saved successfully.",
          {
            variant: "success",
          },
        );
        handleDialogClose();
        await fetchWorkCategories(currentPage, rowsPerPage);
      } else {
        enqueueSnackbar(
          response.data?.message || "Failed to save work category.",
          {
            variant: "error",
          },
        );
      }
    } catch (error) {
      console.error("Error saving work category:", error);
      enqueueSnackbar("Something went wrong while saving.", {
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleDeleteWork = async (id) => {
  //   const confirmation = await deleteConfirm({
  //     title: "Delete Work Category?",
  //     text: "Are you sure you want to delete this work category?",
  //     confirmButtonText: "Delete",
  //   });

  //   if (!confirmation.isConfirmed) {
  //     return;
  //   }

  //   setIsLoading(true);
  //   try {
  //     const response = await deleteWork(id);
  //     if (response.status === 200 || response.status === 201) {
  //       Swal.fire(
  //         "Deleted!",
  //         response.data?.message || "Work category removed.",
  //         "success"
  //       );
  //       await fetchWorkCategories();
  //     } else {
  //       enqueueSnackbar(
  //         response.data?.message || "Failed to delete work category.",
  //         {
  //           variant: "error",
  //         }
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Error deleting work category:", error);
  //     enqueueSnackbar("Something went wrong while deleting.", {
  //       variant: "error",
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const handleDeleteWork = async (id) => {
    try {
      const confirmation = await deleteConfirm({
        title: "Delete Work Category?",
        text: "Are you sure you want to delete this work category?",
        confirmButtonText: "Delete",
      });

      if (!confirmation.isConfirmed) return;

      setIsLoading(true);

      const response = await deleteWork(id);
      console.log(response, "delete  Work Category");

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message, { variant: "sucess" });

        fetchWorkCategories(currentPage, rowsPerPage);
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("Delete FAQ error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const tableRows = useMemo(() => {
    return workData;
  }, [workData]);

  return (
    <Box sx={{ p: 3 }}>
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
          Work Management
        </Typography>
        <Typography variant="body1" sx={{ color: "#B0B0B0", fontSize: "16px" }}>
          Manage your works, add new projects, and update existing ones
        </Typography>
      </Box>

      {perms.isCreate && (
        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleAddWork}
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
            Add New Work
          </Button>
        </Box>
      )}

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
          tableHeader={TABLE_HEADERS}
          tableData={tableRows}
          displayRows={DISPLAY_ROWS}
          handleEditService={handleEditWork}
          handleViewService={handleViewWork}
          isLoading={isLoading || isSubmitting}
          showPagination={true}
          handleDeleteService={handleDeleteWork}
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

      <AddEditWorkDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSave={handleSaveWork}
        editData={isEditMode ? selectedWork : null}
        isEdit={isEditMode}
        loading={isSubmitting}
      />

      <ViewWorkDialog
        open={viewDialogOpen}
        onClose={handleViewClose}
        workData={selectedWork}
      />
    </Box>
  );
};

export default WorkManagement;
