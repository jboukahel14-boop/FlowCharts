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
  (response) => {
    if (!isJsonResponse(response)) {
      backendReady = false;
      return Promise.reject(new Error('Non-JSON response — backend unavailable'));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

let backendReady = null;

function isJsonResponse(response) {
  const contentType = response.headers?.['content-type'] || '';
  return contentType.includes('application/json');
}

async function checkBackend() {
  if (backendReady !== null) return backendReady;
  try {
    const response = await http.get('/workflows', { params: { per_page: 1 }, timeout: 3000 });
    backendReady = isJsonResponse(response) && Array.isArray(response.data?.data);
  } catch {
    backendReady = false;
  }
  return backendReady;
}

async function apiCall(target, prop, args) {
  if (backendReady === null) {
    await checkBackend();
  }
  if (backendReady) {
    return await target[prop](...args);
  }
  const fallback = localWorkflowApi[prop];
  if (fallback) {
    return await fallback(...args);
  }
  throw new Error(`API unavailable: ${prop}`);
}

function createFallbackProxy(api) {
  return new Proxy(api, {
    get(target, prop) {
      return async (...args) => {
        try {
          return await apiCall(target, prop, args);
        } catch {
          const fallback = localWorkflowApi[prop];
          if (fallback) {
            console.info(`[workflowApi] Using localStorage fallback for "${prop}"`);
            return await fallback(...args);
          }
          throw new Error(`API unavailable: ${prop}`);
        }
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
