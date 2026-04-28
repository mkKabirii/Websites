import { Box, Button, Grid, Paper, Typography } from "@mui/material";
import { Plus } from "lucide-react";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import {
  createAdvertisement,
  deleteAdvertisement,
  getAllAdvertisement,
  updateAdvertisement,
} from "../../api/module/advertisement";
import { CustomButton, TextInput } from "../../components";
import { deleteConfirm } from "../../components/customSweetAlert";
import PaginatedTable from "../../components/dynamicTable";
import AddEditAdvertisementDialog from "./addEditAdvertisement";
import useUserStore from "../../zustand/useUserStore";
import { useLocation } from "react-router-dom";

const AdvertisementManagement = () => {
  // Table headers configuration
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));

  const tableHeaders = [
    { id: "id", title: "ID", align: "center" },
    { id: "image", title: "Image", align: "center" },
    { id: "status", title: "Status", align: "center" },
    { id: "actions", title: "Actions", align: "center" },
  ];

  const displayRows = ["id", "image", "status", "actions"];

  // Sample data
  const [advertisementData, setAdvertisementData] = useState([
    {
      id: 1,
      image: "https://cdn-icons-png.flaticon.com/512/1829/1829585.png",
      status: "Active",
    },
    {
      id: 2,
      image: "https://cdn-icons-png.flaticon.com/512/1829/1829578.png",
      status: "Active",
    },
    {
      id: 3,
      image: "https://cdn-icons-png.flaticon.com/512/1829/1829592.png",
      status: "Active",
    },
  ]);
  //Advertisement
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const handleAddAdvertisement = () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };

  useEffect(() => {
    handleGetAdvertisement();
  }, []);

  const handleGetAdvertisement = async () => {
    setIsLoading(true);
    try {
      const response = await getAllAdvertisement();
      console.log(response?.data?.data?.advertisements, "responcsssss");
      if (response.status == 200 || response.status == 201) {
        setAdvertisementData(response?.data?.data?.advertisements || []);
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log(error, "faqerrorerrorerrorerror");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSaveAdvertisement = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        image: formData.image,
        status: formData.status,
      };

      const response = isEdit
        ? await updateAdvertisement(editData._id, payload)
        : await createAdvertisement(payload);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message, { variant: "success" });
        await handleGetAdvertisement();
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

  // const handleDeleteAdvertisement = async (id) => {
  //   try {
  //     const result = await deleteConfirm({
  //       title: "Delete ?",
  //       text: "Are you sure you want to delete this story?",
  //       confirmButtonText: "Delete",
  //     });

  //     if (!result.isConfirmed) return;

  //     setIsLoading(true);

  //     const response = await deleteAdvertisement(id);

  //     if (response.status === 200 || response.status === 201) {
  //       await Swal.fire({
  //         title: "Deleted!",
  //         text: response.data.message,
  //         icon: "success",
  //       });

  //       await handleGetAdvertisement();
  //     } else {
  //       enqueueSnackbar(response.data.message, { variant: "error" });
  //     }
  //   } catch (error) {
  //     console.log("Delete Story Error:", error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const handleDeleteAdvertisement = async (id) => {
    try {
      const result = await deleteConfirm({
        title: "Delete Advertiseement?",
        text: "Are you sure you want to delete this Advertiseement?",
        confirmButtonText: "Delete",
      });

      if (!result.isConfirmed) return;

      setIsLoading(true);

      const response = await deleteAdvertisement(id);
      console.log(response, "delte service");

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message, { variant: "sucess" });

        handleGetAdvertisement();
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("Delete FAQ error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleEditAdvertisement = (advertisementId) => {
    const advertisement = advertisementData.find(
      (s) => s._id === advertisementId,
    );
    if (advertisement) {
      setEditData(advertisement);
      setIsEdit(true);
      setDialogOpen(true);
    }
  };

  // const handleSaveAdvertisement = (formData) => {
  //   if (isEdit && editData) {
  //     // Update existing advertisement
  //     setAdvertisementData((prev) =>
  //       prev.map((advertisement) =>
  //         advertisement.id === editData.id
  //           ? { ...formData, id: editData.id }
  //           : advertisement
  //       )
  //     );
  //   } else {
  //     // Add new advertisement
  //     const newAdvertisement = {
  //       ...formData,
  //       id: Math.max(...advertisementData.map((s) => s.id)) + 1,
  //     };
  //     setAdvertisementData((prev) => [...prev, newAdvertisement]);
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
          Advertisement Management
        </Typography>
        <Typography variant="body1" sx={{ color: "#B0B0B0", fontSize: "16px" }}>
          Manage your advertisements, add new ones, and update existing
          campaigns
        </Typography>
      </Box>

      {/* <Box sx={{ flexGrow: 1 }} my={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid item size={{ xs: 12, sm: 10 }}>
            <TextInput
              placeholder="Main Heading"
              onChange={(e) => setMainHeading(e.target.value)}
              value={mainHeading}
              fullWidth
            />
          </Grid>

          <Grid
            item
            size={{ xs: 12, sm: 2 }}
            display={"flex"}
            justifyContent={"flex-end"}
          >
            <CustomButton
              btnLabel="Update"
              variant="gradientbtn"
              handlePressBtn={updateMainHeading}
              width={"100%"}
              height={"52px"}
              sx={{
                height: "53px",
              }}
            />
          </Grid>
        </Grid>
      </Box> */}

      {/* Add Button */}
      {perms.isCreate && (
        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleAddAdvertisement}
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
            Add New Advertisement
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
          tableData={advertisementData || []}
          displayRows={displayRows}
          handleEditService={handleEditAdvertisement}
          isLoading={isLoading}
          showPagination={true}
          handleDeleteService={handleDeleteAdvertisement}
          showEdit={perms.isEdit ? true : false}
          showDelete={perms.isDelete ? true : false}
        />
      </Paper>

      <AddEditAdvertisementDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveAdvertisement}
        editData={editData}
        isEdit={isEdit}
        loading={isLoading}
      />
    </Box>
  );
};

export default AdvertisementManagement;
