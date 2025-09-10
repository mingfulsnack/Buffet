import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance for authenticated requests
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for public requests (no auth required)
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token (only for authenticated API)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors (only for authenticated API)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only redirect to login on 401 (Unauthorized), not on other errors like 429
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // For other errors (like 429 rate limit), just reject without redirect
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

// Menu API
export const menuAPI = {
  getPublicMenu: () => publicApi.get('/public/menu'),
  getDishes: (params) => api.get('/menu/dishes', { params }),
  createDish: (data) => api.post('/menu/dishes', data),
  updateDish: (id, data) => api.put(`/menu/dishes/${id}`, data),
  deleteDish: (id) => api.delete(`/menu/dishes/${id}`),
  getBuffetSets: (params) => api.get('/menu/buffet-sets', { params }),
  createBuffetSet: (data) => api.post('/menu/buffet-sets', data),
  updateBuffetSet: (id, data) => api.put(`/menu/buffet-sets/${id}`, data),
  deleteBuffetSet: (id) => api.delete(`/menu/buffet-sets/${id}`),
  getCategories: () => api.get('/menu/categories'),
  getPromotions: (params) => api.get('/menu/promotions', { params }),
};

// Customer API
export const customerAPI = {
  getCustomers: (params) => api.get('/customers', { params }),
  createCustomer: (data) => api.post('/customers', data),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
  getCustomer: (id) => api.get(`/customers/${id}`),
};

// Employee API
export const employeeAPI = {
  getEmployees: (params) => api.get('/employees', { params }),
  createEmployee: (data) => api.post('/employees', data),
  updateEmployee: (id, data) => api.put(`/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/employees/${id}`),
  getEmployee: (id) => api.get(`/employees/${id}`),
  getRoles: () => api.get('/employees/roles'),
};

// Table API
export const tableAPI = {
  getTables: (params) => api.get('/tables', { params }),
  createTable: (data) => api.post('/tables', data),
  updateTable: (id, data) => api.put(`/tables/${id}`, data),
  deleteTable: (id) => api.delete(`/tables/${id}`),
  getTable: (id) => api.get(`/tables/${id}`),
  updateStatus: (id, status) =>
    api.patch(`/tables/${id}/status`, { trangthai: status }),
  getAreas: () => api.get('/tables/areas'),
};

// Booking API
export const bookingAPI = {
  getBookings: (params) => api.get('/bookings', { params }),
  createBooking: (data) => api.post('/bookings', data),
  updateBooking: (id, data) => api.put(`/bookings/${id}`, data),
  deleteBooking: (id) => api.delete(`/bookings/${id}`),
  getBooking: (id) => api.get(`/bookings/${id}`),
  confirmBooking: (id) => api.patch(`/bookings/${id}/confirm`),
  cancelBooking: (id, reason) =>
    api.patch(`/bookings/${id}/cancel`, { reason }),
  checkIn: (id) => api.patch(`/bookings/${id}/checkin`),
  checkOut: (id) => api.patch(`/bookings/${id}/checkout`),

  // Public booking (no auth required)
  createPublicBooking: (data) => publicApi.post('/public/bookings', data),
  cancelPublicBooking: (token, reason) =>
    publicApi.patch(`/public/bookings/${token}/cancel`, { reason }),
  getPublicBooking: (token) => publicApi.get(`/public/bookings/${token}`),
};

// Reports API
export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getRevenue: (params) => api.get('/reports/revenue', { params }),
  getTableUsage: (params) => api.get('/reports/table-usage', { params }),
  getCustomerReport: (params) => api.get('/reports/customers', { params }),
  getPopularDishes: (params) => api.get('/reports/popular-dishes', { params }),
};

export default api;
