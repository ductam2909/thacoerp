import { createSlice } from "@reduxjs/toolkit";
import { logout } from "./authSlice";

// Gom quyền theo từng menu: ưu tiên path, menu không có path sẽ dùng name làm khóa.
const collectPermissionsByPath = (menus = []) => {
  const permissionsByPath = {};

  const visit = (items) => {
    items.forEach((menu) => {
      const rawPath = menu.path || menu.url;
      const rawName = menu.name || menu.menuName;
      const path = typeof rawPath === "string" ? rawPath.trim() : "";
      const name = typeof rawName === "string" ? rawName.trim() : "";
      const menuKey = path || name;

      if (menuKey) {
        const currentCodes = permissionsByPath[menuKey] || [];
        const menuCodes = (menu.permissions || [])
          .map((permission) => permission?.code)
          .filter(Boolean);
        permissionsByPath[menuKey] = Array.from(
          new Set([...currentCodes, ...menuCodes]),
        );
      }

      visit(Array.isArray(menu.children) ? menu.children : []);
    });
  };

  visit(Array.isArray(menus) ? menus : []);
  return permissionsByPath;
};

const initialState = {
  items: [],
  permissionsByPath: {},
  loaded: false,
};

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    // Lưu cây my-menus và nhóm mã quyền theo path hoặc name của từng menu.
    setMyMenus: (state, action) => {
      state.items = Array.isArray(action.payload) ? action.payload : [];
      state.permissionsByPath = collectPermissionsByPath(state.items);
      state.loaded = true;
    },
    clearMyMenus: () => initialState,
  },
  extraReducers: (builder) => {
    // Không giữ lại menu và quyền của tài khoản cũ sau khi đăng xuất.
    builder.addCase(logout, () => initialState);
  },
});

export const { setMyMenus, clearMyMenus } = menuSlice.actions;
// Selector dùng chung cho menu và kiểm tra quyền trong component.
export const selectMyMenus = (state) => state.menu.items;
export const selectPermissionsByPath = (state) =>
  state.menu.permissionsByPath;
export const selectMenuPermissions = (menuPathOrName) => (state) =>
  state.menu.permissionsByPath[menuPathOrName] || [];
export const selectMenuHasPermission = (menuPathOrName, permissionCode) =>
  (state) =>
    (state.menu.permissionsByPath[menuPathOrName] || []).includes(
      permissionCode,
    );

export default menuSlice.reducer;
