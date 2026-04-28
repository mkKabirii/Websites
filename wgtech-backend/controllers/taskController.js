const Task = require("../model/taskModel");
const Client = require("../model/clientModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { successHandler } = require("../utils/helper");
const { createNotification, notifyUsers } = require("../utils/notificationService");

const roleOf = (user) => user?.role || user?.designation?.roleName || "user";

const buildTaskQuery = async (req) => {
  const role = roleOf(req.user);

  if (role === "admin") return { isActive: true };
  if (role === "worker") {
    return { isActive: true, assignedWorker: req.user._id };
  }

  const client = await Client.findOne({
    $or: [{ userId: req.user._id }, { email: req.user.email }],
  }).select("_id");

  return { isActive: true, client: client?._id || null };
};

const getTasks = catchAsync(async (req, res) => {
  const query = await buildTaskQuery(req);
  const tasks = await Task.find(query)
    .populate("client", "name email company projectName")
    .populate("assignedWorker", "fullname username email")
    .populate("createdBy", "fullname username email")
    .sort({ createdAt: -1 });

  successHandler(res, { tasks }, "Tasks retrieved successfully");
});

const createTask = catchAsync(async (req, res, next) => {
  if (roleOf(req.user) !== "admin") {
    return next(new AppError("Only admin can create tasks", 403));
  }

  const { title, description, status, priority, client, assignedWorker, chat, dueDate } = req.body;
  if (!title) return next(new AppError("Task title is required", 400));

  const task = await Task.create({
    title,
    description,
    status,
    priority,
    client,
    assignedWorker,
    chat,
    dueDate,
    createdBy: req.user._id,
  });

  const recipients = [assignedWorker].filter(Boolean);
  if (client) {
    const clientDoc = await Client.findById(client).select("userId");
    if (clientDoc?.userId) recipients.push(clientDoc.userId);
  }

  notifyUsers(recipients, {
    title: "New task assigned",
    message: title,
    type: "task",
    actor: req.user._id,
    entityId: task._id,
    entityType: "Task",
    link: "/tasks",
    metadata: {
      status: task.status,
      priority: task.priority,
      client,
      assignedWorker,
    },
  }).catch((notificationError) => {
    console.error("Task assignment notification failed:", notificationError.message);
  });

  successHandler(res, task, "Task created successfully", 201);
});

const updateTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(new AppError("Task not found", 404));

  const role = roleOf(req.user);
  const isAssignedWorker =
    task.assignedWorker && String(task.assignedWorker) === String(req.user._id);

  if (role !== "admin" && !isAssignedWorker) {
    return next(new AppError("You are not allowed to update this task", 403));
  }

  const allowedFields =
    role === "admin"
      ? ["title", "description", "status", "priority", "client", "assignedWorker", "chat", "dueDate", "isActive"]
      : ["status"];

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      task[field] = req.body[field];
    }
  });

  if (req.body.updateNote) {
    task.updates.push({
      note: req.body.updateNote,
      status: task.status,
      createdBy: req.user._id,
    });
  }

  await task.save();

  const recipients = [task.assignedWorker, task.createdBy].filter(Boolean);
  if (task.client) {
    const clientDoc = await Client.findById(task.client).select("userId");
    if (clientDoc?.userId) recipients.push(clientDoc.userId);
  }

  notifyUsers(recipients, {
    title: `Task ${task.status}`,
    message: task.title,
    type: "task",
    actor: req.user._id,
    entityId: task._id,
    entityType: "Task",
    link: "/tasks",
    metadata: {
      status: task.status,
      priority: task.priority,
    },
  }).catch((notificationError) => {
    console.error("Task update notification failed:", notificationError.message);
  });

  successHandler(res, task, "Task updated successfully");
});

const addTaskUpdate = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(new AppError("Task not found", 404));

  const role = roleOf(req.user);
  const isAssignedWorker =
    task.assignedWorker && String(task.assignedWorker) === String(req.user._id);
  if (role !== "admin" && !isAssignedWorker) {
    return next(new AppError("You are not allowed to update this task", 403));
  }

  if (!req.body.note) return next(new AppError("Update note is required", 400));

  task.updates.push({
    note: req.body.note,
    status: req.body.status || task.status,
    createdBy: req.user._id,
  });
  if (req.body.status) task.status = req.body.status;
  await task.save();

  successHandler(res, task, "Task progress added successfully");
});

module.exports = {
  getTasks,
  createTask,
  updateTask,
  addTaskUpdate,
};
