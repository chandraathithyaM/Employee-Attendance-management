import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// Auth
export const googleLogin = (credential) =>
  api.post("/api/auth/google", { credential });

export const getCurrentUser = () => api.get("/api/auth/me");

// Admin
export const getAllUsers = () => api.get("/api/admin/users");
export const getUsersByRole = (role) => api.get(`/api/admin/users/role/${role}`);
export const createUser = (data) => api.post("/api/admin/users", data);
export const updateUser = (id, data) => api.put(`/api/admin/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/api/admin/users/${id}`);
export const getAdminProfile = () => api.get("/api/admin/profile");
export const getAllAdminLeaves = () => api.get("/api/admin/leaves");

// Manager
export const getEmployees = () => api.get("/api/manager/employees");
export const createEmployee = (data) => api.post("/api/manager/employees", data);
export const updateEmployee = (id, data) =>
  api.put(`/api/manager/employees/${id}`, data);
export const deleteEmployee = (id) =>
  api.delete(`/api/manager/employees/${id}`);

export const generateOtp = (data) =>
  api.post("/api/manager/attendance/generate-otp", data);

export const generateQrCode = (data) =>
  api.post("/api/manager/attendance/qr", data);

export const getEmployeeAttendance = (id) =>
  api.get(`/api/manager/attendance/${id}`);

export const getManagerProfile = () => api.get("/api/manager/profile");
export const getManagerLeaves = () => api.get("/api/manager/leaves");

export const updateLeaveStatus = (id, status, comment = "") =>
  api.put(
    `/api/manager/leaves/${id}?status=${status}&comment=${encodeURIComponent(
      comment
    )}`
  );

// Employee
export const getProfile = () => api.get("/api/employee/profile");
export const getMyAttendance = () => api.get("/api/employee/attendance");
export const markMyAttendance = (data) =>
  api.post("/api/employee/attendance/mark", data);

export const applyLeave = (data) =>
  api.post("/api/employee/leave", data);

export const getMyLeaves = () => api.get("/api/employee/leave");

export default api;
