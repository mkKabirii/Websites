import ENDPOINTS from "../endpoint";
import api from "../index";

const getProposal = (page = 1, limit = 10, filters = {}) => {
  // Remove hardcoded pagination from endpoint and use query params
  const endpoint = ENDPOINTS.getProposal.split('?')[0];
  return api(endpoint, null, "get", false, { page, limit, ...filters });
};
const createProposal = (payload) =>
  api(ENDPOINTS.createProposal, payload, "post");

const updateProposals = (id, payload) =>
  api(`${ENDPOINTS.updateProposals}/${id}`, payload, "put");

const deleteProposals = (id) =>
  api(`${ENDPOINTS.deleteProposals}/${id}`, null, "delete");

const getAllProposalById = (id) =>
  api(`${ENDPOINTS.getAllProposalById}/${id}`, null, "get");

// new add here
const sendProposalEmail = (id, data) =>
  api(`${ENDPOINTS.getAllProposalById}/${id}/send-email`, data, "post");


export {
  createProposal,
  deleteProposals,
  getProposal,
  updateProposals,
  getAllProposalById,
  sendProposalEmail //new add here
  
};
