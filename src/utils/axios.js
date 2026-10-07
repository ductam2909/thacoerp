import axios from 'axios';
import { ENV } from '../config/env';
import { getStorage } from './storage';

// Khởi tạo một đối tượng Axios dùng chung
const axiosClient = axios.create({
  baseURL: ENV.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Timeout 30s
});

// Interceptor Request: Tự động chạy trước TẤT CẢ các API request
axiosClient.interceptors.request.use(
  (config) => {
    const token = getStorage('accessToken');
    // Nếu trong LocalStorage có Token -> Gắn vào Header
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor Response: Tự động chạy khi có kết quả trả về từ API
axiosClient.interceptors.response.use(
  (response) => {
    // Chỉ lấy phần data bên trong response của Axios để code gọn hơn
    return response.data;
  },
  (error) => {
    // Xử lý chung các mã lỗi hệ thống (Ví dụ 401 là hết hạn Token)
    if (error.response && error.response.status === 401) {
      // Có thể ép đăng xuất nếu cần thiết
      console.warn("Hết phiên đăng nhập!");
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
