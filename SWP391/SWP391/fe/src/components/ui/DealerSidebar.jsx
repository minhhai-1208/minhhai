import React from "react";
import { ConfigProvider, Menu, Typography, Button } from "antd";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux"; 
import {
  CarOutlined,
  DashboardOutlined,
  UserOutlined,
  FormOutlined,
  DollarCircleOutlined,
  TeamOutlined,
  ContainerOutlined,
  BarChartOutlined,
  MessageOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

// ==========================================================
// ⭐️ CẤU HÌNH VÀ PHÂN QUYỀN
// ==========================================================

const ACCENT_COLOR = "#00BCD4";
const BACKGROUND_COLOR = "#1F2937";

// Vai trò Mặc định: Cả Manager và Staff
const DEFAULT_ROLES = ["dealer_manager", "staff"];
// Vai trò chỉ Manager
const MANAGER_ROLE = ["dealer_manager"];

// /**
//  * Helper function để tạo Menu Item
//  * @param {string} label - Nhãn hiển thị
//  * @param {string} key - Key/Path cho menu item
//  * @param {JSX.Element} icon - Icon
//  * @param {Array<Object>} children - Menu con
//  * @param {Array<string>} roles - Các role được phép truy cập
//  */
const getItem = (label, key, icon, children, roles = DEFAULT_ROLES) => {
  const linkKey = children ? key : `/dealer/${key}`;
  return {
    key,
    icon,
    children,
    label: children ? label : <Link to={linkKey}>{label}</Link>,
    roles: roles,
  };
};

// ==========================================================
// ⭐️ CẤU TRÚC MENU DỰA TRÊN PHÂN QUYỀN
// ==========================================================

const items = [
  getItem("Dashboard", "overview", <DashboardOutlined />),
  getItem("Vehicle Catalog", "vehicles", <CarOutlined />),

  // 1. SALES MANAGEMENT
  getItem("Sales Management", "sales_management_group", <ContainerOutlined />, [
    getItem("Sales Order", "orderManagement", <FormOutlined />),
    getItem("Vehicle Inventories", "inventories", <FormOutlined />),
    
    // Manager only
    getItem("Promotion Management", "promotions", <DollarCircleOutlined />, null, MANAGER_ROLE),
  ]),

  // 2. CUSTOMER MANAGEMENT
  getItem("Customer Management", "customer_group", <UserOutlined />, [
    getItem("Customers", "customers", <TeamOutlined />), 
    getItem("Test Drive", "testdrive", <CalendarOutlined />), 
    getItem("Feedback", "feedbacks", <MessageOutlined />), 
  ]),

  // 3. CÁC MỤC CHỈ MANAGER
  // MANAGER: REPORTS (Cả group chỉ Manager)
  getItem("Reports", "reports_group", <BarChartOutlined />, [
    getItem("Sales Report", "reports"),
    // getItem("Debt Report", "debt_report"), // mục con chỉ Manager
  ], MANAGER_ROLE),
  
  // MANAGER: STAFF MANAGEMENT (Manager only)
  getItem("Dealer Staff Management", "users", <UserOutlined />, null, MANAGER_ROLE),
];


// ==========================================================
// ⭐️ COMPONENT SIDEBAR
// ==========================================================

const DealerSidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();

  // LẤY ROLE TỪ REDUX
  const userRole = useSelector((state) => state.account?.role);

  // --- HÀM LỌC MENU DỰA TRÊN ROLE ---
  const filterMenuItems = (menuItems) => {
    if (!userRole) return [];

    return menuItems.flatMap(item => {
        // Kiểm tra quyền truy cập chính
        const hasAccess = item.roles.includes(userRole);

        if (hasAccess) {
            if (item.children) {
                // Lọc menu con
                const filteredChildren = filterMenuItems(item.children);

                // Chỉ trả về group nếu có ít nhất 1 mục con được phép
                if (filteredChildren.length > 0) {
                    return [{ ...item, children: filteredChildren }];
                }
                return []; 
            }
            // Trả về mục đơn nếu có quyền
            return [item];
        }
        return []; // Không có quyền truy cập
    });
  };

  const filteredItems = filterMenuItems(items);
  const currentPath = location.pathname.split("/").pop();

  // Logic tìm Open Keys dựa trên menu đã lọc
  const findOpenKeys = () => {
    const openKeys = [];
    filteredItems.forEach(item => {
        if (item.children && item.children.some(child => child.key === currentPath)) {
            openKeys.push(item.key);
        }
    });
    return openKeys;
  };

  const selectedKeys = [currentPath || 'overview'];
  const openKeys = findOpenKeys();


  return (
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            itemSelectedBg: ACCENT_COLOR,
            itemSelectedColor: '#2e3594ff',
            itemHoverBg: ACCENT_COLOR,
            itemHoverColor: 'black',
            itemColor: "#e0e0e0ff",
            subNavTitleColor: "black",
          },
        },
      }}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: BACKGROUND_COLOR,
        }}
      >
        {/* BRAND HEADER */}
        <div
          style={{
            backgroundColor: BACKGROUND_COLOR,
            padding: "16px 12px",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: "8px",
            borderBottom: `1px solid #374151`,
            height: 64,
          }}
        >
          <ThunderboltOutlined style={{ fontSize: "30px", color: ACCENT_COLOR }} />
          {!collapsed && (
            <Title
              level={3}
              style={{
                color: ACCENT_COLOR,
                margin: 0,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              EV DEALER
            </Title>
          )}
        </div>

        {/* MENU */}
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={filteredItems} 
          inlineCollapsed={collapsed}
          style={{
            flex: 1,
            backgroundColor: BACKGROUND_COLOR,
            color: "white",
            borderRight: 'none',
            paddingTop: '8px'
          }}
        />

        {/* COLLAPSE TOGGLE BUTTON (Trigger) */}
        <div
          style={{
            padding: '12px',
            borderTop: '1px solid #374151',
            backgroundColor: BACKGROUND_COLOR,
            textAlign: 'center'
          }}
        >
          <Button
            type="text"
            onClick={() => setCollapsed(!collapsed)}
            icon={collapsed ? <MenuUnfoldOutlined style={{ fontSize: 18 }} /> : <MenuFoldOutlined style={{ fontSize: 18 }} />}
            style={{ color: ACCENT_COLOR, width: '100%' }}
          >
            {!collapsed && 'Collapse'}
          </Button>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default DealerSidebar;