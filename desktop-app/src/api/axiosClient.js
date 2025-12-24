import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to all requests
axiosClient.interceptors.request.use(
  (config) => {
    // Token will be added by App.jsx via global state
    // This is a fallback for any stored token
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 and redirect to login
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      if (window.electronAPI?.clearToken) {
        await window.electronAPI.clearToken();
      }
      // Dispatch event to trigger logout
      window.dispatchEvent(new Event('unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth endpoints
  register: (data) => axiosClient.post('/auth/register', data),
  login: (data) => axiosClient.post('/auth/login', data),
  getCurrentUser: () => axiosClient.get('/auth/me'),

  // Products
  getProducts: () => axiosClient.get('/products'),
  getProduct: (id) => axiosClient.get(`/products/${id}`),
  createProduct: (data) => axiosClient.post('/products', data),
  updateProduct: (id, data) => axiosClient.put(`/products/${id}`, data),
  deleteProduct: (id) => axiosClient.delete(`/products/${id}`),

  // Parties
  getParties: () => axiosClient.get('/parties'),
  getParty: (id) => axiosClient.get(`/parties/${id}`),
  createParty: (data) => axiosClient.post('/parties', data),
  updateParty: (id, data) => axiosClient.put(`/parties/${id}`, data),
  deleteParty: (id) => axiosClient.delete(`/parties/${id}`),
  getPartyBalance: (id) => axiosClient.get(`/parties/${id}/balance`),
  getPartyLedger: (id) => axiosClient.get(`/parties/${id}/ledger`),

  // Stock
  stockIn: (data) => axiosClient.post('/stock/in', data),
  stockOut: (data) => axiosClient.post('/stock/out', data),
  getCurrentStock: () => axiosClient.get('/stock/current'),
  getLowStock: () => axiosClient.get('/stock/low-stock'),
  getStockHistory: (productId) => axiosClient.get(`/stock/history/${productId}`),

  // Payments
  createPayment: (data) => axiosClient.post('/payments', data),
  getPayments: (partyId) => axiosClient.get(`/payments/${partyId}`),
  getAllPayments: () => axiosClient.get('/payments'),
  clearBalance: (partyId) => axiosClient.post(`/payments/clear/${partyId}`),

  // Ledger
  getLedger: (partyId, params) => axiosClient.get(`/ledger/${partyId}`, { params }),
  getAllBalances: () => axiosClient.get('/ledger'),

  // Dashboard
  getTopProducts: () => axiosClient.get('/dashboard/top-products'),

  // Health check
  healthCheck: () => axiosClient.get('/health'),
};

export default axiosClient;
