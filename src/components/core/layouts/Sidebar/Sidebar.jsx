import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Drawer } from "antd";
import * as AntdIcons from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { getMenus, MENU_UPDATED_EVENT } from "../../../../services/menuService";
import logoThaco from "../../../../assets/images/logoThaco.png";

const { Sider } = Layout;

const DEFAULT_MENU_DATA = [
  {
    id: "default-dashboard",
    name: "Bảng điều khiển",
    path: "/dashboard",
    icon: "Dashboard",
    orderDisplay: 1,
    children: [],
  },
];

const getSidebarMenuData = (menus) =>
  Array.isArray(menus) && menus.length > 0 ? menus : DEFAULT_MENU_DATA;

const isMenuVisible = (menu) => {
  if (menu.orderDisplay != null && Number(menu.orderDisplay) === 0) {
    return false;
  }

  // Nhóm menu chỉ cần có mục con được phép hiển thị.
  const children = Array.isArray(menu.children) ? menu.children : [];
  if (children.length > 0) return children.some(isMenuVisible);

  return (
    Array.isArray(menu.permissions) &&
    menu.permissions.some(
      (permission) =>
        typeof permission?.code === "string" &&
        permission.code.endsWith(".View"),
    )
  );
};

const hasOnlyCategoryViewPermission = (menu) => {
  const menuPath = normalizePath(menu.path || menu.url);
  if (menuPath !== "/categories") return false;

  const permissionCodes = Array.isArray(menu.permissions)
    ? menu.permissions.map((permission) => permission?.code).filter(Boolean)
    : [];

  return permissionCodes.length === 1 && permissionCodes[0] === "Category.View";
};

const isRootMenuVisible = (menu) => {
  if (!isMenuVisible(menu) || hasOnlyCategoryViewPermission(menu)) {
    return false;
  }

  const children = Array.isArray(menu.children) ? menu.children : [];
  return children.some(isMenuVisible);
};

const getAllParentKeys = (menus = []) =>
  menus.reduce((keys, menu) => {
    if (!isMenuVisible(menu)) return keys;

    const children = Array.isArray(menu.children)
      ? menu.children.filter(isMenuVisible)
      : [];
    if (children.length === 0) return keys;

    return [...keys, menu.id || menu.menuId, ...getAllParentKeys(children)];
  }, []);

const normalizePath = (path) => {
  if (typeof path !== "string" || !path.startsWith("/")) return null;
  return path.replace(/\/+$/, "") || "/";
};

const getActiveMenuPath = (menus = [], pathname = "/") => {
  const currentPath = normalizePath(pathname) || "/";
  const menuPaths = [];

  const collectPaths = (items) => {
    items.forEach((menu) => {
      if (!isMenuVisible(menu)) return;

      const menuPath = normalizePath(menu.path || menu.url);
      if (menuPath) menuPaths.push(menuPath);

      const children = Array.isArray(menu.children)
        ? menu.children.filter(isMenuVisible)
        : [];
      collectPaths(children);
    });
  };

  collectPaths(menus);

  return (
    menuPaths
      .filter(
        (menuPath) =>
          currentPath === menuPath ||
          (menuPath !== "/" && currentPath.startsWith(`${menuPath}/`)),
      )
      .sort((a, b) => b.length - a.length)[0] || currentPath
  );
};

const iconAliases = {
  Dashboard: "DashboardOutlined",
  Users: "TeamOutlined",
  User: "UserOutlined",
  Organization: "ApartmentOutlined",
  Department: "BankOutlined",
  Position: "SolutionOutlined",
  Settings: "SettingOutlined",
  Menu: "MenuOutlined",
  Permission: "SafetyCertificateOutlined",
  Audit: "HistoryOutlined",
  WhiteList: "CheckCircleOutlined",
  Project: "ProjectOutlined",
  Task: "CheckSquareOutlined",
  Time: "ClockCircleOutlined",
  TimeLog: "FieldTimeOutlined",
  DailyLog: "CalendarOutlined",
  File: "FolderOpenOutlined",
  Category: "AppstoreOutlined",
  Partition: "PartitionOutlined",
  UnorderedList: "UnorderedListOutlined",
  Profile: "ProfileOutlined",
  Machine: "ControlOutlined",
};

const renderIcon = (iconName) => {
  const DefaultIcon = <AntdIcons.AppstoreOutlined />;
  if (!iconName) return DefaultIcon;

  let IconComponent = AntdIcons[iconAliases[iconName] || iconName];
  if (IconComponent) return <IconComponent />;

  const capitalizedName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  IconComponent = AntdIcons[capitalizedName];
  if (IconComponent) return <IconComponent />;

  const suffixes = ["Outlined", "Filled", "TwoTone"];
  for (const suffix of suffixes) {
    IconComponent = AntdIcons[`${capitalizedName}${suffix}`];
    if (IconComponent) return <IconComponent />;
  }

  return DefaultIcon;
};

const Sidebar = ({ collapsed, setCollapsed, isMobile }) => {
  const location = useLocation();
  const [menuData, setMenuData] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);

  const fetchMenuFromApi = async (force = false) => {
    try {
      const data = getSidebarMenuData(await getMenus({ force, scope: "my" }));

      setMenuData(data);
      setOpenKeys(getAllParentKeys(data));
    } catch (error) {
      console.error("Lỗi khi gọi API lấy menu:", error);
    }
  };

  useEffect(() => {
    fetchMenuFromApi();

    const handleMenuUpdated = () => fetchMenuFromApi(true);
    window.addEventListener(MENU_UPDATED_EVENT, handleMenuUpdated);

    return () => {
      window.removeEventListener(MENU_UPDATED_EVENT, handleMenuUpdated);
    };
  }, []);

  const mapMenuItems = (menus = [], isRoot = true) =>
    [...menus]
      .filter(isRoot ? isRootMenuVisible : isMenuVisible) // đổi thành isMenuVisible nếu không muốn ẩn menu
      .sort(
        (a, b) => (Number(a.orderDisplay) || 0) - (Number(b.orderDisplay) || 0),
      )
      .map((menu) => {
        const id = menu.id || menu.menuId;
        const name = menu.name || menu.menuName;
        const path = menu.path || menu.url;
        const hasNavigablePath =
          typeof path === "string" && path.startsWith("/");
        const children = Array.isArray(menu.children)
          ? menu.children.filter(isMenuVisible)
          : [];

        if (children.length > 0) {
          return {
            key: id,
            icon: renderIcon(menu.icon),
            label: name,
            children: mapMenuItems(children, false),
          };
        }

        return {
          key: hasNavigablePath ? path : id,
          icon: renderIcon(menu.icon),
          label: hasNavigablePath ? <Link to={path}>{name}</Link> : name,
          disabled: !hasNavigablePath,
        };
      });

  const items = mapMenuItems(menuData);
  const activeMenuPath = getActiveMenuPath(menuData, location.pathname);

  const sidebarContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#ffffff",
      }}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          borderBottom: "1px solid #e2e8f0",
          gap: 16,
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <Button
          type="text"
          icon={
            isMobile ? (
              <AntdIcons.CloseOutlined />
            ) : collapsed ? (
              <AntdIcons.MenuUnfoldOutlined />
            ) : (
              <AntdIcons.MenuFoldOutlined />
            )
          }
          onClick={() => setCollapsed(!collapsed)}
          style={{
            fontSize: "18px",
            width: 32,
            height: 32,
            padding: 0,
            flexShrink: 0,
            color: "#64748b",
          }}
        />
        {!collapsed && (
          <img
            src={logoThaco}
            alt="Thaco Logo"
            style={{
              height: "auto",
              objectFit: "contain",
              width: 180,
            }}
          />
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[activeMenuPath]}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          motion={null}
          forceSubMenuRender
          items={items}
          style={{ borderRight: 0, padding: "16px 8px" }}
        />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        closable={false}
        onClose={() => setCollapsed(true)}
        open={!collapsed}
        styles={{ body: { padding: 0 }, wrapper: { width: 280 } }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Sider
      width={280}
      theme="light"
      collapsible
      collapsed={collapsed}
      trigger={null}
      style={{
        background: "#ffffff",
        borderRight: "1px solid #e2e8f0",
        zIndex: 11,
      }}
    >
      {sidebarContent}
    </Sider>
  );
};

export default Sidebar;
