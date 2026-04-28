import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { Plus } from "lucide-react";
import PaginatedTable from "../../components/dynamicTable";
import AddEditRoleDialog from "./addEditRole";
import {
  createTeamRole,
  deleteTeamRole,
  getAllTeamRole,
  updateTeamRole,
} from "../../api/module/teamRole";
import { useSnackbar } from "notistack";
import TableSkeleton from "../../components/skeleton";
import { deleteConfirm } from "../../components/customSweetAlert";
import useUserStore from "../../zustand/useUserStore";
import { useLocation } from "react-router-dom";

const RoleManagement = () => {
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));
  // Table headers configuration
  const tableHeaders = [
    { id: "id", title: "ID", align: "center" },
    { id: "role", title: "Role", align: "center" },
    { id: "actions", title: "Actions", align: "center" },
  ];

  const displayRows = ["id", "role", "actions"];

  // Sample data - sirf id aur role
  const [roleData, setRoleData] = useState([
    {
      id: 1,
      role: "Admin",
    },
    {
      id: 2,
      role: "Manager",
    },
    {
      id: 3,
      role: "User",
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    handleGetTeamRole();
  }, []);
  const handleGetTeamRole = async () => {
    setIsLoading(true);
    try {
      const response = await getAllTeamRole();
      console.log(response.data.data.teamRoles, "responc");
      if (response.status == 200 || response.status == 201) {
        setRoleData(response.data.data.teamRoles || []);
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log(error, "faqerrorerrorerrorerror");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRole = () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };

  const handleEditRole = (roleId) => {
    const role = roleData.find((r) => r._id === roleId);
    if (role) {
      setEditData(role);
      setIsEdit(true);
      setDialogOpen(true);
    }
  };

  const handleSaveRole = async (formData) => {
    setIsLoading(true);

    // if (isEdit && editData) {
    //   // Update existing role
    //   setRoleData((prev) =>
    //     prev.map((role) =>
    //       role.id === editData.id ? { ...formData, id: editData.id } : role
    //     )
    //   );
    // } else {
    //   // Add new role
    //   const newRole = {
    //     ...formData,
    //     id: Math.max(...roleData.map((r) => r.id)) + 1,
    //   };
    //   setRoleData((prev) => [...prev, newRole]);
    // }
    try {
      const payload = {
        role: formData.role,
      };

      const response = isEdit
        ? await updateTeamRole(editData._id, payload)
        : await createTeamRole(payload);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message || "Add ssuccessfully!", {
          variant: "success",
        });
        console.log(response.data.data, "responeRoleeeeeee");

        await handleGetTeamRole();
        setDialogOpen(false);
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
  // const handleDeleteTeamRole = async (id) => {
  //   setIsLoading(true);
  //   try {
  //     const response = await deleteTeamRole(id);

  //     if (response.status === 200 || response.status === 201) {
  //       enqueueSnackbar(response.data.message, { variant: "success" });
  //       await handleGetTeamRole();
  //     } else {
  //       enqueueSnackbar(response.data.message, { variant: "error" });
  //     }
  //   } catch (error) {
  //     console.log(error, "thrfdfbdferf");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const handleDeleteTeamRole = async (id) => {
    try {
      const confirmation = await deleteConfirm({
        title: "Delete TeamRole?",
        text: "Are you sure you want to delete this TeamRole?",
        confirmButtonText: "Delete",
      });

      if (!confirmation.isConfirmed) return;

      setIsLoading(true);

      const response = await deleteTeamRole(id);
      console.log(response, "delete  Work Category");

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message, { variant: "sucess" });

        handleGetTeamRole();
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("Delete FAQ error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <TableSkeleton
        headerCells={tableHeaders}
        displayCells={displayRows}
        rowsCount={3}
        tableWidth="100%"
      />
    );
  }
  return (
    <Box sx={{ p: 0 }}>
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
          Role Management
        </Typography>
        <Typography variant="body1" sx={{ color: "#B0B0B0", fontSize: "16px" }}>
          Manage user roles, add new ones, and update existing entries
        </Typography>
      </Box>

      {/* Add Button */}
      {perms.isCreate && (
        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleAddRole}
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
            Add New Role
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
          tableData={roleData || []}
          displayRows={displayRows}
          handleEditService={handleEditRole}
          handleDeleteService={handleDeleteTeamRole}
          isLoading={false}
          showPagination={true}
          showEdit={perms.isEdit ? true : false}
          showDelete={perms.isDelete ? true : false}
        />
      </Paper>

      <AddEditRoleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveRole}
        editData={editData}
        isEdit={isEdit}
      />
    </Box>
  );
};

export default RoleManagement;
