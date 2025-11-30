import React, { useState } from "react";
import {
  Layout,
  Input,
  Avatar,
  Badge,
  Button,
  Dropdown,
  Modal,
  Form,
  Typography,
  ConfigProvider,
} from "antd";
import {
  LogoutOutlined,
  UserOutlined,
  IdcardOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/accountSlice";
import api from "../../config/axios";
import { toast } from "react-toastify";

const { Header } = Layout;
const { Text } = Typography;

// --- SHARED COLOR CONFIGURATION ---
const ACCENT_COLOR = "#00BCD4";
const BACKGROUND_COLOR = "#2C3E50";
const BORDER_COLOR = "#34495E";

const DealerHeader = ({ title }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const account = useSelector((state) => state.account);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Helper function to format the role
  const getDisplayRole = (role) => {
    if (role === "staff") return "STAFF";
    if (role === "dealer_manager") return "MANAGER";
    return role || "UNKNOWN";
  };

  // ✅ Logout Handler
  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("account");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ✅ Open Profile Modal
  const handleOpenProfile = () => {
    // Đổ dữ liệu từ Redux state vào Form
    form.setFieldsValue({
      fullName: account.fullName,
      email: account.email,
      phone: account.phone,
      role: getDisplayRole(account.role),
      dealerId: account.dealerId,
      id: account.id,
    });
    setIsModalOpen(true);
  };

  // ✅ Update Profile (Sử dụng API đã cấu hình)
  const handleUpdateProfile = async (values) => {
    try {
      const updatePayload = {
        fullName: values.fullName,
        phone: values.phone,
      };

      // Giả định endpoint cập nhật profile là /users/{id}
      const res = await api.put(`/users/${account.id}`, updatePayload);

      // TODO: Dispatch action updateProfile

      toast.success("Profile updated successfully!");
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Error updating profile! Please check API configuration.");
      console.error("Profile update failed:", error);
    }
  };

  // ✅ User Dropdown Menu (Đã loại bỏ 'Account Settings')
  const userMenu = {
    items: [
      {
        key: "name_info",
        label: (
          <div
            style={{
              padding: "4px 8px",
              borderBottom: `1px solid ${BORDER_COLOR}`,
            }}
          >
            <Text strong style={{ color: "white" }}>
              {account.fullName || account.name}
            </Text>
            <br />
            {/* HIỂN THỊ ROLE ĐÃ ĐỊNH DẠNG */}
            <Text
              type="secondary"
              style={{ fontSize: 12, color: ACCENT_COLOR }}
            >
              {getDisplayRole(account.role)}
            </Text>
          </div>
        ),
        disabled: true,
        style: {
          cursor: "default",
          height: "auto",
          padding: "8px 0",
          backgroundColor: BACKGROUND_COLOR,
        },
      },
      {
        key: "profile",
        label: "My Profile",
        icon: <UserOutlined style={{ color: ACCENT_COLOR }} />,
        onClick: handleOpenProfile,
        style: { backgroundColor: BACKGROUND_COLOR, color: "white" },
      },

      {
        key: "logout",
        label: "Logout",
        icon: <LogoutOutlined style={{ color: "red" }} />,
        onClick: handleLogout,
        style: { backgroundColor: BACKGROUND_COLOR, color: "white" },
      },
    ],
  };

  return (
    <>
      <Header
        style={{
          padding: "0 24px",
          background: BACKGROUND_COLOR,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `2px solid ${ACCENT_COLOR}`,
        }}
      >
        {/* CENTER TITLE */}
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 20,
            fontWeight: 600,
            color: ACCENT_COLOR,
          }}
        >
          {title}
        </div>

        {/* RIGHT CLUSTER */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* 🛑 Notification Button ĐÃ BỊ LOẠI BỎ */}

          {account ? (
            <Dropdown
              dropdownRender={(menu) => (
                <ConfigProvider
                  theme={{
                    components: {
                      Menu: {
                        itemBg: BACKGROUND_COLOR,
                        colorText: "white",
                        itemHoverBg: ACCENT_COLOR,
                        itemHoverColor: "black",
                      },
                    },
                  }}
                >
                  {menu}
                </ConfigProvider>
              )}
              menu={userMenu}
              placement="bottomRight"
              trigger={["click"]}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 8,
                }}
                role="button"
              >
                <Text style={{ fontWeight: 500, color: "white" }}>
                  {account.fullName || account.name}
                </Text>
                <Avatar
                  src="https://i.pinimg.com/736x/b1/ca/d5/b1cad520d662c8a4b3d729cc8ee38ac2.jpg"
                  icon={<UserOutlined />}
                  style={{
                    border: `2px solid ${ACCENT_COLOR}`,
                    backgroundColor: BORDER_COLOR,
                  }}
                />
              </div>
            </Dropdown>
          ) : (
            // ✅ Login/Register Buttons
            <div style={{ display: "flex", gap: 12 }}>
              <Link to="/login">
                <Button>Login</Button>
              </Link>
              <Link to="/register">
                <Button
                  type="primary"
                  style={{
                    backgroundColor: ACCENT_COLOR,
                    borderColor: ACCENT_COLOR,
                  }}
                >
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Header>

      {/* --- ✅ Modal quản lý Profile --- */}
      <Modal
        title="Profile Management"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText="Save Changes"
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
          labelCol={{ span: 24 }}
        >
          {/* Thông tin hệ thống (Chỉ hiển thị) */}
          <Form.Item label="User ID" name="id">
            <Input prefix={<IdcardOutlined />} disabled />
          </Form.Item>
          <Form.Item label="Role" name="role">
            <Input prefix={<UserOutlined />} disabled />
          </Form.Item>
          <Form.Item label="Dealer ID" name="dealerId">
            <Input prefix={<ShopOutlined />} disabled />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ type: "email" }]}>
            <Input disabled />
          </Form.Item>

          {/* Thông tin có thể chỉnh sửa */}
          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[
              { required: true, message: "Please input your full name!" },
            ]}
          >
            <Input prefix={<UserOutlined style={{ color: ACCENT_COLOR }} />} />
          </Form.Item>
          <Form.Item label="Phone Number" name="phone">
            <Input
              prefix={<IdcardOutlined style={{ color: ACCENT_COLOR }} />}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default DealerHeader;
