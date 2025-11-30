import React, { useState } from "react";
import { Form, Input, Checkbox, Button, Card, Divider, Row, Col } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../../config/axios";
import { useDispatch } from "react-redux";
import { login } from "../../redux/accountSlice";

const LoginPage = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const payload = {
        username: values.username,
        password: values.password,
      };

      const response = await api.post("/login", payload);
      const data = response.data; // data chứa { token, role, ...thông tin account}

      toast.success("Login Successfully !!!");
      console.log(data);

      // 1. Lưu token vào localStorage
      localStorage.setItem("token", data.token);

      // 2. Lưu account vào Redux store
      dispatch(login(data));

      // 3. Điều hướng dựa trên role (vai trò)
      switch (data.role) {
        case "dealer_manager":
        case "dealer_staff":
          navigate("/dealer/overview");
          break;
        case "admin":
        case "evm_staff":
        default: // Mặc định hoặc các role khác
          navigate("/evm/dashboard");
          break;
      }
    } catch (error) {
      console.error(error);
      // Hiển thị thông báo lỗi chi tiết hơn nếu có
      const errorMessage =
        error.response?.data?.message ||
        "Login failed. Please check your credentials and try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/7151710758957.mp4" type="video/mp4" />
      </video>

      {/* Gradient che watermark ở dưới */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent z-0"></div>

      {/* Overlay tối nhẹ toàn màn */}
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 24 }}>
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="text-gray-500">Sign in to your account</p>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{ rememberMe: false }}
            onFinish={onFinish}
            requiredMark={false}
          >
            {/* Username */}
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: "Username is required" }]}
            >
              <Input
                placeholder="Enter your username"
                prefix={<UserOutlined />}
                allowClear
              />
            </Form.Item>

            {/* Password */}
            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Password is required" },
                // Bỏ min: 8 vì có thể backend không yêu cầu, nhưng nếu cần thì để lại
                // { min: 8, message: "Password must be at least 8 characters" },
              ]}
              hasFeedback
            >
              <Input.Password
                placeholder="Enter password"
                prefix={<LockOutlined />}
              />
            </Form.Item>
            <Form.Item style={{ marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-4 text-sm text-gray-600">
            Don’t have an account?{" "}
            <a
              href="/register"
              className="text-blue-600 hover:text-blue-500"
              onClick={(e) => {
                e.preventDefault();
                navigate("/register");
              }}
            >
              Create one
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
