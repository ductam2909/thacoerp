import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { ENV } from '../config/env';

const PrivateRoute = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  return isAuthenticated || ENV.BYPASS_LOGIN ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default PrivateRoute;
