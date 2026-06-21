import axios from 'axios';
import { localWorkflowApi } from './localWorkflowApi.js';

const http = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
  timeout: 5000,
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

let backendReady = null;

async function checkBackend() {
  if (backendReady !== null) return backendReady;
  try {
    await http.get('/workflows', { params: { per_page: 1 }, timeout: 3000 });
    backendReady = true;
  } catch {
    backendReady = false;
  }
  return backendReady;
}

function createFallbackProxy(api) {
  return new Proxy(api, {
    get(target, prop) {
      return async (...args) => {
        try {
          const online = await checkBackend();
          if (online) {
            const response = await target[prop](...args);
            return response;
          }
        } catch {}
        const fallback = localWorkflowApi[prop];
        if (fallback) {
          console.info(`[workflowApi] Using localStorage fallback for "${prop}"`);
          return await fallback(...args);
        }
        throw new Error(`API unavailable: ${prop}`);
      };
    },
  });
}

export const workflowApi = createFallbackProxy({
  listWorkflows: (params) => http.get('/workflows', { params }),
  getWorkflow: (id) => http.get(`/workflows/${id}`),
  createWorkflow: (data) => http.post('/workflows', data),
  updateWorkflow: (id, data) => http.put(`/workflows/${id}`, data),
  deleteWorkflow: (id) => http.delete(`/workflows/${id}`),
  executeWorkflow: (id) => http.post(`/workflows/${id}/execute`),
  validateWorkflow: (id) => http.post(`/workflows/${id}/validate`),
});
