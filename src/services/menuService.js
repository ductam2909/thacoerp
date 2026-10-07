import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { mockMenuData } from "../helpers/mock/sidebarMenu";
import { store } from "../store/store";
import { setMyMenus } from "../store/slice/menuSlice";
import { getRequest } from "./baseService";

export const MENU_UPDATED_EVENT = "menu-data-updated";

// Tạm thời hardcode menu, khi cẩn mở lại đổi thành false.
const USE_HARDCODED_MENUS = false;

const viewPermission = (code) => ({ code: `${code}.View` });
const permission = (code) => ({ code });

const HARDCODED_MENU_DATA = [
  {
    id: "base-dashboard",
    name: "Tổng quan",
    path: "/dashboard",
    icon: "Dashboard",
    orderDisplay: 1,
    permissions: [viewPermission("Dashboard")],
    children: [],
  },
  {
    id: "base-nesting",
    name: "Nesting",
    icon: "Partition",
    orderDisplay: 2,
    permissions: [viewPermission("Nesting")],
    children: [
      {
        id: "base-production-orders",
        name: "Danh sách lệnh sản xuất",
        path: "/nesting/production-orders",
        icon: "UnorderedList",
        orderDisplay: 1,
        permissions: [viewPermission("ProductionOrder")],
        children: [],
      },
      {
        id: "base-cut-files",
        name: "Danh sách file cắt",
        path: "/nesting/cut-files",
        icon: "FileTextOutlined",
        orderDisplay: 2,
        permissions: [
          viewPermission("CutFile"),
          permission("CutFile.Create"),
          permission("CutFile.Update"),
          permission("CutFile.Delete"),
        ],
        children: [],
      },
      {
        id: "base-allocation-schedule",
        name: "Lịch phân bổ máy",
        path: "/nesting/allocation-schedule",
        icon: "Calendar",
        orderDisplay: 3,
        permissions: [viewPermission("AllocationSchedule")],
        children: [],
      },
    ],
  },
  {
    id: "base-system",
    name: "Quản trị hệ thống",
    icon: "Settings",
    orderDisplay: 4,
    permissions: [viewPermission("System")],
    children: [
      {
        id: "base-users",
        name: "Người dùng",
        path: "/users",
        icon: "Users",
        orderDisplay: 1,
        permissions: [
          viewPermission("User"),
          permission("User.Create"),
          permission("User.Update"),
          permission("User.Delete"),
        ],
        children: [],
      },
      {
        id: "base-positions",
        name: "Chức vụ",
        path: "/positions",
        icon: "Position",
        orderDisplay: 2,
        permissions: [
          viewPermission("Position"),
          permission("Position.Create"),
          permission("Position.Update"),
          permission("Position.Delete"),
          permission("Position.AssignPermission"),
        ],
        children: [],
      },
      {
        id: "base-permissions",
        name: "Quyền hạn",
        path: "/permissions",
        icon: "Permission",
        orderDisplay: 3,
        permissions: [viewPermission("Permission")],
        children: [],
      },
      {
        id: "base-menus",
        name: "Menu",
        path: "/menus",
        icon: "Menu",
        orderDisplay: 4,
        permissions: [
          viewPermission("Menu"),
          permission("Menu.Create"),
          permission("Menu.Update"),
          permission("Menu.Delete"),
        ],
        children: [],
      },
    ],
  },
  {
    id: "base-configuration",
    name: "Cấu hình",
    icon: "Settings",
    orderDisplay: 3,
    permissions: [viewPermission("Configuration")],
    children: [
      {
        id: "base-machines",
        name: "Khai báo máy",
        path: "/configuration/machines",
        icon: "Machine",
        orderDisplay: 1,
        permissions: [
          viewPermission("Machine"),
          permission("Machine.Create"),
          permission("Machine.Update"),
          permission("Machine.Delete"),
        ],
        children: [],
      },
      {
        id: "base-machine-capacities",
        name: "công suất máy",
        path: "/configuration/machine-capacities",
        icon: "Machine",
        orderDisplay: 2,
        permissions: [
          viewPermission("MachineCapacity"),
          permission("MachineCapacity.Create"),
          permission("MachineCapacity.Update"),
          permission("MachineCapacity.Delete"),
        ],
        children: [],
      },
      {
        id: "base-work-shifts",
        name: "Cấu hình ca làm việc",
        path: "/configuration/work-shifts",
        icon: "Profile",
        orderDisplay: 3,
        permissions: [
          viewPermission("WorkShift"),
          permission("WorkShift.Create"),
          permission("WorkShift.Update"),
          permission("WorkShift.Delete"),
        ],
        children: [],
      },
    ],
  },
];

const HARDCODED_MENU_TREE = [
  {
    id: "base-root",
    name: "Tổng quan",
    icon: "Appstore",
    orderDisplay: 1,
    permissions: [viewPermission("Base")],
    children: HARDCODED_MENU_DATA,
  },
];

const menuCache = { all: null, my: null };
const menuRequests = { all: null, my: null };
let wasAuthenticated = store.getState().auth.isAuthenticated;

// Xóa cache menu khi logout để tài khoản mới không dùng dữ liệu tài khoản cũ.
store.subscribe(() => {
  const isAuthenticated = store.getState().auth.isAuthenticated;
  if (wasAuthenticated && !isAuthenticated) {
    menuCache.all = null;
    menuCache.my = null;
  }
  wasAuthenticated = isAuthenticated;
});

const unwrapMenus = (response) => {
  const result =
    response?.data?.data || response?.data || response?.Data || response;
  return Array.isArray(result)
    ? result
    : result?.items || result?.Items || [];
};

export const getMenus = async ({ force = false, scope = "my" } = {}) => {
  // scope="all" dành cho trang quản trị; scope="my" dành cho sidebar/quyền.
  const cacheKey = scope === "all" ? "all" : "my";
  const endpoint =
    cacheKey === "all"
      ? API_ENDPOINTS.MENU.GET_ALL
      : API_ENDPOINTS.MENU.MY_MENUS;

  if (USE_HARDCODED_MENUS) {
    menuCache[cacheKey] = HARDCODED_MENU_TREE;
    if (cacheKey === "my" && store.getState().menu.items !== menuCache.my) {
      store.dispatch(setMyMenus(HARDCODED_MENU_TREE));
    }
    return HARDCODED_MENU_TREE;
  }

  if (!force && menuCache[cacheKey]) {
    // Đồng bộ lại Redux ngay cả khi dữ liệu được trả về từ cache.
    if (cacheKey === "my" && store.getState().menu.items !== menuCache.my) {
      store.dispatch(setMyMenus(menuCache.my));
    }
    return menuCache[cacheKey];
  }
  if (menuRequests[cacheKey]) return menuRequests[cacheKey];

  menuRequests[cacheKey] = getRequest(endpoint)
    .then(unwrapMenus)
    .then((menus) => {
      menuCache[cacheKey] = menus;
      // Chỉ my-menus chứa quyền của người dùng hiện tại và được lưu vào Redux.
      if (cacheKey === "my" && store.getState().menu.items !== menus) {
        store.dispatch(setMyMenus(menus));
      }
      return menus;
    })
    .catch((error) => {
      console.error("Lỗi khi lấy menus:", error);
      if (cacheKey === "my") {
        // Không dùng menu mock để cấp quyền khi API my-menus bị lỗi.
        store.dispatch(setMyMenus([]));
        return [];
      }
      return mockMenuData;
    })
    .finally(() => {
      menuRequests[cacheKey] = null;
    });

  return menuRequests[cacheKey];
};

export const publishMenus = (menus, { scope = "all" } = {}) => {
  const cacheKey = scope === "all" ? "all" : "my";
  menuCache[cacheKey] = menus;
  if (cacheKey === "my" && store.getState().menu.items !== menus) {
    store.dispatch(setMyMenus(menus));
  }

  if (cacheKey === "all") menuCache.my = null;
  window.dispatchEvent(new CustomEvent(MENU_UPDATED_EVENT));
};
