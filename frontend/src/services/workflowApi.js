import axios from 'axios';

const http = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const workflowApi = {
  listWorkflows: (params) => http.get('/workflows', { params }),
  getWorkflow: (id) => http.get(`/workflows/${id}`),
  createWorkflow: (data) => http.post('/workflows', data),
  updateWorkflow: (id, data) => http.put(`/workflows/${id}`, data),
  deleteWorkflow: (id) => http.delete(`/workflows/${id}`),
  executeWorkflow: (id) => http.post(`/workflows/${id}/execute`),
  validateWorkflow: (id) => http.post(`/workflows/${id}/validate`),
};
