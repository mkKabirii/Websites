import api from "../index";
import ENDPOINTS from "../endpoint";

const getAllAppliedForms = (page = 1, limit = 10) =>
  api(ENDPOINTS.getAllAppliedForms, null, "get", false, { page, limit });

const updateStatus = (id, status) =>
  api(`${ENDPOINTS.updateStatus}/${id}`, { status }, "put");

const getAppliedFormById = (id) =>
  api(`${ENDPOINTS.getAppliedFormById}/${id}`, null, "get");

const deleteAppliedForm = (id) =>
  api(`${ENDPOINTS.getAppliedFormById}/${id}`, null, "delete");

export { getAllAppliedForms, updateStatus, getAppliedFormById, deleteAppliedForm };

