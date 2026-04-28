import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { Plus } from "lucide-react";
import PaginatedTable from "../../components/dynamicTable";
import AddEditUserRoleDialog from "./addEditUserRole";
import {
  createUserRole,
  deleteUserRole,
  getAllUserRole,
  updateUserRole,
} from "../../api/module/userRole";
import { useSnackbar } from "notistack";
import { deleteConfirm } from "../../components/customSweetAlert";
import useUserStore from "../../zustand/useUserStore";
import { useLocation } from "react-router-dom";

const UserRole = () => {
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));

  // Table headers configuration
  const tableHeaders = [
    { id: "id", title: "ID", align: "center" },
    { id: "roleName", title: "Role Name", align: "center" },
    { id: "totalRoutes", title: "Modules", align: "center" },
    { id: "assignedPages", title: "Assigned Modules", align: "center" },
    { id: "actions", title: "Actions", align: "center" },
  ];

  const displayRows = [
    "id",
    "roleName",
    "totalRoutes",
    "assignedPages",
    "actions",
  ];

  const [userRoleData, setUserRoleData] = useState([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const fetchUserRoles = async () => {
    try {
      setIsTableLoading(true);
      const response = await getAllUserRole();

      if (response.status === 200 || response.status === 201) {
        const roles =
          response.data?.data?.userRoles ||
          response.data?.data ||
          response.data?.userRoles ||
          [];

        setUserRoleData(Array.isArray(roles) ? roles : []);
      } else {
        enqueueSnackbar(response.data?.message || "Failed to fetch roles", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Fetch roles error:", error);
      enqueueSnackbar("Something went wrong while fetching roles.", {
        variant: "error",
      });
    } finally {
      setIsTableLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const handleAddUserRole = () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };

  const handleEditUserRole = (roleId) => {
    const role = userRoleData.find((r) => (r._id || r.id) === roleId);
    if (role) {
      setEditData(role);
      setIsEdit(true);
      setDialogOpen(true);
    }
  };

  const handleSaveUserRole = async (formData, roleId) => {
    try {
      setIsSavingRole(true);

      const payload = {
        roleName: formData.roleName.trim().toLowerCase(),
        routes: formData.routes,
        totalRoutes: formData.routes?.length || 0,
      };

      const response = roleId
        ? await updateUserRole(roleId, payload)
        : await createUserRole(payload);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data?.message || "Role saved successfully", {
          variant: "success",
        });
        setDialogOpen(false);
        setEditData(null);
        setIsEdit(false);
        await fetchUserRoles();
      } else {
        enqueueSnackbar(response.data?.message || "Failed to save role", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Save role error:", error);
      enqueueSnackbar("Something went wrong while saving the role.", {
        variant: "error",
      });
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleDeleteUserRole = async (roleId) => {
    try {
      const confirmation = await deleteConfirm({
        title: "Delete Role?",
        text: "Ye role delete ho jayega aur access remove ho jayega. Continue?",
        confirmButtonText: "Delete",
      });

      if (!confirmation.isConfirmed) return;

      const response = await deleteUserRole(roleId);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data?.message || "Role deleted", {
          variant: "success",
        });
        await fetchUserRoles();
      } else {
        enqueueSnackbar(response.data?.message || "Failed to delete role", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Delete role error:", error);
      enqueueSnackbar("Something went wrong while deleting the role.", {
        variant: "error",
      });
    }
  };

  const formatAssignedPages = (routes = []) => {
    if (!Array.isArray(routes) || routes.length === 0) return "-";
    const titles = routes
      .map((route) => route.title || route.name || route.path)
      .filter(Boolean);
    if (titles.length === 0) return "-";
    if (titles.length <= 3) return titles.join(", ");
    return `${titles.slice(0, 3).join(", ")} +${titles.length - 3}`;
  };

  const formatRoleName = (roleName = "") =>
    roleName.replace(/\b\w/g, (char) => char.toUpperCase());

  const tableData = useMemo(
    () =>
      (userRoleData || []).map((role, index) => ({
        ...role,
        id: index + 1,
        roleName: role.roleName ? formatRoleName(role.roleName) : "-",
        assignedPages: formatAssignedPages(role.routes),
        totalRoutes: role.totalRoutes ?? role.routes?.length ?? 0,
      })),
    [userRoleData],
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Add Button */}
      {perms.isCreate && (
        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleAddUserRole}
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
          tableData={tableData}
          displayRows={displayRows}
          handleEditService={handleEditUserRole}
          handleDeleteService={handleDeleteUserRole}
          isLoading={isTableLoading}
          showPagination={true}
          showEdit={perms.isEdit ? true : false}
          showDelete={perms.isDelete ? true : false}
        />
      </Paper>

      <AddEditUserRoleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveUserRole}
        editData={editData}
        isEdit={isEdit}
        isSubmitting={isSavingRole}
      />
    </Box>
  );
};

export default UserRole;
