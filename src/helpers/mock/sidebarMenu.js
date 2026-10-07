export const mockMenuData = [
  {
    menuId: "1",
    menuName: "Bảng điều khiển",
    url: "dashboard-group",
    icon: "dashboard",
    children: [
      {
        menuId: "1-1",
        menuName: "Dashboard Admin",
        url: "/dashboard",
        icon: "DashboardOutlined",
      },
    ],
  },
  {
    menuId: "2",
    menuName: "Dự án & Công việc",
    url: "projectAndTask",
    icon: "",
    children: [
      {
        menuId: "2-1",
        menuName: "Danh sách Dự án",
        url: "/projects",
        icon: "ProjectOutlined",
      },
      {
        menuId: "2-3",
        menuName: "Công việc của tôi",
        url: "/my-tasks",
        icon: "CheckSquareOutlined",
      },
    ],
  },
  // {
  //   menuId: "3",
  //   menuName: "Báo cáo",
  //   url: "report",
  //   icon: "",
  //   children: [
  //     {
  //       menuId: "3-1",
  //       menuName: "Báo cáo dự án",
  //       url: "/reports/projects",
  //       icon: "FileTextOutlined",
  //     },
  //     {
  //       menuId: "3-2",
  //       menuName: "NS chưa chấm công",
  //       url: "/reports/missing-time",
  //       icon: "FileTextOutlined",
  //     },
  //   ],
  // },
  {
    menuId: "4",
    menuName: "Tiện ích",
    url: "utility",
    icon: "",
    children: [
      {
        menuId: "4-1",
        menuName: "Thông báo",
        url: "/notifications",
        icon: "BellOutlined",
      },
      {
        menuId: "4-2",
        menuName: "Chat nội bộ",
        url: "/chat",
        icon: "MessageOutlined",
      },
    ],
  },
   {
    menuId: "6",
    menuName: "Danh mục",
    url: "utility",
    icon: "",
    children: [
      {
        menuId: "6-1",
        menuName: "Nhà máy",
        url: "/categories/factories",
        icon: "BuildOutlined",
      },
      {
        menuId: "6-2",
        menuName: "Loại dự án",
        url: "/categories/project-types",
        icon: "ProjectOutlined",
      },
      {
        menuId: "6-3",
        menuName: "Loại hồ sơ",
        url: "/categories/document-types",
        icon: "FileTextOutlined",
      },
      {
        menuId: "6-4",
        menuName: "Danh mục PI",
        url: "/admin/pi-categories",
        icon: "AppstoreOutlined",
      },
    ],
  },
  {
    menuId: "5",
    menuName: "Quản trị hệ thống",
    url: "system",
    icon: "",
    children: [
      {
        menuId: "5-1",
        menuName: "Quản lý Người dùng",
        url: "/users",
        icon: "UserOutlined",
      },
      {
        menuId: "5-2",
        menuName: "Phòng ban",
        url: "/departments",
        icon: "TeamOutlined",
      },
      {
        menuId: "5-3",
        menuName: "Chức vụ",
        url: "/positions",
        icon: "SolutionOutlined",
      },

      {
        menuId: "5-5",
        menuName: "Quản lý Menu",
        url: "/menus",
        icon: "ProfileOutlined",
      },
    ],
  },
];

export const getValidMenuUrls = (menus) => {
  let urls = [];
  menus.forEach((item) => {
    if (item.url) urls.push(item.url);
    if (item.children) {
      urls = urls.concat(getValidMenuUrls(item.children));
    }
  });
  return urls;
};
