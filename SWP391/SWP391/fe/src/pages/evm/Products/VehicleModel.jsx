import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Tag,
  Form,
  Input,
  Select,
  Popconfirm,
  Card,
  Row,
  Col,
  Drawer,
  InputNumber,
  Tooltip,
} from "antd";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux"; // 🆕 1. Import useSelector
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  CarOutlined,
  DashboardOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  fetchVehicles,
  postVehicle,
  putVehicle,
  removeVehicle,
} from "../../../services/vehicle.api";

const VehicleModel = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchText, setSearchText] = useState("");

  // 🆕 2. Lấy Role từ Redux và kiểm tra quyền
  const { role } = useSelector((state) => state.account);
  
  // Chỉ Admin  mới được phép Thêm/Sửa/Xóa
  const canEdit = ["admin"].includes(role?.toLowerCase());

  // --- Ngăn nhập ký tự âm hoặc e ---
  const positiveNumberProps = {
    min: 0,
    style: { width: "100%" },
    onKeyDown: (e) => {
      if (["-", "e", "E"].includes(e.key)) e.preventDefault();
    },
    onPaste: (e) => {
      if (e.clipboardData.getData("Text").includes("-")) e.preventDefault();
    },
  };

  // --- LOGIC CRUD ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first!");
      navigate("/login");
      return;
    }
    loadProducts();
  }, [navigate]);

  const loadProducts = async () => {
    try {
      const data = await fetchVehicles();
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching products!");
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        batteryCapacity: Number(values.batteryCapacity),
        rangeKm: Number(values.rangeKm),
        chargingTime: Number(values.chargingTime),
        motorPower: Number(values.motorPower),
        seats: Number(values.seats),
      };

      if (editingProduct) {
        await putVehicle(payload);
      } else {
        await postVehicle(payload);
      }
      toast.success("Saved successfully!");
      setOpen(false);
      setEditingProduct(null);
      form.resetFields();
      loadProducts();
    } catch (err) {
      console.error(err);
      toast.error("Error saving product!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await removeVehicle(id);
      toast.success("Product deleted!");
      loadProducts();
    } catch (err) {
      console.error(err);
      toast.error("Error deleting product!");
    }
  };

  const handleEdit = (record) => {
    // Nếu không có quyền sửa thì chỉ mở xem chi tiết (Logic có thể tùy chỉnh thêm)
    setEditingProduct(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  const handleCloseDrawer = () => {
    setOpen(false);
    setEditingProduct(null);
    form.resetFields();
  };

  // --- SEARCH REALTIME ---
  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredProducts(products);
      return;
    }
    const filtered = products.filter(
      (p) =>
        p.modelName.toLowerCase().includes(value.toLowerCase()) ||
        p.modelCode.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  // --- Validator chống số âm ---
  const positiveRule = (fieldName, min = 0) => ({
    validator(_, value) {
      if (value === undefined || value === null || value === "")
        return Promise.resolve();
      return value >= min
        ? Promise.resolve()
        : Promise.reject(`${fieldName} must be at least ${min}`);
    },
  });

  const columns = [
    {
      title: "Model Name",
      dataIndex: "modelName",
      key: "modelName",
      fixed: "left",
      width: 200,
      render: (name, record) => (
        <div className="font-semibold text-base flex flex-col">
          <span className="text-blue-600">{name}</span>
          <Tag color="default" className="mt-1 text-xs text-gray-500">
            {record.modelCode}
          </Tag>
        </div>
      ),
    },
    {
      title: "Category / Seats",
      key: "category_seats",
      width: 150,
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">{record.category}</span>
          <span className="text-sm text-gray-500">{record.seats} seats</span>
        </div>
      ),
    },
    {
      title: "Performance Specs",
      key: "performance",
      width: 200,
      render: (_, record) => (
        <div className="flex flex-col text-sm">
          <Tooltip title="Motor Power">
            <span className="text-gray-800 font-medium flex items-center">
              <ThunderboltOutlined className="mr-1 text-yellow-600" />
              {record.motorPower} kW Power
            </span>
          </Tooltip>
          <Tooltip title="Charging Time">
            <span className="text-gray-500 flex items-center mt-1">
              <DashboardOutlined className="mr-1 text-green-500" />
              {record.chargingTime} h Charge
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Battery / Range",
      key: "battery_range",
      width: 180,
      render: (_, record) => (
        <div className="flex flex-col text-sm">
          <span className="text-gray-800 font-medium flex items-center">
            {record.batteryCapacity} kWh
          </span>
          <span className="text-gray-500 flex items-center mt-1">
            {record.rangeKm} Km Range
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => (
        <Tag
          color={status === "active" ? "green" : "red"}
          className="font-medium"
        >
          {status === "active" ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 100, // Tăng width xíu để đủ chỗ
      render: (_, record) => (
        <div className="flex gap-1 justify-center">
          {/* 🆕 3. Logic hiển thị nút Edit/Delete */}
          {canEdit ? (
            <>
              <Tooltip title="Edit">
                <Button
                  type="text"
                  icon={<EditOutlined className="text-blue-500 hover:text-blue-700" />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
              <Popconfirm
                title="Xóa mẫu xe này?"
                onConfirm={() => handleDelete(record.id)}
              >
                <Tooltip title="Delete">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined className="hover:text-red-700" />}
                  />
                </Tooltip>
              </Popconfirm>
            </>
          ) : (
            // Nếu không có quyền Edit -> Hiện nút View (hoặc chỉ text)
            <Tooltip title="View Details">
                <Button 
                    type="text" 
                    icon={<EyeOutlined />} 
                    onClick={() => handleEdit(record)} // Vẫn mở drawer nhưng chỉ để xem (sẽ xử lý trong Drawer)
                />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <CarOutlined className="mr-3 text-blue-600" />
          Electric Vehicle Model Management
        </h1>

        <div className="flex gap-2">
          <Input
            placeholder="Search by Model Name or Code"
            allowClear
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
          />
          
          {/* 🆕 4. Ẩn nút Add New nếu không có quyền */}
          {canEdit && (
            <Button
                type="primary"
                size="large"
                className="bg-blue-600 hover:bg-blue-700 font-semibold flex items-center gap-1 shadow-md"
                icon={<PlusOutlined />}
                onClick={() => {
                form.resetFields();
                setEditingProduct(null);
                setOpen(true);
                }}
            >
                Add New Model
            </Button>
          )}
        </div>
      </div>

      <Card className="shadow-xl rounded-xl">
        <Table
          dataSource={filteredProducts}
          columns={columns}
          rowKey="id"
          loading={!products}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Drawer */}
      <Drawer
        title={
          <span className="text-xl font-bold text-gray-800">
            {/* Đổi title dựa trên quyền và hành động */}
            {!canEdit ? "View Model Details: " : (editingProduct ? "Edit Model: " : "Create New Model")}
            <span className="text-blue-600 ml-2">
              {editingProduct?.modelName || ""}
            </span>
          </span>
        }
        width={720}
        open={open}
        onClose={handleCloseDrawer}
        maskClosable={false}
        destroyOnClose={true}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseDrawer} size="large">
              {canEdit ? "Cancel" : "Close"}
            </Button>
            
            {/* 🆕 5. Ẩn nút Submit trong Drawer nếu không có quyền */}
            {canEdit && (
                <Button
                onClick={form.submit}
                type="primary"
                size="large"
                className="bg-blue-600 font-semibold"
                >
                {editingProduct ? "Save Changes" : "Create Model"}
                </Button>
            )}
          </div>
        }
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          className="p-4 bg-white rounded-lg"
          disabled={!canEdit} // 🆕 6. Disable toàn bộ Form nếu không có quyền (Chế độ View Only)
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
            Model Basic Information
          </h3>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Model Name"
                name="modelName"
                rules={[{ required: true, message: "Please enter model name" }]}
              >
                <Input placeholder="e.g. EV Explorer" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Model Code"
                name="modelCode"
                rules={[{ required: true, message: "Please enter model code" }]}
              >
                <Input placeholder="e.g. EV-SUV-01" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Category"
                name="category"
                rules={[{ required: true, message: "Please enter category" }]}
              >
                <Input placeholder="e.g. SUV, Sedan" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Seats"
                name="seats"
                rules={[
                  { required: true, message: "Please enter seats" },
                  positiveRule("Seats", 1),
                ]}
              >
                <InputNumber {...positiveNumberProps} placeholder="e.g. 5" />
              </Form.Item>
            </Col>
          </Row>

          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mt-6 mb-4">
            Technical Specifications
          </h3>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Battery Capacity (kWh)"
                name="batteryCapacity"
                rules={[
                  { required: true, message: "Please enter battery capacity" },
                  positiveRule("Battery capacity"),
                ]}
              >
                <InputNumber {...positiveNumberProps} placeholder="e.g. 60" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Range (Km)"
                name="rangeKm"
                rules={[
                  { required: true, message: "Please enter range" },
                  positiveRule("Range"),
                ]}
              >
                <InputNumber {...positiveNumberProps} placeholder="e.g. 450" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Charging Time (h)"
                name="chargingTime"
                rules={[
                  { required: true, message: "Please enter charging time" },
                  positiveRule("Charging time"),
                ]}
              >
                <InputNumber {...positiveNumberProps} step="0.1" placeholder="e.g. 7.5" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Motor Power (kW)"
                name="motorPower"
                rules={[
                  { required: true, message: "Please enter motor power" },
                  positiveRule("Motor power"),
                ]}
              >
                <InputNumber {...positiveNumberProps} placeholder="e.g. 150" />
              </Form.Item>
            </Col>
          </Row>

          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mt-6 mb-4">
            Status
          </h3>
          <Form.Item
            label="Model Status"
            name="status"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select
              placeholder="Select current status"
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default VehicleModel;