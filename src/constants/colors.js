/**
 * Quản lý tập trung toàn bộ các mã màu (Color Palette) của hệ thống.
 * Cung cấp đầy đủ các phổ màu từ cơ bản đến nâng cao (theo chuẩn Modern UI).
 */

export const APP_COLORS = {
  // ==========================================
  // 1. MÀU NGỮ NGHĨA & TRẠNG THÁI (Semantic & State)
  // Dùng cho Nút bấm, Thông báo, Label
  // ==========================================
  
  // Màu thương hiệu (Brand)
  PRIMARY: '#3b82f6',         // Xanh dương chủ đạo (Blue 500)
  PRIMARY_LIGHT: '#eff6ff',   // Nền xanh nhạt (Blue 50)
  PRIMARY_DARK: '#2563eb',    // Xanh dương đậm (Blue 600)
  
  SECONDARY: '#8b5cf6',       // Tím nhẹ nhàng (Violet 500)
  SECONDARY_LIGHT: '#ede9fe', // Nền tím nhạt (Violet 50)
  SECONDARY_DARK: '#7c3aed',  // Tím đậm (Violet 600)

  // Trạng thái thành công (Success / Emerald)
  SUCCESS: '#10b981',         
  SUCCESS_LIGHT: '#d1fae5',   
  SUCCESS_DARK: '#059669',    
  
  // Trạng thái cảnh báo (Warning / Amber)
  WARNING: '#f59e0b',         
  WARNING_LIGHT: '#fef3c7',   
  WARNING_DARK: '#d97706',    
  
  // Trạng thái lỗi (Error / Rose)
  ERROR: '#ef4444',           
  ERROR_LIGHT: '#fee2e2',     
  ERROR_DARK: '#dc2626',      
  
  // Thông tin (Info / Sky)
  INFO: '#0ea5e9',            
  INFO_LIGHT: '#e0f2fe',      
  INFO_DARK: '#0284c7',       

  // ==========================================
  // 2. MÀU GIAO DIỆN CƠ BẢN (Layout & Text)
  // Dùng cho Cấu trúc trang và Chữ viết
  // ==========================================
  
  // Màu chữ (Typography)
  TEXT_MAIN: '#334155',       // Chữ chính (Slate 700)
  TEXT_SECONDARY: '#64748b',  // Chữ phụ (Slate 500)
  TEXT_LIGHT: '#94a3b8',      // Chữ nhạt/Placeholder (Slate 400)
  TEXT_MUTED: '#cbd5e1',      // Chữ bị vô hiệu hóa (Slate 300)
  TEXT_WHITE: '#ffffff',      
  TEXT_BLACK: '#0f172a',      // Đen tuyền (Slate 900)

  // Nền & Viền (Background & Borders)
  BG_HEADER: '#ffffff',       // Trắng tinh
  BG_LAYOUT: '#f8fafc',       // Nền tổng thể (Slate 50)
  BG_CARD: '#ffffff',         // Nền khung/bảng
  BG_HOVER: '#f1f5f9',        // Slate 100
  BG_AVATAR: '#f1f5f9',       
  
  BORDER: '#e2e8f0',          // Viền chuẩn (Slate 200)
  BORDER_LIGHT: '#f1f5f9',    // Viền nhạt (Slate 100)
  BORDER_DARK: '#94a3b8',     // Viền đậm (Slate 400)
  BORDER_FOCUS: '#93c5fd',    // Viền khi focus (Blue 300)

  // ==========================================
  // 3. THANG MÀU MỞ RỘNG (Color Scales 50 -> 900)
  // Dùng cho Biểu đồ (Charts), Tags, Badges nhiều màu
  // ==========================================
  
  // Thang màu Xám (Slate) - Dùng cho UI trung tính
  SLATE: {
    50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8',
    500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a',
  },
  
  // Thang màu Xanh dương (Blue) - Tin cậy, công nghệ
  BLUE: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
    500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a',
  },

  // Thang màu Xanh ngọc (Teal) - Tươi mới, êm dịu
  TEAL: {
    50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf',
    500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a',
  },

  // Thang màu Tím trầm (Indigo) - Sáng tạo, cao cấp
  INDIGO: {
    50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8',
    500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81',
  },

  // Thang màu Hồng phấn (Pink) - Nổi bật, phá cách
  PINK: {
    50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6',
    500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843',
  },

  // Thang màu Cam đào (Orange) - Năng động
  ORANGE: {
    50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c',
    500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12',
  },

  // ==========================================
  // 4. HIỆU ỨNG (Effects & Overlays)
  // ==========================================
  SHADOW_SM: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  SHADOW_MD: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  SHADOW_LG: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  
  // Độ trong suốt nền (Dùng cho Modal, Backdrop)
  OVERLAY_LIGHT: 'rgba(255, 255, 255, 0.8)',
  OVERLAY_DARK: 'rgba(15, 23, 42, 0.6)',
};
