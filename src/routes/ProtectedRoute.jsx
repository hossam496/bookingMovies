import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ requiredRole = "admin", children }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  let userRole = null;

  // Try to get role from user object
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.role) {
        userRole = user.role;
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
    }
  }

  // Fallback: decode JWT token manually
  if (!userRole && token) {
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      if (decodedPayload && decodedPayload.role) {
        userRole = decodedPayload.role;
      }
    } catch (e) {
      console.error("Failed to decode token", e);
    }
  }

  // If the requirement is admin, but role isn't admin
  if (requiredRole === "admin" && userRole !== "admin") {
    // If not admin, redirect to homepage or forbidden
    return <Navigate to="/" replace />;
  }

  // If everything is fine, render the child routes (AdminLayout etc)
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
