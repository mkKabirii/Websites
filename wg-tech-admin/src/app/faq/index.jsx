import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { Plus } from "lucide-react";
import PaginatedTable from "../../components/dynamicTable";
import AddEditFAQDialog from "./addEditFAQ";
import { createFaq, deleteFaq, getFaq, updateFaq } from "../../api/module/faq";
import { useSnackbar } from "notistack";
import { deleteConfirm } from "../../components/customSweetAlert";
import useUserStore from "../../zustand/useUserStore";
import { useLocation } from "react-router-dom";

const FAQManagement = () => {
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));
  // Table headers configuration
  const tableHeaders = [
    { id: "id", title: "ID", align: "center" },
    { id: "title", title: "Title", align: "center" },
    { id: "body", title: "Body", align: "center" },
    { id: "actions", title: "Actions", align: "center" },
  ];

  const displayRows = ["id", "title", "body", "actions"];

  const [faqData, setFaqData] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    handleGetFaq(currentPage, rowsPerPage);
  }, []);

  const handleGetFaq = async (page = 1, limit = 10) => {
    setIsLoading(true);

    try {
      const response = await getFaq(page, limit);
      console.log(response.data.data, "faq response");

      if (response.status === 200 || response.status === 201) {
        const data = response?.data?.data || {};
        setFaqData(data.faqs || []);
        setTotalPages(data.totalPages || 0);
        setCurrentPage(data.currentPage || 1);
        setTotal(data.total || 0);
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("FAQ Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage, newRowsPerPage) => {
    setCurrentPage(newPage);
    setRowsPerPage(newRowsPerPage);
    handleGetFaq(newPage, newRowsPerPage);
  };

  const handleRowsPerPageChange = (newPage, newRowsPerPage) => {
    setCurrentPage(newPage);
    setRowsPerPage(newRowsPerPage);
    handleGetFaq(newPage, newRowsPerPage);
  };
  const handleAddFAQ = () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };

  const handleEditFAQ = (faqId) => {
    const faq = faqData.find((s) => s._id === faqId);

    if (faq) {
      setEditData(faq);
      setIsEdit(true);
      setDialogOpen(true);
    }
  };

  const handleSaveFAQ = async (formData) => {
    setIsLoading(true);

    try {
      const payload = {
        title: formData.title,
        body: formData.body,
      };

      const response = isEdit
        ? await updateFaq(editData._id, payload)
        : await createFaq(payload);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message || "FAQ saved successfully!", {
          variant: "success",
        });

        await handleGetFaq();
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
      setIsLoading(false);
    }
  };

  //  const handleDeleteFaq = async (id) => {
  //   try {
  //     const result = await deleteConfirm({
  //       title: "Delete FAQ?",
  //       text: "Are you sure you want to delete this FAQ?",
  //       confirmButtonText: "Delete"
  //     });

  //     if (!result.isConfirmed) return;

  //     setIsLoading(true);

  //     const response = await deleteFaq(id);

  //     if (response.status === 200 || response.status === 201) {

  //       await Swal.fire({
  //         title: "Deleted!",
  //         text: response.data.message,
  //         icon: "success"
  //       });

  //       await handleGetFaq();

  //     } else {
  //       enqueueSnackbar(response.data.message, { variant: "error" });
  //     }

  //   } catch (error) {
  //     console.log("Delete FAQ error:", error);

  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleDeleteFaq = async (id) => {
    try {
      const result = await deleteConfirm({
        title: "Delete FAQ?",
        text: "Are you sure you want to delete this FAQ?",
        confirmButtonText: "Delete",
      });

      if (!result.isConfirmed) return;

      setIsLoading(true);

      const response = await deleteFaq(id);
      console.log(response, "delte service");

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message, { variant: "sucess" });

        handleGetFaq(currentPage, rowsPerPage);
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
          FAQ Management
        </Typography>
        <Typography variant="body1" sx={{ color: "#B0B0B0", fontSize: "16px" }}>
          Manage your FAQs, add new ones, and update existing entries
        </Typography>
      </Box>

      {/* Add Button */}
      {perms.isCreate && (
        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleAddFAQ}
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
            Add New FAQ
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
          tableData={faqData || []}
          displayRows={displayRows}
          handleEditService={handleEditFAQ}
          handleDeleteService={handleDeleteFaq}
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

      <AddEditFAQDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveFAQ}
        editData={editData}
        isEdit={isEdit}
      />
    </Box>
  );
};

export default FAQManagement;
