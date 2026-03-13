import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth
export const googleLogin = (credential) => api.post('/api/auth/google', { credential });
export const getCurrentUser = () => api.get('/auth/me');

// Admin APIs
export const getAllUsers = () => api.get('/admin/users');
export const getUsersByRole = (role) => api.get(`/admin/users/role/${role}`);
export const createUser = (data) => api.post('/admin/users', data);
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
export const getAdminProfile = () => api.get('/admin/profile');
export const getAllAdminLeaves = () => api.get('/admin/leaves');

// Manager APIs
export const getEmployees = () => api.get('/manager/employees');
export const createEmployee = (data) => api.post('/manager/employees', data);
export const updateEmployee = (id, data) => api.put(`/manager/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/manager/employees/${id}`);
export const generateOtp = (data) => api.post('/manager/attendance/generate-otp', data);
export const generateQrCode = (data) => api.post('/manager/attendance/qr', data);

export const getEmployeeAttendance = (id) => api.get(`/manager/attendance/${id}`);
export const getManagerProfile = () => api.get('/manager/profile');
export const getManagerLeaves = () => api.get('/manager/leaves');
export const updateLeaveStatus = (id, status, comment = '') =>
  api.put(`/manager/leaves/${id}?status=${status}&comment=${encodeURIComponent(comment)}`);

// Employee APIs
export const getProfile = () => api.get('/employee/profile');
export const getMyAttendance = () => api.get('/employee/attendance');
export const markMyAttendance = (data) => api.post('/employee/attendance/mark', data);
export const applyLeave = (data) => api.post('/employee/leave', data);
export const getMyLeaves = () => api.get('/employee/leave');

export default api;
