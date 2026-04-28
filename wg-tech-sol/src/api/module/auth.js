// import axiosInstance from "../index"; // tumhara existing axios

// export const registerUser = (data) =>
//    axiosInstance.post("/api/v1/auth/register", data);

// export const loginUser = (data) =>
//   axiosInstance.post("/api/v1/auth/login", data);

// import api from "../index";  // ✅ correct import

// export const registerUser = (data) =>
//   api("v1/auth/register", data, "POST");  // ✅ baseUrl already /api/ hai

// export const loginUser = (data) =>
//   api("v1/auth/login", data, "POST");  // ✅

import api from "../index";

// Login: backend returns { client, token } for clients, { user, token } for admins/workers
export const loginUser = (data) =>
  api("v1/users/login", { ...data, portal: "client" }, "POST");

export const forgotPasswordApi = (data) =>
  api("v1/users/forgot-password", data, "POST");
export const resetPasswordApi = (data) =>
  api("v1/users/reset-password", data, "POST");

export const registerUser = (data) => api("v1/users", data, "POST"); // ✅ correct endpoint
