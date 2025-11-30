import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Spin,
  Typography,
  Space,
  Tag
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { fetchUsers, postUser, putUser, removeUser } from "../../service/user.api";
// Import các hàm API đã định nghĩa


const { Option } = Select;
const { Title } = Typography;

// --- Định nghĩa các vai trò (roles) ---
const ROLE_OPTIONS = [
  { value: "dealer_manager", label: "Dealer Manager" },
  { value: "dealer_staff", label: "Dealer Staff" },
];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  // Lấy dealerId và role từ localStorage
  const account = JSON.parse(localStorage.getItem("account"));
  const currentDealerId = Number(account?.dealerId);
  const currentRole = account?.role;

  // 👤 Load Users và lọc theo dealerId
  const loadUsers = useCallback(async () => {
    if (!currentDealerId) {
      message.warning("Không tìm thấy ID đại lý.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetchUsers();
      // Giả định fetchUsers trả về mảng trực tiếp hoặc bọc trong .data
      const allUsers = response.data || (Array.isArray(response) ? response : []); 

      // ✅ Lọc Users theo dealerId hiện tại
      const filteredUsers = allUsers.filter(
        (user) => Number(user.dealerId) === currentDealerId
      );
      setUsers(filteredUsers);
    } catch (err) {
      message.error("Failed to load user list!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentDealerId]);

  useEffect(() => {
    if (currentDealerId) loadUsers();
  }, [currentDealerId, loadUsers]);

  // 🟢 Add / Edit user
  const handleSubmit = async (values) => {
    
    // Payload luôn bao gồm dealerId hiện tại
    const payload = {
      ...values,
      dealerId: currentDealerId,
      // Khi cập nhật, không gửi password nếu trường đó trống (để giữ mật khẩu cũ)
      ...(editingUser && !values.password && { password: undefined }), 
    };

    try {
      if (editingUser) {
        // CẬP NHẬT (PUT)
        await putUser({ ...payload, id: editingUser.id });
        message.success(`User ${editingUser.username} updated successfully!`);
      } else {
        // THÊM MỚI (POST) - Gọi đến endpoint /register
        await postUser(payload);
        message.success(`User ${values.username} added successfully!`);
      }
      handleCancelModal();
      loadUsers();
    } catch (err) {
      message.error(`Failed to save user: ${err.response?.data?.message || err.message}`);
    }
  };

  // 🔴 Delete user
  const handleDelete = async (id) => {
    try {
      await removeUser(id);
      message.success("User deleted successfully!");
      loadUsers();
    } catch (err) {
      message.error(`Failed to delete user: ${err.response?.data?.message || err.message}`);
    }
  };

  // 📝 Edit user
  const handleEdit = (record) => {
    setEditingUser(record);
    // Điền các trường vào Form, trừ password
    form.setFieldsValue(record);
    setOpenModal(true);
  };

  // --- Reset Modal và Form ---
  const handleCancelModal = () => {
    setOpenModal(false);
    setEditingUser(null);
    form.resetFields();
  };

  // ✅ ĐỊNH NGHĨA BIẾN isNewUser ĐỂ DÙNG TRONG RENDER JSX
  const isNewUser = !editingUser;

  // 🧱 User columns
  const userColumns = [
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Full Name", dataIndex: "fullName", key: "fullName" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { 
      title: "Role", 
      dataIndex: "role", 
      key: "role",
      render: (role) => <Tag color="blue">{role?.toUpperCase()}</Tag>
    },
    { title: "Dealer ID", dataIndex: "dealerId", key: "dealerId" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
            // Chỉ cho phép admin chỉnh sửa admin khác (ngăn chặn dealer manager thay đổi role admin)
            disabled={record.role === 'admin' && currentRole !== 'admin'} 
          >
            Edit
          </Button>

          <Popconfirm
            title={`Are you sure to delete user ${record.username}?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              // Ngăn chặn xóa các tài khoản có role cao hơn hoặc bằng nếu không phải là Admin
              disabled={record.role === 'admin' || (record.role === 'dealer_manager' && currentRole !== 'admin')}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading && users.length === 0)
    return <Spin size="large" className="flex justify-center mt-10" tip="Loading users..." />;

  return (
    <Card
      title={`User Management - Dealer #${currentDealerId}`}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadUsers}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
                setEditingUser(null);
                setOpenModal(true);
            }}
          >
            Add New User
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table
          columns={userColumns}
          dataSource={users.map((u) => ({ ...u, key: u.id }))}
          pagination={{ pageSize: 10 }}
          bordered
        />
      </Spin>

      {/* 🧩 Modal Add/Edit User */}
      <Modal
        title={isNewUser ? "Add New User" : `Edit User: ${editingUser?.username}`}
        open={openModal}
        onCancel={handleCancelModal}
        onOk={() => form.submit()}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ role: 'staff' }}>
          
          {/* Username chỉ hiển thị khi Thêm mới */}
          {isNewUser && (
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: "Please enter username!" }]}
            >
              <Input />
            </Form.Item>
          )}
          
          <Form.Item
            label={isNewUser ? "Password" : "New Password (Leave blank to keep old)"}
            name="password"
            // Quy tắc bắt buộc password chỉ áp dụng khi thêm mới
            rules={isNewUser ? [{ required: true, message: "Please enter password!" }] : []}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[{ required: true, message: "Please enter full name!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Email" name="email" rules={[{ type: 'email', message: "Invalid email format!" }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Phone" name="phone">
            <Input />
          </Form.Item>
          
          <Form.Item label="Role" name="role" rules={[{ required: true, message: "Please select a role!" }]}>
            <Select placeholder="Select user role">
              {ROLE_OPTIONS.map(opt => (
                <Option key={opt.value} value={opt.value}>
                    {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Dealer ID hiển thị nhưng bị disable */}
          <Form.Item label="Dealer ID" initialValue={currentDealerId}>
            <Input disabled value={currentDealerId} />
          </Form.Item>

        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement;