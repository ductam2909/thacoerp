import { message as staticMessage, notification as staticNotification } from 'antd';

// Cấu hình Global mặc định cho message tĩnh
staticMessage.config({
  top: 70,             
  duration: 3,         
  maxCount: 3,         
});

// Cấu hình Global mặc định cho notification tĩnh
staticNotification.config({
  placement: 'topRight',
  top: 70,
  duration: 3,
});

let messageInstance = null;
let notificationInstance = null;

export const setNotificationInstances = (msg, notif) => {
  messageInstance = msg;
  notificationInstance = notif;
};

/**
 * Toast Helper: Hiển thị các thông báo (hiệu ứng trượt ngang)
 * Cách dùng: import { toast } from '...'; toast.success(APP_MESSAGES.SUCCESS.CREATE);
 */
export const toast = {
  success: (msg = 'Thao tác thành công!') => (notificationInstance || staticNotification).success({ message: msg }),
  error: (msg = 'Có lỗi xảy ra, vui lòng thử lại!') => (notificationInstance || staticNotification).error({ message: msg }),
  warning: (msg) => (notificationInstance || staticNotification).warning({ message: msg }),
  info: (msg) => (notificationInstance || staticNotification).info({ message: msg }),
  loading: (msg = 'Đang xử lý...') => (messageInstance || staticMessage).loading(msg), // loading vẫn dùng drop-down cho gọn
};

/**
 * Notify Helper: Hiển thị các thông báo cố định ở góc (có Tiêu đề và Mô tả chi tiết)
 */
export const notify = {
  success: (title, desc) =>
    (notificationInstance || staticNotification).success({ message: title, description: desc }),
  error: (title, desc) =>
    (notificationInstance || staticNotification).error({ message: title, description: desc }),
  warning: (title, desc) =>
    (notificationInstance || staticNotification).warning({ message: title, description: desc }),
  info: (title, desc) =>
    (notificationInstance || staticNotification).info({ message: title, description: desc }),
};
