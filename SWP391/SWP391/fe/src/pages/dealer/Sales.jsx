import React from "react";
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Switch,
  Row,
  Col,
  theme,
  Tag,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  CarOutlined,
  BarcodeOutlined,
  DollarOutlined,
  CalendarOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import ManageTemplate from "../../components/ManageTemplate";
import dayjs from "dayjs";

const Sales = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 🔗 Mock API
  const apiURL = "https://68d14842e6c0cbeb39a43ba4.mockapi.io/sales";

  // 🧱 Cấu hình các cột hiển thị (bảng/table)
  const columns = [
  {
    title: "Customer",
    dataIndex: "customerName",
    key: "customerName",
    render: (text) => <span className="font-medium text-gray-800">{text}</span>,
  },
  {
    title: "Vehicle",
    dataIndex: "vehicleName",
    key: "vehicleName",
    render: (text) => <span className="text-gray-700">{text}</span>,
  },
  {
    title: "Quantity",
    dataIndex: "quantity",
    key: "quantity",
    align: "center",
    render: (num) => <span className="font-semibold text-blue-600">{num}</span>,
  },
  {
    title: "Price",
    dataIndex: "price",
    key: "price",
    align: "right",
    render: (price) => (
      <span className="text-green-600 font-medium">
        ${price.toLocaleString()}
      </span>
    ),
  },
  {
    title: "Total",
    dataIndex: "total",
    key: "total",
    align: "right",
    render: (total) => (
      <span className="font-semibold text-emerald-700">
        ${Number(total).toLocaleString()}
      </span>
    ),
  },
  {
    title: "Sale Date",
    dataIndex: "saleDate",
    key: "saleDate",
    align: "center",
    render: (dateStr) => (
      <span className="text-gray-700">
        {dateStr ? dayjs(dateStr).format("DD/MM/YYYY") : "-"}
      </span>
    ),
  },
  {
    title: "Salesperson",
    dataIndex: "saleperson",
    key: "saleperson",
    render: (text) => <span className="text-gray-800">{text}</span>,
  },
  {
    title: "Payment",
    dataIndex: "paymentMethod",
    key: "paymentMethod",
    render: (method) => (
      <span
        className={`px-2 py-1 rounded-lg text-sm ${
          method === "cash"
            ? "bg-green-100 text-green-700"
            : method === "credit_card"
            ? "bg-blue-100 text-blue-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {method.replace("_", " ")}
      </span>
    ),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    align: "center",
    render: (status) => (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        {status ? "Completed" : "Pending"}
      </span>
    ),
  },
];


  // 🧾 Các field trong form thêm/sửa
  const formItems = (
    <Row gutter={16}>
      {/* Cột 1 */}
      <Col span={12}>
        <Form.Item
          name="customerName"
          label="Customer Name"
          rules={[{ required: true, message: "Please enter customer name" }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Enter customer name" />
        </Form.Item>

        <Form.Item
          name="vehicleName"
          label="Vehicle Name"
          rules={[{ required: true, message: "Please enter vehicle name" }]}
        >
          <Input prefix={<CarOutlined />} placeholder="Enter vehicle name" />
        </Form.Item>

        <Form.Item name="vehicleId" label="Vehicle ID">
          <Input prefix={<BarcodeOutlined />} placeholder="Enter vehicle ID" />
        </Form.Item>

        <Form.Item name="quantity" label="Quantity">
          <InputNumber
            min={1}
            style={{ width: "100%" }}
            placeholder="Enter quantity"
          />
        </Form.Item>

        <Form.Item name="price" label="Price ($)">
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            prefix={<DollarOutlined />}
            placeholder="Enter price"
          />
        </Form.Item>
      </Col>

      {/* Cột 2 */}
      <Col span={12}>
        <Form.Item name="total" label="Total">
          <Input
            prefix={<DollarOutlined />}
            placeholder="Auto-calculated or enter manually"
          />
        </Form.Item>

        <Form.Item name="saleDate" label="Sale Date">
          <DatePicker
            style={{ width: "100%" }}
            placeholder="Select sale date"
            format="DD/MM/YYYY" // 👈 quan trọng
          />
        </Form.Item>

        <Form.Item name="saleperson" label="Salesperson">
          <Input prefix={<TeamOutlined />} placeholder="Enter salesperson" />
        </Form.Item>

        <Form.Item name="paymentMethod" label="Payment Method">
          <Select
            placeholder="Select payment method"
            options={[
              { value: "cash", label: "💵 Cash" },
              { value: "bank_transfer", label: "🏦 Bank Transfer" },
              { value: "credit_card", label: "💳 Credit Card" },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          valuePropName="checked"
          tooltip="Mark as completed if the sale is finished"
        >
          <Switch
            checkedChildren="✅ Completed"
            unCheckedChildren="⌛ Pending"
          />
        </Form.Item>
      </Col>
    </Row>
  );

  return (
    <div
      style={{
        background: colorBgContainer,
        borderRadius: borderRadiusLG,
        padding: 16,
      }}
    >
      <ManageTemplate
        columns={columns}
        apiURL={apiURL}
        formItems={formItems}
        viewMode="table"
      />
    </div>
  );
};

export default Sales;
