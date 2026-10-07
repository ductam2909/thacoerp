import React, { useState, useEffect, useMemo } from "react";
import { Layout, Spin } from "antd";
import { matchPath, Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import AppHeader from "../Header/Header";
import { useAppSelector } from "../../../../store/hooks";
import { getMenus } from "../../../../services/menuService";
import {
  MAIN_ROUTES,
  NON_MENU_ROUTE_PATTERNS,
} from "../../../../routers/constants";

const { Content } = Layout;

// Menu orderDisplay=0 không được hiển thị và cũng không được cấp quyền truy cập.
const isMenuVisible = (menu) =>
  menu.orderDisplay === undefined ||
  menu.orderDisplay === null ||
  Number(menu.orderDisplay) !== 0;

const normalizePath = (path) => {
  if (typeof path !== "string" || !path.startsWith("/")) return null;
  return path.replace(/\/+$/, "") || "/";
};

// Lấy các path hợp lệ từ cây my-menus; ẩn menu cha không còn child hiển thị.
const collectMenuPaths = (menus = [], isRoot = true) =>
  menus.flatMap((menu) => {
    const children = Array.isArray(menu.children) ? menu.children : [];
    const visibleChildren = children.filter(isMenuVisible);
    const isVisible =
      isMenuVisible(menu) && (!isRoot || visibleChildren.length > 0);

    if (!isVisible) return [];
    const menuPath = normalizePath(menu.path || menu.url);
    return [
      ...(menuPath ? [menuPath] : []),
      ...collectMenuPaths(visibleChildren, false),
    ];
  });

const PermissionRouteOutlet = () => {
  const location = useLocation();
  const { items, loaded } = useAppSelector((state) => state.menu);
  const menuPaths = useMemo(() => collectMenuPaths(items), [items]);

  useEffect(() => {
    if (!loaded) {
      getMenus({ scope: "my" });
    }
  }, [loaded]);

  if (!loaded) {
    // Chờ my-menus hoàn tất để tránh redirect sai ở lần render đầu tiên.
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  const currentPath = normalizePath(location.pathname) || "/";
  const isNonMenuRoute = NON_MENU_ROUTE_PATTERNS.some((pattern) =>
    matchPath({ path: pattern, end: true }, currentPath),
  );
  // Cho phép path chính và các trang chi tiết nằm dưới path đó.
  const isAllowed =
    currentPath === "/" ||
    currentPath === MAIN_ROUTES.DASHBOARD ||
    isNonMenuRoute ||
    menuPaths.some(
      (menuPath) =>
        currentPath === menuPath || currentPath.startsWith(`${menuPath}/`),
    );

  return isAllowed ? (
    <Outlet />
  ) : (
    // URL không thuộc my-menus quay về trang tổng quan.
    <Navigate to={MAIN_ROUTES.DASHBOARD} replace />
    // <Outlet />
  );
};

const MainLayout = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [collapsed, setCollapsed] = useState(window.innerWidth < 992);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (!mobile) {
        setCollapsed(false); 
      } else {
        setCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [location.pathname, isMobile]);

  return (
    <Layout className="main-layout">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isMobile={isMobile}
      />
      <Layout className="main-layout-inner">
        <AppHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          isMobile={isMobile}
        />
        <Content className="main-layout-content ant-layout-content">
          <PermissionRouteOutlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
