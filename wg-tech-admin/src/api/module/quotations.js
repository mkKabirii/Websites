import api from "../index";
import ENDPOINTS from "../endpoint";

// Get all quotations
const getAllQuotations = () => 
  api(ENDPOINTS.getAllQuotations, {}, "get");

// Get single quotation 
const getQuotationById = (id) => 
  api(`${ENDPOINTS.getQuotationById}/${id}`, {}, "get");

// Create quotation
const createQuotation = (payload) => 
  api(ENDPOINTS.createQuotation, payload, "post");

// Update quotation
const updateQuotation = (id, payload) => 
  api(`${ENDPOINTS.updateQuotation}/${id}`, payload, "put");

// Send quotation to client
const sendQuotation = (id) => 
  api(`${ENDPOINTS.sendQuotation}/${id}/send`, {}, "post");

// Submit signed quotation with documents
const submitSignedQuotation = (id, formData) => {
  // Using FormData for file uploads
  const data = new FormData();
  
  // Add signature as base64
  if (formData.signature) {
    data.append("signature", formData.signature);
  }
  
  // Add files
  if (formData.idFront) {
    data.append("nationalIdFront", formData.idFront);
  }
  if (formData.idBack) {
    data.append("nationalIdBack", formData.idBack);
  }
  if (formData.paymentProof) {
    data.append("paymentProof", formData.paymentProof);
  }
  
  // Make request with FormData - set isMultipart to true
  return api(
    `${ENDPOINTS.submitSignedQuotation}/${id}/submit`, 
    data, 
    "post",
    true  // isMultipart = true
  );
};

// Approve quotation and assign worker
const approveQuotation = (id, payload) => 
  api(`${ENDPOINTS.approveQuotation}/${id}/approve`, payload, "put");

// Reject quotation
const rejectQuotation = (id, payload) => 
  api(`${ENDPOINTS.rejectQuotation}/${id}/reject`, payload, "put");

// Delete quotation
const deleteQuotation = (id) => 
  api(`${ENDPOINTS.deleteQuotation}/${id}`, {}, "delete");

// Get all clients
const getClients = () => 
  api("v1/clients", {}, "get");

export {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  sendQuotation,
  submitSignedQuotation,
  approveQuotation,
  rejectQuotation,
  deleteQuotation,
  getClients,
};
