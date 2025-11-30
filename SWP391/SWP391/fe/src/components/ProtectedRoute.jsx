import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const account = useSelector((state) => state.account);

  console.log("🔐 ProtectedRoute -> account:", account);

  if (!account) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(account.role)) {
    console.warn(`🚫 Access denied for role: ${account.role}`);
    return <Navigate to="/403" replace />;
  }

  return children;
};

export default ProtectedRoute;
