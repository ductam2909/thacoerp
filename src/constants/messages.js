/**
 * Tệp cấu hình tập trung cho toàn bộ các thông báo (messages) trong hệ thống.
 */
export const APP_MESSAGES = {
  // --- Các thông báo THÀNH CÔNG ---
  SUCCESS: {
    CREATE: 'Thêm mới dữ liệu thành công!',
    UPDATE: 'Cập nhật dữ liệu thành công!',
    DELETE: 'Xóa dữ liệu thành công!',
    LOGIN: 'Đăng nhập thành công!',
    SAVE: 'Lưu thay đổi thành công!',
    IMPORT: 'Nhập dữ liệu thành công!',
    EXPORT: 'Xuất dữ liệu thành công!',
  },

  // --- Các thông báo LỖI / THẤT BẠI ---
  ERROR: {
    NETWORK: 'Mất kết nối máy chủ. Vui lòng kiểm tra lại mạng!',
    SYSTEM: 'Hệ thống đang bận, vui lòng thử lại sau!',
    UNAUTHORIZED: 'Bạn không có quyền thực hiện chức năng này!',
    NOT_FOUND: 'Không tìm thấy dữ liệu yêu cầu!',
    INVALID_INPUT: 'Dữ liệu nhập vào không hợp lệ!',
  },

  // --- Các thông báo CẢNH BÁO ---
  WARNING: {
    DELETE_CONFIRM: 'Bạn có chắc chắn muốn xóa dữ liệu này không? Hành động không thể hoàn tác.',
    LEAVE_UNSAVED: 'Các thay đổi của bạn chưa được lưu. Bạn có chắc chắn muốn rời đi?',
    FILL_REQUIRED: 'Vui lòng điền đầy đủ các trường bắt buộc!',
  }
};
