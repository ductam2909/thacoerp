/**
 * Router Component
 * Component chính quản lý routing cho toàn bộ ứng dụng.
 */
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';

// Layouts
import MainLayout from '../components/core/layouts/MainLayout/MainLayout';
import AuthLayout from '../components/core/layouts/AuthLayout/AuthLayout';

// Route Guards
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';

// Route Data
import { routes_auth, routes_main } from './data';

/**
 * Fallback loading component cho Suspense
 */
const PageLoading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
);

/**
 * Router chính của ứng dụng
 * - Public routes: Login, Register... (AuthLayout)
 * - Private routes: Dashboard, Projects... (MainLayout)
 */
const Router = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          {/* ==================== Public Routes ==================== */}
          <Route element={<PublicRoute />}>
            <Route element={<AuthLayout />}>
              {routes_auth.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<route.component />}
                />
              ))}
            </Route>
          </Route>

          {/* ==================== Private Routes ==================== */}
          <Route element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              {routes_main.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<route.component />}
                />
              ))}
            </Route>
          </Route>


        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default Router;
