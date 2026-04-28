import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { Plus } from "lucide-react";
import PaginatedTable from "../../components/dynamicTable";
import AddEditUserDialog from "./addEditUser";
import { useSnackbar } from "notistack";
import { deleteConfirm } from "../../components/customSweetAlert";
import {
  getAllUsers,
  deleteUser,
  createUser,
  updateUser,
} from "../../api/module/user";
import { getAllUserRole } from "../../api/module/userRole";
import useUserStore from "../../zustand/useUserStore";
import { useLocation } from "react-router-dom";

const Users = () => {
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));

  // Table headers configuration
  const tableHeaders = [
    { id: "id", title: "ID", align: "center" },
    { id: "username", title: "Username", align: "center" },
    { id: "userEmail", title: "Email", align: "center" },
    { id: "designation", title: "Designation", align: "center" },
    { id: "actions", title: "Actions", align: "center" },
  ];

  const displayRows = ["id", "username", "email", "designation", "actions"];

  const [userData, setUserData] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await getAllUsers();
      if (res.status === 200 || res.status === 201) {
        const users = res.data?.data?.users || res.data?.data || [];
        setUserData(Array.isArray(users) ? users : []);
      } else {
        enqueueSnackbar(res.data?.message || "Failed to fetch users", {
          variant: "error",
        });
      }
    } catch (e) {
      console.error(e);
      enqueueSnackbar("Something went wrong fetching users", {
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await getAllUserRole();
      if (res.status === 200 || res.status === 201) {
        const list = res.data?.data?.userRoles || res.data?.data || [];
        setRoles(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleAddUser = () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };

  const handleEditUser = (userId) => {
    const user = userData.find((u) => (u._id || u.id) === userId);
    if (user) {
      setEditData(user);
      setIsEdit(true);
      setDialogOpen(true);
    }
  };

  const handleSaveUser = async (formData, userId) => {
    try {
      setIsSubmitting(true);
      const payload = {
        email: formData.userEmail.trim(),
        username: formData.username.trim(),
        password: formData.password?.trim(),
        designation: formData.designation?._id || formData.designation || null,
        role: String(formData.designation?.roleName || "").toLowerCase(),
        assignedClients: formData.assignedClients || [],
      };

      // For update, if password is empty, remove it
      if (userId && !payload.password) delete payload.password;

      const res = userId
        ? await updateUser(userId, payload)
        : await createUser(payload);

      if (res.status === 200 || res.status === 201) {
        enqueueSnackbar(res.data?.message || "User saved", {
          variant: "success",
        });
        setDialogOpen(false);
        setEditData(null);
        setIsEdit(false);
        await fetchUsers();
      } else {
        enqueueSnackbar(res.data?.message || "Failed to save user", {
          variant: "error",
        });
      }
    } catch (e) {
      console.error(e);
      enqueueSnackbar("Something went wrong saving user", { variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const confirm = await deleteConfirm({
        title: "Delete User?",
        text: "Ye user delete ho jayega. Continue?",
        confirmButtonText: "Delete",
      });
      if (!confirm.isConfirmed) return;
      const res = await deleteUser(userId);
      if (res.status === 200 || res.status === 201) {
        enqueueSnackbar(res.data?.message || "User deleted", {
          variant: "success",
        });
        await fetchUsers();
      } else {
        enqueueSnackbar(res.data?.message || "Failed to delete user", {
          variant: "error",
        });
      }
    } catch (e) {
      console.error(e);
      enqueueSnackbar("Something went wrong deleting user", {
        variant: "error",
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Add Button */}
      {perms.isCreate && (
        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleAddUser}
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
            Add New User
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
          tableData={useMemo(
            () =>
              (userData || []).map((u, idx) => ({
                ...u,
                id: idx + 1,
                designation:
                  u.designation?.roleName || u.designationName || "-",
              })),
            [userData],
          )}
          displayRows={displayRows}
          handleEditService={handleEditUser}
          handleDeleteService={(id) => handleDeleteUser(id)}
          isLoading={isLoading}
          showPagination={true}
          showEdit={perms.isEdit ? true : false}
          showDelete={perms.isDelete ? true : false}
        />
      </Paper>

      <AddEditUserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveUser}
        editData={editData}
        isEdit={isEdit}
        roles={roles}
        isSubmitting={isSubmitting}
      />
    </Box>
  );
};

export default Users;
