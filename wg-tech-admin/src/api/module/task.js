import api from "../index";
import ENDPOINTS from "../endpoint";

const getTasks = () => api(ENDPOINTS.getTasks, null, "get");
const createTask = (payload) => api(ENDPOINTS.createTask, payload, "post");
const updateTask = (id, payload) =>
  api(`${ENDPOINTS.updateTask}/${id}`, payload, "put");
const addTaskUpdate = (id, payload) =>
  api(`${ENDPOINTS.addTaskUpdate}/${id}/updates`, payload, "post");

export { getTasks, createTask, updateTask, addTaskUpdate };
