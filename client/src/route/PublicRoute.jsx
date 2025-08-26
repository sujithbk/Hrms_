import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const PublicRoute = ({ children }) => {
  const auth = useSelector((state) => state.auth);
  
  // If user is logged in, redirect to appropriate dashboard
  if (auth.isLoggedIn && auth.user?.role) {
    if (auth.user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (auth.user.role === "user") {
      return <Navigate to="/user/dashboard" replace />;
    }
  }

  return children;
};

export default PublicRoute;