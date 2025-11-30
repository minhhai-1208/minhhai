import React from "react";
import { Layout, theme } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import DealerSidebar from "./DealerSidebar"; 
import DealerHeader from "./DealerHeader";

const { Content, Footer, Sider } = Layout;

// --- CẤU HÌNH MÀU SẮC MỚI (Mềm mại hơn) ---
const ACCENT_COLOR = "#00BCD4"; 
const BACKGROUND_COLOR_DARK = "#2C3E50"; // Dark Charcoal (Mềm mại hơn #1F2937)
const CONTENT_BACKGROUND_COLOR = "#34495E"; // Màu nền Content (Sáng hơn nền chính)

const siderStyle = {
  overflow: "auto",
  height: "100vh",
  position: "fixed", 
  insetInlineStart: 0,
  top: 0,
  bottom: 0,
  zIndex: 100, 
};

// Ánh xạ route → Tiêu đề Header (Tiếng Anh)
const pageTitles = {
  "/dealer/overview": "Dashboard Overview",
  "/dealer/vehicles": "Vehicle Inventory",
  "/dealer/customers": "Customer List",
  "/dealer/sales": "Sales Management",
  "/dealer/reports": "Reports & Analytics",
  "/dealer/compare": "Vehicle Comparison",
  "/dealer/orderManagement": "Order Management",
};

const DealerLayout = () => {
  const [collapsed, setCollapsed] = React.useState(true); 
    
  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  const location = useLocation();

  // --- Get dealerID from logged-in account ---
  const account = JSON.parse(localStorage.getItem("account")) || {};
  const dealerID = account.dealerId; 
  const dealerName = dealerID ? `Dealer ID ${dealerID}` : "Current Dealer";

  // Find the matching base path
  const basePath = Object.keys(pageTitles).find((path) =>
    location.pathname.startsWith(path)
  );
  const title = basePath ? pageTitles[basePath] : "Dealer System";
  
  // Chiều rộng của Sidebar khi mở và gập
  const SIDER_WIDTH = 250;
  const SIDER_COLLAPSED_WIDTH = 80;

  return (
    <Layout style={{ backgroundColor: BACKGROUND_COLOR_DARK }}> 
      {/* Sidebar cố định */}
      <Sider 
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        collapsedWidth={SIDER_COLLAPSED_WIDTH}
        width={SIDER_WIDTH}
        trigger={null}
        style={{ ...siderStyle, backgroundColor: BACKGROUND_COLOR_DARK }}
      >
        <DealerSidebar 
            collapsed={collapsed} 
            setCollapsed={setCollapsed} 
        />
      </Sider>

      {/* Layout chính (Header + Content) */}
      <Layout 
        style={{ 
          marginLeft: collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH,
          transition: 'margin-left 0.2s',
          minHeight: '100vh',
          backgroundColor: BACKGROUND_COLOR_DARK, 
        }}
      >
        {/* Header chung */}
        <DealerHeader title={`${title} - ${dealerName}`} />

        {/* Nội dung thay đổi theo từng route con */}
        <Content style={{ margin: "24px 16px 0", overflow: "initial" }}>
          <div
            style={{
              padding: 24,
              // ✅ Áp dụng màu Content Area mới
              background: CONTENT_BACKGROUND_COLOR, 
              borderRadius: borderRadiusLG,
              minHeight: "calc(100vh - 150px)",
              color: 'white', 
            }}
          >
            <Outlet />
          </div>
        </Content>

        <Footer
          style={{
            textAlign: "center",
            color: '#BDC3C7', // Màu chữ sáng hơn cho Footer
            backgroundColor: BACKGROUND_COLOR_DARK, 
            fontSize: "15px",
            fontWeight: 600,
            letterSpacing: "0.5px",
            fontFamily: "Arial, sans-serif",
          }}
        >
          © {new Date().getFullYear()} AnhKhoi Co., Ltd - Dealer Management
          System <br />
          Support:{" "}
          <a href="mailto:anhkhoivvt@gmail.com" style={{ color: ACCENT_COLOR }}>
            it-support:anhkhoivvt@gmail.com
          </a>{" "}
          | Hotline: 0123 456 789 <br />
          Version 1.0.0 - Internal Use Only
        </Footer>
      </Layout>
    </Layout>
  );
};

export default DealerLayout;