import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Plus, RefreshCw } from "lucide-react";
import { useSnackbar } from "notistack";
import { createTask, getTasks, updateTask } from "../../api/module/task";
import { getAllUsers } from "../../api/module/user";
import { getClients } from "../../api/module/quotations";
import useUserStore from "../../zustand/useUserStore";

const statusOptions = ["Pending", "In Progress", "Completed", "Blocked"];
const priorityOptions = ["Low", "Medium", "High", "Urgent"];

const emptyForm = {
  title: "",
  description: "",
  status: "Pending",
  priority: "Medium",
  client: "",
  assignedWorker: "",
  dueDate: "",
};

const TasksManagement = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useUserStore();
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === "admin" || user?.designation?.roleName === "admin";

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getTasks();
      if (response?.status === 200 || response?.status === 201) {
        setTasks(response.data?.data?.tasks || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOptions = useCallback(async () => {
    if (!isAdmin) return;
    const [usersResponse, clientsResponse] = await Promise.all([
      getAllUsers(),
      getClients(),
    ]);

    const users = usersResponse?.data?.data?.users || [];
    setWorkers(users.filter((item) => item.role === "worker"));
    setClients(clientsResponse?.data?.data || []);
  }, [isAdmin]);

  useEffect(() => {
    fetchTasks();
    fetchOptions();
  }, [fetchOptions, fetchTasks]);

  const stats = useMemo(() => {
    return statusOptions.map((status) => ({
      status,
      count: tasks.filter((task) => task.status === status).length,
    }));
  }, [tasks]);

  const handleOpen = (task = null) => {
    setEditingTask(task);
    setForm(
      task
        ? {
            title: task.title || "",
            description: task.description || "",
            status: task.status || "Pending",
            priority: task.priority || "Medium",
            client: task.client?._id || task.client || "",
            assignedWorker: task.assignedWorker?._id || task.assignedWorker || "",
            dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
          }
        : emptyForm,
    );
    setOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      client: form.client || null,
      assignedWorker: form.assignedWorker || null,
      dueDate: form.dueDate || null,
    };

    const response = editingTask
      ? await updateTask(editingTask._id, payload)
      : await createTask(payload);

    if (response?.status === 200 || response?.status === 201) {
      enqueueSnackbar(editingTask ? "Task updated" : "Task created", {
        variant: "success",
      });
      setOpen(false);
      fetchTasks();
    } else {
      enqueueSnackbar(response?.data?.message || "Unable to save task", {
        variant: "error",
      });
    }
  };

  const statusColor = (status) => {
    if (status === "Completed") return "success";
    if (status === "Blocked") return "error";
    if (status === "In Progress") return "warning";
    return "default";
  };

  return (
    <Box sx={{ color: "#fff" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Tasks
          </Typography>
          <Typography variant="body2" sx={{ color: "#aaa" }}>
            Track client work, coworker assignments, and project progress.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={fetchTasks}
            sx={{ color: "#8CE600", borderColor: "#8CE600" }}
          >
            Refresh
          </Button>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => handleOpen()}
              sx={{ backgroundColor: "#8CE600", color: "#111" }}
            >
              New Task
            </Button>
          )}
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((item) => (
          <Grid item xs={6} md={3} key={item.status}>
            <Paper sx={{ p: 2, backgroundColor: "#171717", color: "#fff" }}>
              <Typography variant="caption" sx={{ color: "#aaa" }}>
                {item.status}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {item.count}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Stack spacing={1.5}>
        {tasks.map((task) => (
          <Paper
            key={task._id}
            sx={{
              p: 2,
              backgroundColor: "#171717",
              color: "#fff",
              border: "1px solid #2a2a2a",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {task.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "#aaa", mt: 0.5 }}>
                  {task.description || "No description"}
                </Typography>
                <Typography variant="caption" sx={{ color: "#777" }}>
                  Client: {task.client?.name || "-"} | Worker:{" "}
                  {task.assignedWorker?.fullname ||
                    task.assignedWorker?.username ||
                    "-"}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={task.priority} size="small" />
                <Chip
                  label={task.status}
                  color={statusColor(task.status)}
                  size="small"
                />
                {(isAdmin || task.assignedWorker?._id === user?._id) && (
                  <Button size="small" onClick={() => handleOpen(task)}>
                    Edit
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        ))}
        {!loading && tasks.length === 0 && (
          <Paper sx={{ p: 3, backgroundColor: "#171717", color: "#aaa" }}>
            No tasks found.
          </Paper>
        )}
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingTask ? "Update Task" : "Create Task"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              multiline
              minRows={3}
              fullWidth
            />
            <TextField
              label="Status"
              select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
              fullWidth
            >
              {statusOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            {isAdmin && (
              <>
                <TextField
                  label="Priority"
                  select
                  value={form.priority}
                  onChange={(event) =>
                    setForm({ ...form, priority: event.target.value })
                  }
                  fullWidth
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Client"
                  select
                  value={form.client}
                  onChange={(event) =>
                    setForm({ ...form, client: event.target.value })
                  }
                  fullWidth
                >
                  <MenuItem value="">None</MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client._id} value={client._id}>
                      {client.name || client.email}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Coworker"
                  select
                  value={form.assignedWorker}
                  onChange={(event) =>
                    setForm({ ...form, assignedWorker: event.target.value })
                  }
                  fullWidth
                >
                  <MenuItem value="">None</MenuItem>
                  {workers.map((worker) => (
                    <MenuItem key={worker._id} value={worker._id}>
                      {worker.fullname || worker.username || worker.email}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Due date"
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm({ ...form, dueDate: event.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TasksManagement;
