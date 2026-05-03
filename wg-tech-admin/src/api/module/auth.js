import api from "../index";
import ENDPOINTS from "../endpoint";

const loginUser = (payload) =>
  api(ENDPOINTS.loginUser, { ...payload, portal: "admin" }, "post");

const forgotPassword = (payload) =>
  api(ENDPOINTS.forgotPassword, payload, "post");

const resetPassword = (payload) =>
  api(ENDPOINTS.resetPassword, payload, "post");

export { loginUser, forgotPassword, resetPassword };
