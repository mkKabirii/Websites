import { Box, Button, Paper, Typography } from "@mui/material";
import { Plus } from "lucide-react";
import { useSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  createProposal,
  deleteProposals,
  getProposal,
  updateProposals,
} from "../../api/module/proposal";
import {
  optionGetWorkService,
  optionGetWorkSubServiceById,
} from "../../api/module/work";
import PaginatedTable from "../../components/dynamicTable";
import AddEditProposalsDialog from "./addEditProposals";
import { deleteConfirm } from "../../components/customSweetAlert";
import useUserStore from "../../zustand/useUserStore";

const ProposalsManagement = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));
  // Table headers configuration
  const tableHeaders = [
    { id: "id", title: "ID", align: "center" },
    { id: "proposalId", title: "proposal Id", align: "center" },
    { id: "clientInfo", title: "Client Info", align: "left" },
    { id: "services", title: "Services", align: "center" },
    { id: "budget", title: "Budget", align: "center" },
    { id: "message", title: "Message", align: "left" },
    { id: "selectStatus", title: "Status", align: "center" },
    { id: "viewProposal", title: "View", align: "center" },
    { id: "actions", title: "Actions", align: "center" },
  ];

  const displayRows = [
    "id",
    "proposalId",
    "clientInfo",
    "services",
    "budget",
    "message",
    "selectStatus",
    "viewProposal",
    "actions",
  ];
  const mapServiceOption = (service) => ({
    id: String(service._id || service.id || ""),
    title: service.title,
    image: service.image,
  });

  // State for proposals data
  const [proposalsData, setProposalsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [proposal, setProposal] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Load proposals data on component mount
  useEffect(() => {
    handleGetProposal(currentPage, rowsPerPage);
    fetchServices();
  }, []);
  const fetchServices = useCallback(async () => {
    try {
      const response = await optionGetWorkService();
      if (response.status === 200 || response.status === 201) {
        const servicesList = response.data?.data?.services || [];
        setServices(servicesList.map(mapServiceOption));
        console.log(servicesList, "servicesListservicesList");
      } else {
        setServices([]);
        enqueueSnackbar(response.data?.message || "Unable to load services.", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
      enqueueSnackbar("Service list load failed.", { variant: "error" });
    }
  }, [enqueueSnackbar]);

  const handleGetProposal = async (page = 1, limit = 10) => {
    setIsLoading(true);

    try {
      const response = await getProposal(page, limit);
      console.log(response.data.data, "responceProposalData");

      if (response.status === 200 || response.status === 201) {
        const data = response?.data?.data || {};
        setProposal(data.proposals || []);
        setTotalPages(data.totalPages || 0);
        setCurrentPage(parseInt(data.currentPage) || 1);
        setTotal(data.total || 0);
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("Proposal Fetch Error:", error);
      enqueueSnackbar("Failed to fetch proposals!", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProposal = () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };

  const statusOptions = [
    { label: "Pending", value: "Pending" },
    { label: "Accepted", value: "Accepted" },
    { label: "Rejected", value: "Rejected" },
    { label: "In Progress", value: "In Progress" },
    { label: "Completed", value: "Completed" },
  ];

  const handleViewProposal = (rowOrId) => {
    const id = getRowId(rowOrId);
    if (!id) return;
    navigate(`/proposals/${id}`);
  };

  const handleEditProposal = (rowOrId) => {
    // Always resolve the original row (with IDs), not the decorated table data
    const id = getRowId(rowOrId);
    const original = (proposal || []).find(
      (p) => String(p._id || p.id) === String(id),
    );
    setEditData(original || rowOrId);
    setIsEdit(true);
    setDialogOpen(true);
  };

  const getRowId = (rowOrId) => {
    if (!rowOrId) return undefined;
    if (typeof rowOrId === "string") return rowOrId;
    if (typeof rowOrId === "number") return rowOrId;
    return (
      rowOrId._id || rowOrId.id || rowOrId.proposalId || rowOrId.proposal_id
    );
  };

  // ensure table shows service titles not ids
  const proposalsForTable = (proposal || []).map((p) => {
    const titles =
      Array.isArray(p.services) && services?.length
        ? p.services
            .map((sid) => {
              const s = services.find(
                (sv) =>
                  String(sv.id) === String(sid) ||
                  String(sv._id) === String(sid),
              );
              return s ? s.title : undefined;
            })
            .filter(Boolean)
        : [];
    // Ensure a stable id field for table actions
    return { ...p, id: p._id || p.id, services: titles };
  });

  const handleSaveProposal = async (formData) => {
    setIsLoading(true);
    try {
      const payload = {
        fullname: formData.fullname,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        services: formData.services, // array of ids
        subServices: formData.subServices, // array of ids
        budget: String(formData.budget), // schema expects string
        messages: formData.messages,
        status: formData.status,
        isActive: true,
      };

      const response = isEdit
        ? await updateProposals(editData._id || editData.id, payload)
        : await createProposal(payload);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message || "Add ssuccessfully!", {
          variant: "success",
        });
        console.log(response.data.data, "responeRoleeeeeee");

        setDialogOpen(false);
        await handleGetProposal(currentPage, rowsPerPage);
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

  // re-define handlers after helper to accept either id or row object
  const handleChangeStatus = async (status, rowOrId) => {
    const rowId = getRowId(rowOrId);
    if (!rowId) return;
    try {
      setIsLoading(true);
      const response = await updateProposals(rowId, { status });
      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data?.message || "Status updated", {
          variant: "success",
        });
        await handleGetProposal(currentPage, rowsPerPage);
      } else {
        enqueueSnackbar(response.data?.message || "Failed to update status", {
          variant: "error",
        });
      }
    } catch (error) {
      enqueueSnackbar("Failed to update status", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (isActive, rowOrId) => {
    const rowId = getRowId(rowOrId);
    if (!rowId) return;
    try {
      setIsLoading(true);
      const response = await updateProposals(rowId, { isActive });
      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data?.message || "Updated", {
          variant: "success",
        });
        await handleGetProposal(currentPage, rowsPerPage);
      } else {
        enqueueSnackbar(response.data?.message || "Failed to update", {
          variant: "error",
        });
      }
    } catch (error) {
      enqueueSnackbar("Failed to update", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteParposal = async (id) => {
    try {
      const confirmation = await deleteConfirm({
        title: "Delete Proposal?",
        text: "Are you sure you want to delete this proposal?",
        confirmButtonText: "Delete",
      });

      if (!confirmation.isConfirmed) return;

      setIsLoading(true);

      const response = await deleteProposals(id);
      console.log(response, "Deleted Proposal");

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message, { variant: "success" });
        await handleGetProposal(currentPage, rowsPerPage); // refresh table after delete
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("Delete Proposal error:", error);
      enqueueSnackbar("Something went wrong while deleting.", {
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage, newRowsPerPage) => {
    setCurrentPage(newPage);
    setRowsPerPage(newRowsPerPage);
    handleGetProposal(newPage, newRowsPerPage);
  };

  const handleRowsPerPageChange = (newPage, newRowsPerPage) => {
    setCurrentPage(newPage);
    setRowsPerPage(newRowsPerPage);
    handleGetProposal(newPage, newRowsPerPage);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
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
              Proposals Management
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "#B0B0B0", fontSize: "16px" }}
            >
              Manage client proposals, view project details, and update proposal
              status
            </Typography>
          </Box>

          {/* Add Proposal Button */}
          {perms.isCreate && (
            <Button
              variant="contained"
              startIcon={<Plus size={20} />}
              onClick={handleAddProposal}
              sx={{
                backgroundColor: "#8CE600",
                color: "#000000",
                fontWeight: 600,
                px: 3,
                py: 1.5,
                borderRadius: "12px",
                textTransform: "none",
                fontSize: "16px",
                "&:hover": {
                  backgroundColor: "#7BCC00",
                },
              }}
            >
              Add Proposal
            </Button>
          )}
        </Box>
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
          tableData={proposalsForTable}
          displayRows={displayRows}
          isLoading={isLoading}
          showPagination={true}
          handleChangeStatus={handleChangeStatus}
          statusOptions={statusOptions}
          handleViewProposal={handleViewProposal}
          handleToggleStatus={handleToggleStatus}
          handleEditProposal={handleEditProposal}
          handleDeleteService={handleDeleteParposal}
          showEdit={perms.isEdit ? true : false}
          showDelete={perms.isDelete ? true : false}
          // Server-side pagination props
          totalPages={totalPages}
          currentPage={currentPage}
          total={total}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>

      {/* Add/Edit Proposal Dialog */}
      <AddEditProposalsDialog
        open={dialogOpen}
        services={services}
        onClose={() => {
          setDialogOpen(false);
          setEditData(null);
          setIsEdit(false);
        }}
        onSave={handleSaveProposal}
        editData={editData}
        isEdit={isEdit}
      />
    </Box>
  );
};

export default ProposalsManagement;
