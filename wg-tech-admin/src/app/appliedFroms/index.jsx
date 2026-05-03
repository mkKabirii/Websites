import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { Plus } from "lucide-react";
import PaginatedTable from "../../components/dynamicTable";
import ViewFullForms from "./viewFullForms";
import {
  getAllAppliedForms,
  updateStatus,
  getAppliedFormById,
  deleteAppliedForm,
} from "../../api/module/application";
import { deleteConfirm } from "../../components/customSweetAlert";
import { useSnackbar } from "notistack";
// import AddEditAppliedFormDialog from "./addEditAppliedForm"; // Future use ke liye

const AppliedFormsManagement = () => {
  const { enqueueSnackbar } = useSnackbar();

  // Table headers configuration
  const tableHeaders = [
    { id: "id", title: "ID", align: "center" },
    { id: "applicantInfo", title: "Applicant Info", align: "left" },
    { id: "contactInfo", title: "Contact", align: "center" },
    { id: "education", title: "Education", align: "left" },
    { id: "skills", title: "Skills", align: "center" },
    { id: "selectStatus", title: "Status", align: "center" },
    { id: "view", title: "View", align: "center" },
    { id: "actions", title: "Actions", align: "center" },
  ];

  const displayRows = [
    "id",
    "applicantInfo",
    "contactInfo",
    "education",
    "skills",
    "selectStatus",
    "view",
    "actions",
  ];

  const [appliedFormsData, setAppliedFormsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [viewData, setViewData] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    handleGetAppliedForms(currentPage, rowsPerPage);
  }, []);

  // Transform API data to UI format
  const transformApplicationData = (apiData) => {
    return {
      id: apiData._id,
      _id: apiData._id,
      firstName: apiData.firstName || "",
      lastName: apiData.lastName || "",
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
      passportImages: [], // API se nahi aa raha, empty array
      isAgree: apiData.certification || false,
      jobType: "N/A", // API se nahi aa raha
      status: apiData.status
        ? apiData.status.charAt(0).toUpperCase() + apiData.status.slice(1)
        : "Pending",
      // Original API data bhi save karo for view
      originalData: apiData,
    };
  };

  const handleGetAppliedForms = async (page = 1, limit = 10) => {
    setIsLoading(true);
    try {
      const response = await getAllAppliedForms(page, limit);
      if (response.status === 200 || response.status === 201) {
        const data = response?.data?.data || {};
        const transformedData = (data.applications || []).map(transformApplicationData);
        setAppliedFormsData(transformedData);
        setTotalPages(data.totalPages || 0);
        setCurrentPage(parseInt(data.currentPage) || 1);
        setTotal(data.total || 0);
      } else {
        enqueueSnackbar(
          response.data?.message || "Failed to fetch applications",
          { variant: "error" }
        );
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      enqueueSnackbar("Failed to fetch applications!", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAppliedForm = () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };

  const handleChangeStatus = async (status, rowId) => {
    try {
      // Convert status to lowercase for API
      const statusLower = status.toLowerCase();
      const response = await updateStatus(rowId, statusLower);
      
      if (response.status === 200 || response.status === 201) {
        // Update local state
        setAppliedFormsData((prev) =>
          prev.map((f) =>
            f.id === rowId || f._id === rowId
              ? { ...f, status }
              : f
          )
        );
        enqueueSnackbar("Status updated successfully", { variant: "success" });
      } else {
        enqueueSnackbar(
          response.data?.message || "Failed to update status",
          { variant: "error" }
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
      enqueueSnackbar("Failed to update status!", { variant: "error" });
    }
  };

  const handleViewForm = async (formId) => {
    try {
      setIsLoading(true);
      const response = await getAppliedFormById(formId);
      
      if (response.status === 200 || response.status === 201) {
        const apiData = response?.data?.data?.application || response?.data?.data;
        const transformedData = transformApplicationData(apiData);
        setViewData(transformedData);
        setShowViewForm(true);
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
      setIsLoading(false);
    }
  };

  const handleDeleteAppliedForm = async (id) => {
    try {
      const result = await deleteConfirm({
        title: "Delete Application?",
        text: "Are you sure you want to delete this application?",
        confirmButtonText: "Delete",
      });

      if (!result.isConfirmed) return;

      setIsLoading(true);

      const response = await deleteAppliedForm(id);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar("Application deleted successfully", {
          variant: "success",
        });
        await handleGetAppliedForms(currentPage, rowsPerPage);
      } else {
        enqueueSnackbar(response.data?.message || "Failed to delete application", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      enqueueSnackbar("Something went wrong", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToList = (shouldRefresh = false) => {
    setShowViewForm(false);
    setViewData(null);
    if (shouldRefresh === true) {
      handleGetAppliedForms(currentPage, rowsPerPage);
    }
  };

  const handlePageChange = (newPage, newRowsPerPage) => {
    setCurrentPage(newPage);
    setRowsPerPage(newRowsPerPage);
    handleGetAppliedForms(newPage, newRowsPerPage);
  };

  const handleRowsPerPageChange = (newPage, newRowsPerPage) => {
    setCurrentPage(newPage);
    setRowsPerPage(newRowsPerPage);
    handleGetAppliedForms(newPage, newRowsPerPage);
  };

  const statusOptions = [
    { label: "Pending", value: "Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
  ];

  // If showing view form, render the view component
  if (showViewForm) {
    return <ViewFullForms formData={viewData} onBack={handleBackToList} />;
  }

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
          Applied Forms Management
        </Typography>
        <Typography variant="body1" sx={{ color: "#B0B0B0", fontSize: "16px" }}>
          Manage job applications, view applicant details, and update
          application status
        </Typography>
      </Box>

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
          tableData={appliedFormsData}
          displayRows={displayRows}
          isLoading={isLoading}
          showPagination={true}
          handleChangeStatus={handleChangeStatus}
          statusOptions={statusOptions}
          handleViewService={handleViewForm}
          showEdit={false}
          handleDeleteService={handleDeleteAppliedForm}
          // Server-side pagination props
          totalPages={totalPages}
          currentPage={currentPage}
          total={total}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>
    </Box>
  );
};

export default AppliedFormsManagement;
