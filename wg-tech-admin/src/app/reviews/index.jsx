import { Box, Button, Paper, Typography } from "@mui/material";
import { Plus } from "lucide-react";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import {
  createReview,
  deleteReview,
  getAllReview,
  updateReview,
} from "../../api/module/review";
import PaginatedTable from "../../components/dynamicTable";
import AddEditReviewsDialog from "./addEditReviews";
import { deleteConfirm } from "../../components/customSweetAlert";
import useUserStore from "../../zustand/useUserStore";
import { useLocation } from "react-router-dom";
const ReviewsManagement = () => {
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const tableHeaders = [
    { id: "id", title: "ID", align: "center" },
    { id: "userInfo", title: "User Info", align: "center" },
    { id: "rating", title: "Rating", align: "center" },
    { id: "review", title: "Review", align: "center" },
    { id: "actions", title: "Actions", align: "center" },
  ];

  const displayRows = ["id", "userInfo", "rating", "review", "actions"];

  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewsData, setReviewsData] = useState([]);

  useEffect(() => {
    handleGetReveiw();
  }, []);
  // console.log(roleOptions, "roleOptionsroleOptionsroleOptions");

  const handleAddReview = () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };

  const handleEditReview = (reviewId) => {
    const review = reviewsData.find((r) => r._id === reviewId);
    if (review) {
      setEditData(review);
      setIsEdit(true);
      setDialogOpen(true);
    }
  };

  const handleGetReveiw = async () => {
    try {
      setIsLoading(true);
      const response = await getAllReview();
      console.log(response, "responseresponse");

      if (response.status === 200 || response.status === 201) {
        setReviewsData(response?.data?.data?.reviews || []);
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.error("Error fetching Review:", error);
      enqueueSnackbar("Failed to fetch Review!", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };
  const handleSaveReview = async (formData) => {
    setSaving(true);

    try {
      const payload = {
        userInfo: {
          name: formData.userInfo.name.trim(),
          email: formData.userInfo.email.trim().toLowerCase(),
          image: formData.userInfo.image,
        },
        rating: formData.rating,
        review: formData.review,
      };

      console.log("Payload to send:", payload);

      const response = isEdit
        ? await updateReview(editData._id, payload)
        : await createReview(payload);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data?.message || "Success!", {
          variant: "success",
        });
        console.log(response, "responseresponse");
        await handleGetReveiw();

        setDialogOpen(false);
      } else {
        enqueueSnackbar(response.data?.message || "Something went wrong!", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Save Review Error:", error);
      enqueueSnackbar("Something went wrong!", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  // const handleDeleteReveiw = async (id) => {
  //   try {
  //     const result = await deleteConfirm({
  //       title: "Delete Review?",
  //       text: "Are you sure you want to delete this review?",
  //       confirmButtonText: "Delete",
  //     });

  //     if (!result.isConfirmed) return;

  //     setIsLoading(true);

  //     const response = await deleteReview(id);

  //     if (response.status === 200 || response.status === 201) {
  //       await Swal.fire({
  //         title: "Deleted!",
  //         text: response.data.message,
  //         icon: "success",
  //       });

  //       await handleGetReveiw();
  //     } else {
  //       enqueueSnackbar(response.data.message, { variant: "error" });
  //     }
  //   } catch (error) {
  //     console.log("Delete Review Error:", error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const handleDeleteReveiw = async (id) => {
    try {
      const result = await deleteConfirm({
        title: "Delete Review?",
        text: "Are you sure you want to delete this review?",
        confirmButtonText: "Delete",
      });

      if (!result.isConfirmed) return;

      setIsLoading(true);

      const response = await deleteReview(id);
      console.log(response, "delte service");

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message, { variant: "sucess" });

        handleGetReveiw();
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
          Reviews Management
        </Typography>
        <Typography variant="body1" sx={{ color: "#B0B0B0", fontSize: "16px" }}>
          Manage your reviews, add new ones, and update existing reviews
        </Typography>

        {/* Add Button */}
        {perms.isCreate && (
          <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={<Plus size={20} />}
              onClick={handleAddReview}
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
              Add New Review
            </Button>
          </Box>
        )}
      </Box>

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
          tableData={reviewsData}
          displayRows={displayRows}
          handleEditService={handleEditReview}
          showPagination={true}
          handleDeleteService={handleDeleteReveiw}
          isLoading={isLoading}
          showEdit={perms.isEdit ? true : false}
          showDelete={perms.isDelete ? true : false}
        />
      </Paper>

      <AddEditReviewsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveReview}
        editData={editData}
        isEdit={isEdit}
        loading={isLoading}
      />
    </Box>
  );
};

export default ReviewsManagement;
