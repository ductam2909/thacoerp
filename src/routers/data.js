import React from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { AUTH_ROUTES, MAIN_ROUTES } from "./constants";
import { useAppSelector } from "../store/hooks";

const Login = React.lazy(() => import("../container/auth/Login/Login"));
const Dashboard = React.lazy(() => import("../container/dashboard/Dashboard"));
const ProductionOrderList = React.lazy(
  () => import("../container/nesting/ProductionOrderList"),
);
const CutFileList = React.lazy(
  () => import("../container/nesting/CutFileList"),
);
const AllocationSchedule = React.lazy(
  () => import("../container/nesting/AllocationSchedule"),
);
const MachineList = React.lazy(
  () => import("../container/configuration/MachineList"),
);
const MachineCapacityList = React.lazy(
  () => import("../container/configuration/MachineCapacityList"),
);
const WorkShiftList = React.lazy(
  () => import("../container/configuration/WorkShiftList"),
);
const CategoryFile = React.lazy(
  () => import("../container/configuration/CategoryFile"),
);
const Profile = React.lazy(() => import("../container/profile/Profile"));
const FileManager = React.lazy(
  () => import("../container/file-manager/FileManager"),
);
const UserList = React.lazy(() => import("../container/admin/Users/UserList"));
const PositionList = React.lazy(
  () => import("../container/admin/Positions/PositionList"),
);
const PositionPermissionConfig = React.lazy(
  () => import("../container/admin/Positions/PositionPermissionConfig"),
);
const PermissionList = React.lazy(
  () => import("../container/admin/Permissions/PermissionList"),
);
const MenuList = React.lazy(() => import("../container/admin/Menus/MenuList"));
const MachiningOrderList = React.lazy(
  () => import("../container/machining/MachiningOrderList"),
);
const Planning = React.lazy(() => import("../container/planning/Planning"));
const PlanningGeneral = React.lazy(
  () => import("../container/planning/PlanningGeneral"),
);
const MaterialSupply = React.lazy(
  () => import("../container/material-supply/MaterialSupply"),
);
const MachineOperation = React.lazy(
  () => import("../container/category/MachineOperation"),
);

const DashboardPage = () => {
  const menusLoaded = useAppSelector((state) => state.menu.loaded);
  if (!menusLoaded) {
    return <Spin />;
  }

  return <Dashboard />;
};

export const routes_auth = [
  {
    path: AUTH_ROUTES.LOGIN,
    component: Login,
    title: "Đăng nhập",
  },
];

export const routes_main = [
  {
    path: "/",
    component: () => <Navigate to={MAIN_ROUTES.DASHBOARD} replace />,
    title: "Redirect",
  },
  {
    path: MAIN_ROUTES.DASHBOARD,
    component: DashboardPage,
    title: "Tổng quan",
  },
  {
    path: MAIN_ROUTES.NESTING_PRODUCTION_ORDERS,
    component: ProductionOrderList,
    title: "Danh sách lệnh sản xuất",
  },
  {
    path: MAIN_ROUTES.NESTING_CUT_FILES,
    component: CutFileList,
    title: "Danh sách file cắt",
  },
  {
    path: MAIN_ROUTES.CONFIGURATION_MACHINES,
    component: MachineList,
    title: "Khai báo máy",
  },
  {
    path: MAIN_ROUTES.CONFIGURATION_MACHINE_CAPACITIES,
    component: MachineCapacityList,
    title: "công suất máy",
  },
  {
    path: MAIN_ROUTES.CONFIGURATION_WORK_SHIFTS,
    component: WorkShiftList,
    title: "Cấu hình ca làm việc",
  },
  {
    path: MAIN_ROUTES.CATEGORY_CUTTING_FILES,
    component: CategoryFile,
    title: "Cấu hình loại file cắt",
  },
  {
    path: MAIN_ROUTES.PROFILE,
    component: Profile,
    title: "Hồ sơ cá nhân",
  },
  {
    path: MAIN_ROUTES.FILES,
    component: FileManager,
    title: "Quản lý file",
  },
  {
    path: MAIN_ROUTES.USERS,
    component: UserList,
    title: "Quản lý người dùng",
  },
  {
    path: MAIN_ROUTES.POSITIONS,
    component: PositionList,
    title: "Chức vụ",
  },
  {
    path: MAIN_ROUTES.POSITION_PERMISSIONS,
    component: PositionPermissionConfig,
    title: "Cấu hình phân quyền",
  },
  {
    path: MAIN_ROUTES.PERMISSIONS,
    component: PermissionList,
    title: "Quản lý quyền hạn",
  },
  {
    path: MAIN_ROUTES.MENU_LIST,
    component: MenuList,
    title: "Quản lý menu",
  },
  {
    path: MAIN_ROUTES.PLANNING,
    component: Planning,
    title: "Kế hoạch",
  },
  {
    path: MAIN_ROUTES.PLANNING_GENERAL,
    component: PlanningGeneral,
    title: "Tổng quan kế hoạch",
  },
  {
    path: MAIN_ROUTES.WORK_PLAN,
    component: PlanningGeneral,
    title: "Kế hoạch Tổng",
  },
  {
    path: MAIN_ROUTES.MATERIAL_SUPPLY,
    component: MaterialSupply,
    title: "Quản lý phôi",
  },
  {
    path: "*",
    component: () => <Navigate to={MAIN_ROUTES.DASHBOARD} replace />,
    title: "Không tìm thấy trang",
  },
  {
    path: "/",
    component: () => <Navigate to={MAIN_ROUTES.DASHBOARD} replace />,
    title: "Redirect",
  },
  {
    path: MAIN_ROUTES.DASHBOARD,
    component: DashboardPage,
    title: "Tổng quan",
  },
  {
    path: MAIN_ROUTES.NESTING_PRODUCTION_ORDERS,
    component: ProductionOrderList,
    title: "Danh sách lệnh sản xuất",
  },
  {
    path: MAIN_ROUTES.NESTING_CUT_FILES,
    component: CutFileList,
    title: "Danh sách file cắt",
  },
  {
    path: MAIN_ROUTES.NESTING_ALLOCATION_SCHEDULE,
    component: AllocationSchedule,
    title: "Lịch phân bổ máy",
  },
  {
    path: MAIN_ROUTES.MACHINING,
    component: MachiningOrderList,
    title: "Danh sách lệnh gia công",
  },
  {
    path: MAIN_ROUTES.CONFIGURATION_MACHINES,
    component: MachineList,
    title: "Khai báo máy",
  },
  {
    path: MAIN_ROUTES.CONFIGURATION_MACHINE_CAPACITIES,
    component: MachineCapacityList,
    title: "công suất máy",
  },
  {
    path: MAIN_ROUTES.CONFIGURATION_WORK_SHIFTS,
    component: WorkShiftList,
    title: "Cấu hình ca làm việc",
  },
  {
    path: MAIN_ROUTES.PROFILE,
    component: Profile,
    title: "Hồ sơ cá nhân",
  },
  {
    path: MAIN_ROUTES.FILES,
    component: FileManager,
    title: "Quản lý file",
  },
  {
    path: MAIN_ROUTES.USERS,
    component: UserList,
    title: "Quản lý người dùng",
  },
  {
    path: MAIN_ROUTES.POSITIONS,
    component: PositionList,
    title: "Chức vụ",
  },
  {
    path: MAIN_ROUTES.POSITION_PERMISSIONS,
    component: PositionPermissionConfig,
    title: "Cấu hình phân quyền",
  },
  {
    path: MAIN_ROUTES.PERMISSIONS,
    component: PermissionList,
    title: "Quản lý quyền hạn",
  },
  {
    path: MAIN_ROUTES.MENU_LIST,
    component: MenuList,
    title: "Quản lý menu",
  },
  {
    path: MAIN_ROUTES.PLANNING,
    component: Planning,
    title: "Kế hoạch",
  },
  {
    path: MAIN_ROUTES.PLANNING_GENERAL,
    component: PlanningGeneral,
    title: "Tổng quan kế hoạch",
  },
  {
    path: MAIN_ROUTES.WORK_PLAN,
    component: PlanningGeneral,
    title: "Kế hoạch Tổng",
  },
  {
    path: MAIN_ROUTES.MATERIAL_SUPPLY,
    component: MaterialSupply,
    title: "Quản lý phôi",
  },
  {
    path: MAIN_ROUTES.MACHINE_OPERATION,
    component: MachineOperation,
    title: "Quản lý thao tác máy",
  },
  {
    path: "*",
    component: () => <Navigate to={MAIN_ROUTES.DASHBOARD} replace />,
    title: "Không tìm thấy trang",
  },
];
