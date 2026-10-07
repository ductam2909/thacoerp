import axios from 'axios';
import { getStorage, removeStorage } from '../utils/storage';
import { ENV } from '../config/env';

const apiClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getStorage('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Bỏ qua màn hình cảnh báo của ngrok nếu URL chứa chữ ngrok
    const targetUrl = config.baseURL || config.url || '';
    if (targetUrl.includes('ngrok')) {
      config.headers['ngrok-skip-browser-warning'] = 'true';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        removeStorage('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
