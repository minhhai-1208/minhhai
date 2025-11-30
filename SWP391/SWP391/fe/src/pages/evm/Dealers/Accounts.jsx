import React, { useEffect, useState, useMemo } from "react";
import {
    Table,
    Card,
    Button,
    Form,
    Input,
    Select,
    Tag,
    Popconfirm,
    Space,
    Drawer,
    Tooltip,
    Row,
    Col,
    Alert, // 🆕 Import Alert
} from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    ShopOutlined,
    StopOutlined, // 🆕 Icon cho alert
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { useSelector } from "react-redux"; // 🆕 Import useSelector
import {
    fetchUsers,
    postUser,
    putUser,
    removeUser,
} from "../../../service/user.api";
import { fetchDealers } from "../../../services/dealer.api";

// ----------------------------------------------------------------------

export default function Accounts() {
    // 🆕 Lấy Role từ Redux và kiểm tra quyền
    const { role } = useSelector((state) => state.account);
    const isAdmin = ["admin"].includes(role?.toLowerCase());

    const [accounts, setAccounts] = useState([]);
    const [dealers, setDealers] = useState([]);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // ✅ STATE LỌC ĐƯỢC GIỮ LẠI
    const [filterDealerId, setFilterDealerId] = useState(undefined);

    // Duy trì trạng thái phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    // 🔹 Load initial data
    const loadData = async () => {
        // 🆕 KHÔNG TẢI NẾU KHÔNG CÓ QUYỀN
        if (!isAdmin) return; 

        setLoading(true);
        try {
            const [accRes, dealerRes] = await Promise.all([
                fetchUsers(),
                fetchDealers(),
            ]);

            setAccounts(accRes.data);
            setDealers(dealerRes.data);
        } catch (err) {
            console.error("Load Data Error:", err);
            toast.error("Failed to load accounts!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [isAdmin]); // Thêm isAdmin vào dependencies

    // --- HÀM HỖ TRỢ & LOGIC CRUD ---

    const getDealerName = (dealerId) => {
        const dealer = dealers.find((d) => d.id === dealerId);
        return dealer ? dealer.dealerName : "—";
    };

    const handleCloseDrawer = () => {
        setOpen(false);
        setEditing(null);
        form.resetFields();
    };

    const handleEdit = (record) => {
        // Chỉ mở drawer nếu có quyền
        if (!isAdmin) return; 

        setEditing(record);
        form.setFieldsValue({ ...record, dealerId: record.dealerId || undefined });
        setOpen(true);
    };

    // 💾 Add / Update
    const handleSubmit = async (values) => {
        if (!isAdmin) return; // 🆕 Chặn submit nếu không phải ADMIN
        try {
            if (editing) {
                let updatePayload = { id: editing.id, ...values };
                if (!updatePayload.password) {
                    delete updatePayload.password;
                }
                await putUser(updatePayload);
                toast.success("Account updated successfully!");
            } else {
                await postUser(values);
                toast.success("New account created successfully!");
            }
            handleCloseDrawer();
            loadData();
        } catch (err) {
            console.error("Save Account Error:", err);
            toast.error("Failed to save account!");
        }
    };

    // 🗑 Delete
    const handleDelete = async (id) => {
        if (!isAdmin) return; // 🆕 Chặn delete nếu không phải ADMIN
        try {
            await removeUser(id);
            toast.success("Account deleted successfully!");
            loadData();
        } catch (err) {
            console.error("Delete Account Error:", err);
            toast.error("Failed to delete account!");
        }
    };

    // Ứng dụng chức năng Lọc (Chỉ còn Dealer ID)
    const filteredAccounts = useMemo(() => {
        return accounts.filter((account) => {
            // Lọc theo Dealer ID
            const dealerMatch = filterDealerId
                ? account.dealerId === filterDealerId
                : true; // Nếu không có filter, hiển thị tất cả

            return dealerMatch;
        });
    }, [accounts, filterDealerId]);

    // Hàm xử lý thay đổi filter và reset trang
    const handleFilterChange = (value) => {
        setFilterDealerId(value);
        // Reset trang về 1 khi filter thay đổi
        setCurrentPage(1);
    };

    // 🟢 Cột hiển thị
    const columns = useMemo(
        () => [
            {
                title: "ID / Username",
                key: "id_username",
                width: 180,
                fixed: "left",
                render: (_, record) => (
                    <div className="flex flex-col text-sm">
                        <span className="font-bold text-blue-600">#{record.id}</span>
                        <span className="text-gray-800 font-medium">
                            <UserOutlined className="mr-1 text-xs" /> {record.username}
                        </span>
                    </div>
                ),
            },
            {
                title: "Full Name / Role",
                key: "name_role",
                width: 250,
                render: (_, record) => {
                    const lowerRole = record.role.toLowerCase();
                    let color = "orange";
                    if (lowerRole === "admin") color = "red";
                    else if (lowerRole.includes("manager")) color = "blue";
                    else if (lowerRole.includes("staff")) color = "green";

                    return (
                        <div className="flex flex-col text-sm">
                            <span className="font-medium text-gray-800">
                                {record.fullName || "—"}
                            </span>
                            <Tag color={color} className="font-medium mt-1 w-fit">
                                {record.role.toUpperCase().replace("_", " ")}
                            </Tag>
                        </div>
                    );
                },
            },
            {
                title: "Contact Info",
                key: "contact",
                width: 250,
                render: (_, record) => (
                    <div className="flex flex-col text-sm">
                        <span className="text-gray-700 flex items-center">
                            <MailOutlined className="mr-1 text-blue-500" />{" "}
                            {record.email || "—"}
                        </span>
                        <span className="text-gray-700 flex items-center mt-1">
                            <PhoneOutlined className="mr-1 text-green-500" />{" "}
                            {record.phone || "—"}
                        </span>
                    </div>
                ),
            },
            {
                title: "Dealer",
                dataIndex: "dealerId",
                key: "dealerId",
                width: 150,
                render: (dealerId) => {
                    if (!dealerId) return "—";

                    const dealerName = getDealerName(dealerId);
                    return (
                        <Tooltip title={dealerName}>
                            <Tag color="purple" className="cursor-help font-medium">
                                <ShopOutlined className="mr-1" /> D-{dealerId}
                            </Tag>
                        </Tooltip>
                    );
                },
            },
            {
                title: "Action",
                key: "action",
                fixed: "right",
                width: 100,
                align: "center",
                render: (_, record) => (
                    <div className="flex gap-1 justify-center">
                        <Tooltip title="Chỉnh sửa">
                            {/* 🆕 Disable nếu không phải ADMIN */}
                            <Button
                                type="text"
                                icon={
                                    <EditOutlined className="text-blue-500 hover:text-blue-700" />
                                }
                                onClick={() => handleEdit(record)}
                                disabled={!isAdmin} 
                            />
                        </Tooltip>
                        <Popconfirm
                            title="Xác nhận xóa tài khoản này?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            {/* 🆕 Disable nếu không phải ADMIN */}
                            <Tooltip title="Xóa">
                                <Button
                                    danger
                                    type="text"
                                    icon={<DeleteOutlined className="hover:text-red-700" />}
                                    disabled={!isAdmin} 
                                />
                            </Tooltip>
                        </Popconfirm>
                    </div>
                ),
            },
        ],
        [dealers, isAdmin] // Thêm isAdmin vào dependencies
    );

    // Logic phân trang client-side
    const paginatedAccounts = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return filteredAccounts.slice(start, end);
    }, [filteredAccounts, currentPage, pageSize]);
    
    // 🆕 Hiển thị cảnh báo nếu không có quyền
    if (!isAdmin) {
        return (
            <div className="p-4">
                <Alert
                    message="Truy cập bị từ chối"
                    description="Bạn không có quyền truy cập trang quản lý tài khoản. Chỉ Quản trị viên (ADMIN) mới có thể thực hiện thao tác này."
                    type="error"
                    showIcon
                    icon={<StopOutlined />}
                />
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-100 min-h-screen">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <UserOutlined className="mr-3 text-blue-600 text-3xl" />
                    Account Management
                </h1>
                {/* CONTAINER CHỨA FILTER VÀ BUTTON */}
                <Space size="large">
                    {/* ✅ FILTER THEO DEALER ID */}
                    <Select
                        placeholder="Filter by Dealer"
                        style={{ width: 250 }}
                        allowClear
                        onChange={handleFilterChange}
                        value={filterDealerId}
                        size="large"
                        className="rounded-lg"
                        options={dealers.map((d) => ({
                            value: d.id,
                            label: d.dealerName,
                        }))}
                    />

                    {/* 🆕 Nút Add New chỉ hiển thị khi có quyền (đã được bao bọc bởi isAdmin) */}
                    <Button
                        type="primary"
                        size="large"
                        className="bg-blue-600 hover:bg-blue-700 font-semibold flex items-center gap-1 shadow-md"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            form.resetFields();
                            setEditing(null);
                            setOpen(true);
                        }}
                    >
                        Add New Account
                    </Button>
                </Space>
            </div>

            <Card className="shadow-xl rounded-xl" loading={loading}>
                <Table
                    columns={columns}
                    dataSource={paginatedAccounts}
                    rowKey="id"
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: filteredAccounts.length, // Sử dụng tổng số sau khi lọc
                        pageSizeOptions: ["8", "16", "32"],
                        onChange: (page, size) => {
                            setCurrentPage(page);
                            setPageSize(size);
                        },
                    }}
                />
            </Card>

            {/* DRAWER CHO ADD / EDIT */}
            <Drawer
                title={
                    <span className="text-xl font-bold text-gray-800">
                        {editing ? "Edit Account: " : "Create New Account"}
                        <span className="text-blue-600 ml-2">#{editing?.id || "New"}</span>
                    </span>
                }
                open={open}
                onClose={handleCloseDrawer}
                width={550}
                destroyOnClose={true}
                maskClosable={false}
                footer={
                    <div className="flex justify-end gap-3">
                        <Button onClick={handleCloseDrawer} size="large">
                            Cancel
                        </Button>
                        <Button
                            onClick={form.submit}
                            type="primary"
                            size="large"
                            className="bg-blue-600 hover:bg-blue-700 font-bold shadow-md"
                        >
                            {editing ? "Save Changes" : "Create Account"}
                        </Button>
                    </div>
                }
            >
                {/* 🆕 DISABLE FORM NẾU KHÔNG CÓ QUYỀN (để đảm bảo không thể sửa đổi) */}
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="p-1"
                >
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
                        Account Details
                    </h3>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Username"
                                name="username"
                                rules={[{ required: true, message: "Please enter username" }]}
                            >
                                <Input placeholder="Enter username" prefix={<UserOutlined />} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Full Name" name="fullName">
                                <Input placeholder="Enter full name" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={
                            !editing
                                ? [{ required: true, message: "Please enter password" }]
                                : []
                        }
                    >
                        <Input.Password placeholder="Enter password (leave blank to keep current)" />
                    </Form.Item>

                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mt-6 mb-4">
                        Contact & Access
                    </h3>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[{ type: "email", message: "Invalid email format" }]}
                            >
                                <Input placeholder="Enter email" prefix={<MailOutlined />} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Phone" name="phone">
                                <Input
                                    placeholder="Enter phone number"
                                    prefix={<PhoneOutlined />}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="Role"
                        name="role"
                        rules={[{ required: true, message: "Please select a role" }]}
                    >
                        <Select
                            placeholder="Select account role"
                            options={[
                                { value: "dealer_manager", label: "Dealer Manager" },
                                { value: "dealer_staff", label: "Dealer Staff" },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item label="Associated Dealer" name="dealerId">
                        <Select
                            placeholder="Select dealer (optional, for Dealer roles)"
                            allowClear
                            options={dealers.map((d) => ({
                                value: d.id,
                                label: d.dealerName,
                            }))}
                        />
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    );
}