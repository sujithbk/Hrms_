import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoutes from "./route/PublicRoutes";
import PrivateRoute from "./route/PrivateRoute";  // Make sure import path is correct

import Userdash from "./views/dashboard/userdash/Userdash";
import AdminDash from "./views/dashboard/admindash/AdminDash";

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/auth/*" element={<PublicRoutes />} />

    {/* Private routes */}
    <Route
      path="/user/dashboard"
      element={
        <PrivateRoute allowedRoles={["user", "admin"]}>
          <Userdash />
        </PrivateRoute>
      }
    />

    <Route
      path="/admin/dashboard"
      element={
        <PrivateRoute allowedRoles={["admin"]}>
          <AdminDash />
        </PrivateRoute>
      }
    />

    {/* Redirect any unknown routes */}
    <Route path="*" element={<Navigate to="/auth/login" replace />} />
  </Routes>
);

export default AppRoutes;
