import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import {
  Form,
  Input,
  Select,
  Checkbox,
  Button,
  Card,
  Row,
  Col,
  InputNumber,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  ManOutlined,
  WomanOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";
// If you're on AntD v5, import the base reset once in your app entry:
// import "antd/dist/reset.css";

const { Option } = Select;

// Định nghĩa các Role cần Dealer ID
const DEALER_ROLES = ["STAFF", "DEALER MANAGER"];

const RegisterPage = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  //const [dealers, setDealers] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null); // State mới để theo dõi Role
  const navigate = useNavigate();

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const validatePhone = (phone) => /^0\d{9,10}$/.test(phone);

  // useEffect(() => {
  //   const loadDealers = async () => {
  //     try {
  //       const res = await api.get("/dealers");
  //       setDealers(res.data);
  //     } catch {
  //       toast.error("Failed to load dealers");
  //     }
  //   };
  //   loadDealers();
  // }, []);

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      // Nếu Role không phải là Dealer Role, loại bỏ dealerId khỏi payload
      const payload = {
        username: values.username,
        password: values.password,
        email: values.email,
        fullName: values.fullName,
        phone: values.phone,
        role: values.role,
        // Chỉ thêm dealerId nếu nó tồn tại và cần thiết
        ...(DEALER_ROLES.includes(values.role) && {
          dealerId: values.dealerId,
        }),
      };

      const response = await api.post("/register", payload);
      toast.success("Successfully created new Account!");
      console.log(response);
      navigate("/login");
    } catch (error) {
      console.error(error);
      toast.error("Create new Account FAIL !!!");
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm xử lý khi trường Role thay đổi
  const handleRoleChange = (value) => {
    setSelectedRole(value);

    // Nếu Role thay đổi sang EVM, xóa giá trị dealerId cũ để tránh gửi nhầm
    if (!DEALER_ROLES.includes(value)) {
      form.setFieldsValue({ dealerId: undefined });
    }

    // Re-validate dealerId field (Ant Design sẽ tự làm)
    form.validateFields(["dealerId"]);
  };

  // Kiểm tra xem trường Dealer ID có cần thiết không
  const isDealerFieldRequired = DEALER_ROLES.includes(selectedRole);

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10 w-full max-w-xl mx-4">
        <Card
          className="backdrop-blur-sm"
          style={{ borderRadius: 16 }}
          bodyStyle={{ padding: 24 }}
        >
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">Create your account</h2>
            <p className="text-gray-500">It only takes a minute.</p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
          >
            <Row gutter={16}>
              {/* Username */}
              <Col span={24}>
                <Form.Item
                  label="Username"
                  name="username"
                  rules={[{ required: true, message: "Username is required" }]}
                >
                  <Input placeholder="Username" allowClear />
                </Form.Item>
              </Col>

              {/* Full Name */}
              <Col span={24}>
                <Form.Item
                  label="Full name"
                  name="fullName"
                  rules={[
                    { required: true, message: "Full name is required" },
                    {
                      validator: (_, v) =>
                        v && v.trim()
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error("Full name cannot be empty")
                            ),
                    },
                  ]}
                >
                  <Input placeholder="Full name" allowClear />
                </Form.Item>
              </Col>

              {/* Phone */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="Phone"
                  name="phone"
                  rules={[
                    { required: true, message: "Phone is required" },
                    {
                      validator: (_, v) =>
                        !v || validatePhone(v)
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error(
                                "Phone must start with 0 and be 10–11 digits"
                              )
                            ),
                    },
                  ]}
                >
                  <Input placeholder="Phone (e.g. 09xxxxxxxx)" maxLength={11} />
                </Form.Item>
              </Col>

              {/* Email */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Email is required" },
                    {
                      validator: (_, v) =>
                        !v || validateEmail(v)
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error("Please enter a valid email")
                            ),
                    },
                  ]}
                >
                  <Input placeholder="Email" type="email" />
                </Form.Item>
              </Col>

              {/* Password */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    { required: true, message: "Password is required" },
                    {
                      min: 8,
                      message: "Password must be at least 8 characters",
                    },
                  ]}
                  hasFeedback
                >
                  <Input.Password placeholder="Password" />
                </Form.Item>
              </Col>

              {/* Confirm Password */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="Confirm password"
                  name="confirmPassword"
                  dependencies={["password"]}
                  hasFeedback
                  rules={[
                    { required: true, message: "Please confirm your password" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Passwords do not match")
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Confirm password" />
                </Form.Item>
              </Col>

              {/* Role */}
              <Col xs={24} md={12}>
                <Form.Item
                  label="Role"
                  name="role"
                  rules={[{ required: true, message: "Role is required" }]}
                >
                  <Select placeholder="Select role" onChange={handleRoleChange}>
                    <Option value="staff">DEALER STAFF</Option>
                    <Option value="dealer_manager">DEALER MANAGER</Option>
                    <Option value="evm_staff">EVM STAFF</Option>
                    <Option value="admin">ADMIN</Option>
                  </Select>
                </Form.Item>
              </Col>

              {/* Dealer ID - CHỈ HIỆN KHI CHỌN DEALER ROLE */}
              {isDealerFieldRequired && (
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Dealer ID"
                    name="dealerId"
                    rules={[
                      // Giữ nguyên logic kiểm tra tính bắt buộc
                      {
                        required: isDealerFieldRequired,
                        message: "Vui lòng nhập Dealer ID.", // Đã Việt hóa thông báo
                      },
                      // Thêm kiểm tra Dealer ID phải là số nguyên dương
                      {
                        type: "number",
                        min: 1,
                        message: "Dealer ID phải là số nguyên dương lớn hơn 0.",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="Nhập ID đại lý (Ví dụ: 1,2,3...)"
                      min={1}
                      // Thêm `precision={0}` để đảm bảo chỉ nhập số nguyên
                      precision={0}
                    />
                  </Form.Item>
                </Col>
              )}
            </Row>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </Form.Item>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="text-blue-600 hover:text-blue-500">
                Sign in
              </a>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
