// import React from "react";
// import { Navigate } from "react-router-dom";
// import { useSelector } from "react-redux";

// const PrivateRoute = ({ children, allowedRoles = [] }) => {
//   const auth = useSelector((state) => state.auth);
  
//   // Check if user is authenticated
//   if (!auth.isLoggedIn || !auth.user) {
//     return <Navigate to="/auth/login" replace />;
//   }

//   const userRole = auth.user?.role;

//   // Admins have universal access
//   if (userRole === "admin") {
//     return children;
//   }

//   // Role check for other users
//   if (allowedRoles.length && !allowedRoles.includes(userRole)) {
//     // Redirect unauthorized access to appropriate dashboard based on user role
//     if (userRole === "user") {
//       return <Navigate to="/user/dashboard" replace />;
//     }
//     // If role is unrecognized, redirect to login
//     return <Navigate to="/auth/login" replace />;
//   }

//   return children;
// };

// export default PrivateRoute;

// import React from "react";
// import { Navigate } from "react-router-dom";
// import { useSelector } from "react-redux";

// const PrivateRoute = ({ children, allowedRoles = [] }) => {
//   const auth = useSelector((state) => state.auth);
  
//   // Get token from localStorage to check if user manually navigated
//   const token = localStorage.getItem("token");
  
//   // First check: No token in localStorage - definitely not authenticated
//   if (!token) {
//     return <Navigate to="/auth/login" replace />;
//   }
  
//   // Second check: Token exists but Redux state shows not logged in
//   // This can happen on page refresh or manual navigation
//   if (!auth.isLoggedIn || !auth.user) {
//     return <Navigate to="/auth/login" replace />;
//   }
  
//   // Third check: Token and Redux state exist but token might be invalid/expired
//   // You might want to add a token validation check here if needed
  
//   const userRole = auth.user?.role;
  
//   // Fourth check: User role validation
//   if (!userRole) {
//     return <Navigate to="/auth/login" replace />;
//   }

//   // Admins have universal access
//   if (userRole === "admin") {
//     return children;
//   }

//   // Role-based access control
//   if (allowedRoles.length && !allowedRoles.includes(userRole)) {
//     // Redirect unauthorized users to their appropriate dashboard
//     if (userRole === "user") {
//       return <Navigate to="/user/dashboard" replace />;
//     }
//     // Unknown role - redirect to login for security
//     return <Navigate to="/auth/login" replace />;
//   }

//   return children;
// };

// export default PrivateRoute;


import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const auth = useSelector((state) => state.auth);
  
  // Get token from localStorage to check for manual navigation
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  
  // Multiple security checks:
  
  // 1. No token in localStorage
  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }
  
  // 2. No user data in localStorage
  if (!storedUser) {
    // Clear invalid token and redirect
    localStorage.removeItem("token");
    return <Navigate to="/auth/login" replace />;
  }
  
  // 3. Redux state doesn't match localStorage (app state lost)
  if (!auth.isLoggedIn || !auth.user) {
    // Something is wrong with the auth state, redirect to login
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/auth/login" replace />;
  }
  
  // 4. Validate user role exists
  const userRole = auth.user?.role;
  if (!userRole) {
    // No role defined, security risk
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/auth/login" replace />;
  }

  // 5. Admin universal access
  if (userRole === "admin") {
    return children;
  }

  // 6. Role-based access control
  if (allowedRoles.length && !allowedRoles.includes(userRole)) {
    // User doesn't have permission for this route
    if (userRole === "user") {
      return <Navigate to="/user/dashboard" replace />;
    }
    // Unknown role - security risk
    return <Navigate to="/auth/login" replace />;
  }

  // All checks passed - render protected content
  return children;
};

export default PrivateRoute;