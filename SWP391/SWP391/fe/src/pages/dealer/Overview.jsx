import React from "react";
import { Layout, Card, Row, Col, Statistic, List, Button, Typography, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import {
  CarOutlined,
  ShoppingCartOutlined,
  DollarCircleOutlined,
  CalendarOutlined,
  RocketOutlined,
  SolutionOutlined,
  LineChartOutlined,
  MessageOutlined,
  SettingOutlined,
  GiftOutlined, // Icon mới cho Promotions
} from "@ant-design/icons";

const { Title, Text } = Typography;

// ==========================================================
// DATA: 6 KEY MODULES (English)
// ==========================================================
const keyModules = [
  {
    id: 1,
    title: "Inventory Management",
    description: "Track SKU status, detailed stock-in/out records.",
    icon: <CarOutlined style={{ fontSize: 36, color: '#00BCD4' }} />,
    color: "#e0f7fa",
    path: "/dealer/inventories", 
  },
  {
    id: 2,
    title: "Sales Reporting",
    description: "Analyze sales performance and profitability over time.",
    icon: <LineChartOutlined style={{ fontSize: 36, color: '#ff9800' }} />,
    color: "#fff3e0",
    path: "/dealer/reports", 
  },
  {
    id: 3,
    title: "Customer Management",
    description: "Monitor customer info, purchase history, and appointments.",
    icon: <SolutionOutlined style={{ fontSize: 36, color: '#4caf50' }} />,
    color: "#e8f5e9",
    path: "/dealer/customers", 
  },
  {
    id: 4,
    title: "Test Drive Management",
    description: "Schedule, manage vehicles, and confirm test drive appointments.",
    icon: <SettingOutlined style={{ fontSize: 36, color: '#9c27b0' }} />,
    color: "#f3e5f5",
    path: "/dealer/testdrive", 
  },
  {
    id: 5,
    title: "Feedback Management",
    description: "Receive, track, and resolve customer feedback and issues.",
    icon: <MessageOutlined style={{ fontSize: 36, color: '#f44336' }} />,
    color: "#ffebee",
    path: "/dealer/feedbacks", 
  },
  { // ✅ MODULE MỚI: PROMOTION MANAGEMENT
    id: 6,
    title: "Promotion Management",
    description: "Manage, create, and track active sales promotions.",
    icon: <GiftOutlined style={{ fontSize: 36, color: '#607d8b' }} />,
    color: "#eceff1",
    path: "/dealer/promotions", 
  },
];

const Overview = () => {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
      navigate(path);
  };

  return (
    <div style={{ padding: 24, backgroundColor: '#f0f2f5' }}>
      
      {/* LARGE WELCOME CARD */}
      <Card 
        style={{ marginBottom: 24, borderRadius: 12, borderLeft: '5px solid #1890ff' }}
        bodyStyle={{ padding: 32 }}
      >
        <Row gutter={24} align="middle">
          <Col span={18}>
            <Title level={3} style={{ margin: 0 }}>
                Welcome, Dealer! 👋
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
                Welcome back to the Dealer Management System (DMS). 
                Check out the quick overview of key activities this week.
            </Text>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
             <Button 
                type="primary" 
                size="large" 
                icon={<RocketOutlined />}
                onClick={() => handleNavigate("/dealer/reports")}
             >
                View Detailed Reports
             </Button>
          </Col>
        </Row>
      </Card>

      {/* Row 1: Quick Statistics */}
      <Row gutter={24}>
        <Col span={6}>
          <Card hoverable style={{ borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  backgroundColor: "#e6f0ff",
                  padding: 12,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 50,
                  height: 50,
                }}
              >
                <CarOutlined style={{ fontSize: 24, color: "#1677ff" }} />
              </div>
              <Statistic title="Total Vehicles in Stock" value={120} prefix="📦" />
            </div>
          </Card>
        </Col>

        <Col span={6}>
          <Card hoverable style={{ borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  backgroundColor: "#e6ffed",
                  padding: 12,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 50,
                  height: 50,
                }}
              >
                <ShoppingCartOutlined
                  style={{ fontSize: 24, color: "#52c41a" }}
                />
              </div>
              <Statistic title="Orders This Week" value={8} prefix="🛒" /> 
            </div>
          </Card>
        </Col>

        <Col span={6}>
          <Card hoverable style={{ borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  backgroundColor: "#f9f0ff",
                  padding: 12,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 50,
                  height: 50,
                }}
              >
                <DollarCircleOutlined
                  style={{ fontSize: 24, color: "#722ed1" }}
                />
              </div>
              <Statistic
                title="Estimated Sales"
                value={12.5}
                suffix="Billion VND 📈"
              />
            </div>
          </Card>
        </Col>

        <Col span={6}>
          <Card hoverable style={{ borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  backgroundColor: "#fff7e6",
                  padding: 12,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 50,
                  height: 50,
                }}
              >
                <CalendarOutlined style={{ fontSize: 24, color: "#fa8c16" }} />
              </div>
              <Statistic title="Test Drives/Appointments" value={5} prefix="🗓️" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 2: To-Do Activities & Quick Links */}
      <Row gutter={24} style={{ marginTop: 24 }} align="stretch">
        <Col span={12}>
          <Card 
            title="🎯 Pending Activities" 
            style={{ height: "100%", borderRadius: 12 }}
          >
            <List
                header={<Text strong>High-priority tasks for today</Text>}
                bordered
                dataSource={[
                    { action: "Confirm Order", detail: "ORD008 (Customer Truong K.)", tag: "Critical", color: "red" },
                    { action: "Consultation Call", detail: "Customer Nguyen T. (VF 3 Request)", tag: "Urgent", color: "volcano" },
                    { action: "Prepare Vehicle", detail: "VF 9 Test Drive (14:00 today)", tag: "Upcoming", color: "green" },
                ]}
                renderItem={(item) => (
                    <List.Item actions={[<Tag color={item.color}>{item.tag}</Tag>]}>
                        <List.Item.Meta
                            title={item.action}
                            description={item.detail}
                        />
                    </List.Item>
                )}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card 
            title="🔗 Quick Links & Documents" 
            style={{ height: "100%", borderRadius: 12 }}
          >
            <List
                dataSource={[
                    { label: "Detailed Inventory Report", path: "/dealer/inventories" },
                    { label: "Customer List", path: "/dealer/customers" },
                    { label: "Test Drive Management", path: "/dealer/testdrive" },
                    { label: "Feedback Management", path: "/dealer/feedbacks" },
                ]}
                renderItem={(item) => (
                    <List.Item>
                        <Button 
                            type="link" 
                            style={{ padding: 0 }}
                            onClick={() => handleNavigate(item.path)}
                        >
                            {item.label}
                        </Button>
                    </List.Item>
                )}
            />
          </Card>
        </Col>
      </Row>

      {/* ========================================================== */}
      {/* Row 3: Core Management Modules (3 over 3 layout) */}
      {/* ========================================================== */}
      <Title level={4} style={{ marginTop: 24, marginBottom: 16, marginLeft: 12 }}>
          Core Management Modules
      </Title>
      
      {/* Row 3.1 (Modules 1, 2, 3) */}
      <Row gutter={24} style={{ marginBottom: 24 }}> 
        {keyModules.slice(0, 3).map((module) => (
          <Col span={8} key={module.id}>
            <Card
              hoverable
              style={{ 
                height: "100%", 
                borderRadius: 12, 
                backgroundColor: module.color,
                transition: 'all 0.3s ease',
                border: 'none',
              }}
              bodyStyle={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center', 
                padding: '24px', 
                justifyContent: 'space-between', 
                height: '100%',
              }}
            >
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {module.icon}
                <Title level={5} style={{ marginTop: 16, marginBottom: 8, color: '#333' }}>{module.title}</Title>
                <Text type="secondary" style={{ fontSize: 13, minHeight: 40 }}>{module.description}</Text>
              </div>
              <Button 
                  type="primary" 
                  style={{ marginTop: 24, borderRadius: 8 }}
                  onClick={() => handleNavigate(module.path)}
              >
                  Go to Module
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Row 3.2 (Modules 4, 5, 6) */}
      <Row gutter={24}>
        {keyModules.slice(3, 6).map((module) => (
          <Col span={8} key={module.id}>
            <Card
              hoverable
              style={{ 
                height: "100%", 
                borderRadius: 12, 
                backgroundColor: module.color,
                transition: 'all 0.3s ease', 
                border: 'none',
              }}
              bodyStyle={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center', 
                padding: '24px', 
                justifyContent: 'space-between',
                height: '100%',
              }}
            >
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {module.icon}
                <Title level={5} style={{ marginTop: 16, marginBottom: 8, color: '#333' }}>{module.title}</Title>
                <Text type="secondary" style={{ fontSize: 13, minHeight: 40 }}>{module.description}</Text>
              </div>
              <Button 
                  type="primary" 
                  style={{ marginTop: 24, borderRadius: 8 }}
                  onClick={() => handleNavigate(module.path)}
              >
                  Go to Module
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Overview;