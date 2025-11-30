import React, { useMemo } from "react";
// ✅ SỬA LỖI: Thêm các components Ant Design bị thiếu
import { Layout, Menu, Avatar, Button, Typography, Dropdown, Space, Tag } from "antd"; 
import {
    BarChartOutlined,
    AppstoreOutlined,
    TeamOutlined,
    FileTextOutlined,
    LogoutOutlined,
    LoginOutlined,
    UserOutlined,
    DownOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/accountSlice";

const { Sider, Content, Header } = Layout;

// Màu sắc chủ đạo
const SIDER_COLOR = "#001529";
const PRIMARY_COLOR = "#1890ff";

export default function EvmLayout() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const account = useSelector((state) => state.account);

    // Lấy role và chuẩn hóa
    const role = account?.role?.toLowerCase() || "";

    // --- 1. LOGIC MENU SIDEBAR ---
    const menuItems = useMemo(() => {
        const isAdmin = ["admin"].includes(role);
        // Cả ADMIN và EVM đều có thể xem Reports
        const canViewReports = ["admin", "evm"].includes(role); 

        const items = [
            {
                key: "dashboard",
                icon: <BarChartOutlined />,
                label: "Dashboard",
                onClick: () => navigate("/evm/dashboard"),
            },
            {
                key: "products",
                icon: <AppstoreOutlined />,
                label: "Products",
                children: [
                    { key: "vehicle-model", label: "Vehicle Model", onClick: () => navigate("/evm/products/vehiclemodel") },
                    { key: "versions", label: "Vehicle Versions", onClick: () => navigate("/evm/products/versions") },
                    { key: "colors", label: "Vehicle Colors", onClick: () => navigate("/evm/products/colors") },
                    { key: "detailmanager", label: "Vehicle Detail", onClick: () => navigate("/evm/products/detailmanager") },
                    { key: "inventory", label: "Inventory", onClick: () => navigate("/evm/products/inventory") },
                    { key: "distributions", label: "Vehicle Distribution", onClick: () => navigate("/evm/products/distributions") },
                    { key: "request", label: "Vehicle Request", onClick: () => navigate("/evm/products/request") },
                    { key: "promotions", label: "Promotion", onClick: () => navigate("/evm/products/promotions") },
                ],
            },
        ];

        // Menu Dealers
        const dealerChildren = [
            { key: "dealer-list", label: "Dealer List", onClick: () => navigate("/evm/dealers/list") },
            { key: "contracts", label: "Contracts", onClick: () => navigate("/evm/dealers/contracts") },
        ];

        if (isAdmin) {
            dealerChildren.push({
                key: "accounts",
                label: "Accounts",
                onClick: () => navigate("/evm/dealers/accounts"),
            });
        }

        items.push({
            key: "dealers",
            icon: <TeamOutlined />,
            label: "Dealers",
            children: dealerChildren,
        });

        // Chỉ thêm mục Reports nếu người dùng là ADMIN HOẶC EVM
        if (canViewReports) {
            items.push({
                key: "reports",
                icon: <FileTextOutlined />,
                label: "Reports",
                children: [
                    { key: "inventoryconsumption-report", label: "Inventory Consumption Report", onClick: () => navigate("/evm/reports/inventoryconsumption-report") },
                    { key: "regionalsales-report", label: "Regional Sales Report", onClick: () => navigate("/evm/reports/regionalsales-report") },
                    { key: "financialdebt-report", label: "Financial Debt Report", onClick: () => navigate("/evm/reports/financialdebt-report") }
                ],
            });
        }

        return items;
    }, [role, navigate]);

    // --- 2. LOGIC XỬ LÝ HEADER & LOGOUT ---
    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem("token");
        navigate("/login");
    };

    // Chọn màu Tag cho Role nhìn cho xịn
    const getRoleColor = (roleName) => {
        if (roleName === "admin") return "volcano";
        if (roleName.includes("evm")) return "gold"; 
        return "geekblue"; 
    };

    // Menu xổ xuống khi bấm vào Avatar
    const userDropdownItems = [
        {
            key: 'logout',
            label: 'Logout',
            icon: <LogoutOutlined />,
            danger: true,
            onClick: handleLogout,
        },
    ];

    return (
        <Layout style={{ minHeight: "100vh" }}>
            {/* SIDER */}
            <Sider theme="dark" collapsible style={{ background: SIDER_COLOR }}>
                <div
                    className="text-white text-center py-5 font-extrabold text-xl tracking-wider cursor-pointer"
                    onClick={() => navigate("/evm/dashboard")}
                >
                    <span style={{ color: PRIMARY_COLOR }}>EV</span>-MGT
                </div>
                <Menu theme="dark" mode="inline" items={menuItems} style={{ background: SIDER_COLOR }} />
            </Sider>

            <Layout>
                {/* HEADER */}
                <Header
                    style={{
                        background: "#fff",
                        padding: "0 24px",
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        borderBottom: `1px solid #f0f0f0`,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)", 
                    }}
                >
                    {account?.token ? (
                        <Dropdown menu={{ items: userDropdownItems }} trigger={['click']}>
                            {/* Khu vực kích hoạt Dropdown */}
                            <Space className="cursor-pointer hover:bg-gray-100 py-2 px-3 rounded-lg transition-all duration-200 select-none">
                                
                                {/* Info User */}
                                <div className="flex flex-col items-end mr-1">
                                    <span className="font-semibold text-gray-700 leading-tight">
                                        {account.username || "User"}
                                    </span>
                                    <Tag 
                                        color={getRoleColor(role)} 
                                        style={{ margin: 0, fontSize: '10px', lineHeight: '14px', border: 'none', padding: '0 4px' }}
                                    >
                                        {role.toUpperCase()}
                                    </Tag>
                                </div>

                                {/* Avatar */}
                                <Avatar
                                    style={{ backgroundColor: PRIMARY_COLOR, verticalAlign: 'middle' }}
                                    icon={<UserOutlined />}
                                    size="default"
                                >
                                    {account.username?.charAt(0).toUpperCase()}
                                </Avatar>

                                {/* Mũi tên nhỏ */}
                                <DownOutlined style={{ fontSize: '10px', color: '#999' }} />
                            </Space>
                        </Dropdown>
                    ) : (
                        <Button type="primary" icon={<LoginOutlined />} onClick={() => navigate("/login")}>
                            Login
                        </Button>
                    )}
                </Header>

                {/* CONTENT */}
                <Content
                    className="p-6"
                    style={{
                        background: "#f0f2f5",
                        minHeight: "calc(100vh - 64px)",
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}