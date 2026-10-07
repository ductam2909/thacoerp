export const AUTH_ROUTES = {
  LOGIN: "/login",
};

export const MAIN_ROUTES = {
  DASHBOARD: "/dashboard",
  DASHBOARD_DEPARTMENT: "/dashboard-department",
  NESTING_PRODUCTION_ORDERS: "/production-orders",
  NESTING_CUT_FILES: "/nesting/cut-files",
  NESTING_ALLOCATION_SCHEDULE: "/nesting/allocation-schedule",
  MACHINING: "/machining",
  CONFIGURATION_MACHINES: "/machines",
  CONFIGURATION_MACHINE_CAPACITIES: "/machine-capacities",
  CONFIGURATION_WORK_SHIFTS: "/work-shifts",
  PROFILE: "/profile",
  USERS: "/users",
  POSITIONS: "/positions",
  POSITION_PERMISSIONS: "/positions/:id/permissions",
  PERMISSIONS: "/permissions",
  MENU_LIST: "/menus",
  MY_MENU: "/api/Menu/my-menus",
  CATEGORY_CUTTING_FILES: "/category-file",

  // Kế hoạch
  PLANNING: "/planning",
  PLANNING_GENERAL: "/planning/general",
  WORK_PLAN: "/work-plan",
  // Quản lý phôi
  MATERIAL_SUPPLY: "/material-supply",
  // Quản lý vận hành máy
  MACHINE_OPERATION: "/machine-operation",
};

export const NON_MENU_ROUTE_PATTERNS = [
  MAIN_ROUTES.PROFILE,
  MAIN_ROUTES.DASHBOARD_DEPARTMENT,
  MAIN_ROUTES.POSITION_PERMISSIONS,
  MAIN_ROUTES.MENU_LIST,
];
