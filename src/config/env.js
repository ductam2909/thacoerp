/**
 * Tệp cấu hình Environment (Môi trường)
 * Gom toàn bộ các biến từ process.env vào đây để:
 * 1. Tránh việc gọi process.env ở khắp nơi gây rác code.
 * 2. Hỗ trợ giá trị mặc định (fallback) nếu lỡ quên không tạo file .env
 */

export const ENV = {
  // Kết nối
  API_URL: "https://tasting-statue-transfer.ngrok-free.dev" || 'http://localhost:5000/api',
  BASE_URL: process.env.REACT_APP_BASE_URL || 'http://localhost:3000',
  BASE_URL_EXPORT: process.env.REACT_APP_API_EXPORT || 'http://10.11.20.73:8888/',
  BASE_URL_PREVIEW: process.env.REACT_APP_API_PREVIEW || 'http://10.11.20.73:8888/',

  // Tài khoản test
  MOCK_USER: process.env.REACT_APP_MOCK_USERNAME || 'admin',
  MOCK_PASS: process.env.REACT_APP_MOCK_PASSWORD || '123456',

  // Cấu hình chung
  MODE: process.env.REACT_APP_ENV || 'development',
  APP_VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  BYPASS_LOGIN: false || process.env.REACT_APP_BYPASS_LOGIN === 'true',
};
