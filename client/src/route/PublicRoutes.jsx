import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoute from "./PublicRoute";

import Login from "../views/auth/login/Login";
import Signup from "../views/auth/signup/Signup";
import ForgotPassword from "../views/auth/forgotPassword/ForgotPassword";

// Use a different name here, like PublicRoutes
const PublicRoutes = () => (
  <Routes>
    <Route
      path="login"
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      }
    />
    <Route
      path="signup"
      element={
        <PublicRoute>
          <Signup />
        </PublicRoute>
      }
    />
    <Route
      path="forgotpassword"
      element={
        <PublicRoute>
          <ForgotPassword />
        </PublicRoute>
      }
    />
    <Route path="*" element={<Navigate to="login" replace />} />
  </Routes>
);

export default PublicRoutes;
