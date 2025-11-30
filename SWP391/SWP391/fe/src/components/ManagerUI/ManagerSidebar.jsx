// import React from "react";
// import { ConfigProvider, Menu, Typography, Button } from "antd";
// import { Link, useLocation } from "react-router-dom";
// import {
//   CarOutlined,
//   DashboardOutlined,
//   ContainerOutlined,
//   BarChartOutlined,
//   ThunderboltOutlined,
//   MenuFoldOutlined,
//   MenuUnfoldOutlined,
//   CheckCircleOutlined, // Approvals
//   TagOutlined, // Promotion Management
//   TeamOutlined, // Staff Management
// } from "@ant-design/icons";

// const { Title } = Typography;

// // --- SHARED COLOR CONFIGURATION (DARK THEME) ---
// const ACCENT_COLOR = "#00BCD4"; 
// const BACKGROUND_COLOR = "#1F2937"; 

// // Function to create menu item
// function getItem(label, key, icon, children) {
//   // Key cho Link: Nếu là nhóm (có children) thì dùng key, ngược lại dùng đường dẫn
//   const linkKey = children ? key : key;
//   return {
//     key: linkKey,
//     icon,
//     children,
//     label: children ? label : <Link to={`/dealer/${key}`}>{label}</Link>,
//   };
// }

// // ===========================================
// // CẤU TRÚC MENU CHUYÊN BIỆT CHO DEALER MANAGER
// // ===========================================
// const managerItems = [
//   getItem("Dashboard", "overview", <DashboardOutlined />),
  
//   // GROUP 1: PRODUCTS & SALES MANAGEMENT
//   getItem("Quản lý Xe & Giao dịch", "sales_group", <ContainerOutlined />, [
//     // 🚗 Vehicle Catalog
//     getItem("Danh sách xe", "vehicles", <CarOutlined />),
//     // 💼 Approvals (Phê duyệt Báo giá / Đơn hàng)
//     getItem("Phê duyệt Giao dịch", "approvals", <CheckCircleOutlined />), 
//     // 🏷️ Promotion Management
//     getItem("Quản lý Khuyến mãi", "promotions", <TagOutlined />), 
//   ]),

//   // GROUP 2: REPORTING & STAFF MANAGEMENT
//   getItem("Hệ thống & Báo cáo", "system_group", <BarChartOutlined />, [
//     // 📈 Reports
//     getItem("Báo cáo Doanh số", "reports", <BarChartOutlined />),
//     // 👥 Dealer Staff Management
//     getItem("Quản lý Nhân viên", "users", <TeamOutlined />),
//   ]),
// ];


// const ManagerSidebar = ({ collapsed, setCollapsed }) => {
//   const location = useLocation();
  
//   // Sử dụng cấu trúc menu dành riêng cho Manager
//   const items = managerItems;

//   const currentPath = location.pathname.split("/").pop(); 
  
//   const findOpenKeys = () => {
//     const openKeys = [];
//     items.forEach(item => {
//         // Kiểm tra nếu item là SubMenu và một trong các con của nó khớp với đường dẫn hiện tại
//         if (item.children && item.children.some(child => child.key === currentPath)) {
//             openKeys.push(item.key);
//         }
//     });
//     return openKeys;
//   };

//   const selectedKeys = [currentPath || 'overview'];
//   const openKeys = findOpenKeys(); 

//   return (
//     <ConfigProvider
//       theme={{
//         components: {
//           Menu: {
//             itemSelectedBg: ACCENT_COLOR, 
//             itemSelectedColor: 'black', 
//             itemHoverBg: ACCENT_COLOR, 
//             itemHoverColor: 'black',
//             itemColor: "#E0E0E0", 
//             subNavTitleColor: "white", 
//             itemBg: BACKGROUND_COLOR, 
//             subMenuItemBg: BACKGROUND_COLOR, 
//           },
//         },
//       }}
//     >
//       <div 
//         style={{ 
//           height: "100%", 
//           display: "flex", 
//           flexDirection: "column",
//           backgroundColor: BACKGROUND_COLOR,
//         }}
//       >
//         {/* BRAND HEADER */}
//         <div
//           style={{
//             backgroundColor: BACKGROUND_COLOR, 
//             padding: "16px 12px",
//             textAlign: "center",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: collapsed ? "center" : "flex-start", 
//             gap: "8px",
//             borderBottom: `1px solid #374151`, 
//             height: 64, 
//           }}
//         >
//           <ThunderboltOutlined style={{ fontSize: "30px", color: ACCENT_COLOR }} />
//           {!collapsed && (
//             <Title
//               level={3}
//               style={{
//                 color: ACCENT_COLOR,
//                 margin: 0,
//                 fontWeight: 700,
//                 whiteSpace: 'nowrap',
//               }}
//             >
//               EV MANAGER
//             </Title>
//           )}
//         </div>
        
//         {/* MENU */}
//         <Menu
//           mode="inline"
//           selectedKeys={selectedKeys}
//           defaultOpenKeys={openKeys}
//           items={items}
//           inlineCollapsed={collapsed} 
//           style={{
//             flex: 1,
//             backgroundColor: BACKGROUND_COLOR, 
//             color: "white", 
//             borderRight: 'none',
//             paddingTop: '8px'
//           }}
//         />

//         {/* COLLAPSE TOGGLE BUTTON */}
//         <div 
//           style={{ 
//             padding: '12px', 
//             borderTop: '1px solid #374151', 
//             backgroundColor: BACKGROUND_COLOR,
//             textAlign: 'center'
//           }}
//         >
//           <Button
//             type="text"
//             onClick={() => setCollapsed(!collapsed)} 
//             icon={collapsed ? <MenuUnfoldOutlined style={{ fontSize: 18 }} /> : <MenuFoldOutlined style={{ fontSize: 18 }} />}
//             style={{ color: ACCENT_COLOR, width: '100%' }}
//           >
//             {!collapsed && 'Collapse'}
//           </Button>
//         </div>
//       </div>
//     </ConfigProvider>
//   );
// };

// export default ManagerSidebar;