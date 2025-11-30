import React from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Pages
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";

// ===================================
// DEALER (Layout & Pages)
// ===================================
import DealerLayout from "./components/ui/DealerLayout";
import Overview from "./pages/dealer/Overview";
import Customers from "./pages/dealer/Customers/Customers.jsx";
import VehicleDetail from "./pages/dealer/Vehicles/VehicleDetail.jsx";
import ComparePage from "./pages/dealer/Vehicles/ComparePage.jsx";
import QuotationForm from "./pages/dealer/Orders/QuotationForm.jsx";
import SalesReportByEmployee from "./pages/dealer/Reports/SalesReportByEmployee.jsx";
import FeedbackList from "./pages/dealer/Feedbacks/FeedbackList.jsx";
import FeedbackDetail from "./pages/dealer/Feedbacks/FeedbackDetail.jsx";
import OrderManagement from "./pages/dealer/Orders/OrderManagement.jsx";
import VehicleList from "./pages/dealer/Vehicles/VehicleList.jsx";
import UploadImage from "./components/UploadImage.jsx";
import TestDrivePage from "./pages/dealer/Customers/TestDrivePage.jsx";
import UserManagement from "./pages/dealer/UserManagement.jsx";
import PaymentResults from "./pages/dealer/Payments/PaymentResults.jsx";
//import PaymentPage from "./pages/dealer/Payments/PaymentPage.jsx";
// ===================================
// EVM (Layout & Pages)
// ===================================
import EvmLayout from "./pages/evm/EvmLayout";
import Dashboard from "./pages/evm/Dashboard";
import VehicleModel from "./pages/evm/Products/VehicleModel";
import VehicleVersions from "./pages/evm/Products/VehicleVersions.jsx";
import VehicleColors from "./pages/evm/Products/VehicleColors";
import VehicleDistribution from "./pages/evm/Products/VehicleDistribution.jsx";
import VehicleDetailManager from "./pages/evm/Products/VehicleDetailManager.jsx";
import VehicleRequest from "./pages/evm/Products/VehicleRequest.jsx";
import Inventory from "./pages/evm/Products/Inventory.jsx";
import Promotion from "./pages/evm/Products/Promotion.jsx";
import DealerList from "./pages/evm/Dealers/DealerList";
import Contracts from "./pages/evm/Dealers/Contracts";
import Accounts from "./pages/evm/Dealers/Accounts";
import InventoryConsumptionReport from "./pages/evm/Reports/InventoryConsumptionReport.jsx";
import RegionalSalesReport from "./pages/evm/Reports/RegionalSalesReport.jsx";
import FinancialDebtReport from "./pages/evm/Reports/FinancialDebtReport.jsx";
import PromotionManagement from "./pages/dealer/Orders/PromotionManagement.jsx";
import VehicleInventoryManager from "./pages/dealer/Vehicles/VehicleInventoryManager.jsx";
import ContractForm from "./pages/dealer/Orders/ContractForm.jsx";
import ContractDetailView from "./pages/dealer/Orders/ContractDetailView.jsx";
import OrderPayments from "./pages/dealer/Payments/OrderPayments.jsx";

function App() {
  const router = createBrowserRouter([
    // ===============================
    // PUBLIC ROUTES
    // ===============================
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },

    // ===============================
    // DEALER ROUTES (Protected)
    // ===============================
    {
      path: "/dealer",
      element: (
        // Quyền truy cập cấp cao nhất cho toàn bộ khu vực /dealer
        <ProtectedRoute allowedRoles={["dealer_manager", "staff"]}>
          <DealerLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Navigate to="overview" replace /> },
        { path: "overview", element: <Overview /> },

        // 1. Phân quyền cho Quản lý (Manager Only)
        // Các trang Quản lý Người dùng, Báo cáo Tổng thể, và Khuyến mãi thường chỉ dành cho Manager
        {
          path: "users",
          element: (
            // CHỈ cho phép dealer_manager truy cập
            <ProtectedRoute allowedRoles={["dealer_manager"]}>
              <UserManagement />
            </ProtectedRoute>
          ),
        },
        {
          path: "reports",
          element: (
            // CHỈ cho phép dealer_manager truy cập
            <ProtectedRoute allowedRoles={["dealer_manager"]}>
              <SalesReportByEmployee />
            </ProtectedRoute>
          ),
        },
        {
          path: "promotions",
          element: (
            // CHỈ cho phép dealer_manager truy cập
            <ProtectedRoute allowedRoles={["dealer_manager"]}>
              <PromotionManagement />
            </ProtectedRoute>
          ),
        },

        // 2. Phân quyền chung (Manager và Staff)
        // Các trang bán hàng, xe cộ, và khách hàng thường dành cho cả 2 vai trò
        { path: "vehicles", element: <VehicleList /> },
        { path: "vehicle_detail/:ids", element: <VehicleDetail /> },
        { path: "compare/:id1/:id2", element: <ComparePage /> },
        { path: "compare/:ids", element: <ComparePage /> },

        { path: "customers", element: <Customers /> },
        { path: "orderManagement", element: <OrderManagement /> },
        { path: "quotation", element: <QuotationForm /> },
        { path: "contracts/create/:id", element: <ContractForm /> },
        {
          path: "contracts/:contractId",
          element: <ContractDetailView />,
        },
        { path: "paymentByOrder/:orderId", element: <OrderPayments /> },
         { path: "payment/result", element: <PaymentResults /> },
        // Các trang khác
        { path: "feedbacks", element: <FeedbackList /> },
        { path: "feedbacks/:id", element: <FeedbackDetail /> },
        //{ path: "paymentss", element: <PaymentPage /> },
        { path: "upload", element: <UploadImage /> },
        { path: "testdrive", element: <TestDrivePage /> },
        { path: "inventories", element: <VehicleInventoryManager /> },
      ],
    },

    // ===============================
    // EVM ROUTES (Protected)
    // ===============================
    {
      path: "/evm",
      element: (
        <ProtectedRoute allowedRoles={[ "evm_staff","admin"]}>
          <EvmLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Navigate to="dashboard" replace /> },
        { path: "dashboard", element: <Dashboard /> },
        // Products
        { path: "products/vehiclemodel", element: <VehicleModel /> },
        { path: "products/versions", element: <VehicleVersions /> },
        { path: "products/colors", element: <VehicleColors /> },
        { path: "products/detailmanager", element: <VehicleDetailManager /> },
        { path: "products/distributions", element: <VehicleDistribution /> },
        { path: "products/request", element: <VehicleRequest /> },
        { path: "products/inventory", element: <Inventory /> },
        { path: "products/promotions", element: <Promotion /> },
        // Dealers
        { path: "dealers/list", element: <DealerList /> },
        { path: "dealers/contracts", element: <Contracts /> },
        { path: "dealers/accounts", element: <Accounts /> },
        // Reports
        { path: "reports/inventoryconsumption-report", element: <InventoryConsumptionReport /> },
        { path: "reports/regionalsales-report", element: <RegionalSalesReport /> },
         { path: "reports/financialdebt-report", element: <FinancialDebtReport /> },
      ],
    },

    // ===============================
    // DEFAULT REDIRECTS (Đã sửa)
    // ===============================
    {
      // Khi người dùng truy cập gốc '/'
      // Nếu đã đăng nhập (ProtectedRoute xử lý), họ sẽ được điều hướng đến /dealer/overview
      // Nếu chưa, họ sẽ bị chuyển hướng đến /login (do logic trong ProtectedRoute)
      path: "/",
      element: <Navigate to="/dealer/overview" replace />,
    },
    {
      // Xử lý các đường dẫn không tồn tại
      path: "*",
      element: <Navigate to="/dealer/overview" replace />,
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
}

export default App;
