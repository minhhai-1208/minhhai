import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Spin,
  Typography,
  Space, // ✅ Import Space
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  SearchOutlined, // ✅ Import SearchOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  fetchCustomers,
  postCustomer,
  putCustomer,
  removeCustomer,
} from "../../../service/customers.api";
import { fetchOrders } from "../../../service/order.api";

const { Option } = Select;
const { Title } = Typography;
const { Search } = Input; // ✅ Destructuring Search

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [form] = Form.useForm();

  // ✅ Search States
  const [searchText, setSearchText] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  const account = JSON.parse(localStorage.getItem("account"));
  const dealerId = account?.dealerId;

  // --- HÀM LỌC CHÍNH (LIVE SEARCH) ---
  const handleSearch = (value) => {
    setSearchText(value);
    const lowerCaseValue = value.toLowerCase();

    if (!lowerCaseValue) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter((customer) => {
      return (
        customer.fullName?.toLowerCase().includes(lowerCaseValue) ||
        customer.customerCode?.toLowerCase().includes(lowerCaseValue) ||
        customer.phone?.toLowerCase().includes(lowerCaseValue) ||
        customer.email?.toLowerCase().includes(lowerCaseValue)
      );
    });

    setFilteredCustomers(filtered);
  };

  // Hàm tiện ích để loại bỏ các trường chỉ dùng cho Frontend/Backend timestamps
  const cleanPayload = (payload) => {
    const cleaned = { ...payload };
    delete cleaned.key;
    delete cleaned.createdAt;
    delete cleaned.updatedAt;
    // Bỏ qua ID khi POST, nhưng giữ lại khi PUT
    if (!editingCustomer) {
      delete cleaned.id;
    }
    return cleaned;
  };

  // 🧾 Load customers + orders
  const loadCustomersAndOrders = async () => {
    try {
      setLoading(true);
      const [cusRes, orderRes] = await Promise.all([
        fetchCustomers(),
        fetchOrders(),
      ]);

      const filteredCustomersData = cusRes.data.filter(
        (c) => c.dealerId === dealerId
      );

      setCustomers(filteredCustomersData);
      setFilteredCustomers(filteredCustomersData); // ✅ Khởi tạo dữ liệu lọc
      setOrders(orderRes || []);
    } catch (err) {
      message.error("Failed to load customers or orders!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dealerId) loadCustomersAndOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealerId]);

  // --- Re-filter sau khi load thành công (ví dụ: sau khi edit) ---
  useEffect(() => {
    handleSearch(searchText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers]);

  // 🟢 Add / Edit customer
  const handleSubmit = async (values) => {
    // 1. Chuẩn hóa Ngày sinh và Dealer ID
    const basePayload = {
      ...values,
      dealerId,
      dateOfBirth: values.dateOfBirth
        ? dayjs(values.dateOfBirth).format("YYYY-MM-DD")
        : null,
    };

    // 2. Làm sạch payload (loại bỏ key, createdAt, updatedAt...)
    const finalPayload = cleanPayload(basePayload);

    try {
      if (editingCustomer) {
        // ✅ PUT: Truyền ID rõ ràng và Payload đã được làm sạch
        await putCustomer({ ...finalPayload, id: editingCustomer.id });
        message.success("Customer updated successfully!");
      } else {
        // POST
        await postCustomer(finalPayload);
        message.success("Customer added successfully!");
      }
      setOpenModal(false);
      setEditingCustomer(null);
      form.resetFields();
      loadCustomersAndOrders(); // Tải lại dữ liệu sau khi submit
    } catch (err) {
      message.error(
        `Failed to save customer! Error: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  // 🔴 Delete customer
  const handleDelete = async (id) => {
    try {
      await removeCustomer(id);
      message.success("Customer deleted successfully!");
      loadCustomersAndOrders();
    } catch (err) {
      message.error("Failed to delete customer!");
    }
  };

  // 📝 Edit customer
  const handleEdit = (record) => {
    setEditingCustomer(record);
    setOpenModal(true);
    form.setFieldsValue({
      ...record,
      dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth) : null,
    });
  };

  // 📜 View order history
  const handleViewHistory = (record) => {
    setSelectedCustomer(record);
  };

  // 📦 Filter orders by customerId
  const filteredOrders = selectedCustomer
    ? orders.filter((o) => o.customerId === selectedCustomer.id)
    : [];

  // 🧱 Customer columns
  const customerColumns = [
    {
      title: "NO.",
      dataIndex: "id",
      key: "no",
      width: 80,
      align: "center",
      // Render serial number (1, 2, 3...)
      render: (text, record, index) => {
        return index + 1;
      },
    },
    { title: "Full Name", dataIndex: "fullName" },
    //{ title: "Customer Code", dataIndex: "customerCode" },
    { title: "ID number", dataIndex: "idNumber" },
    // { title: "ID Number", dataIndex: "idNumber" },
    { title: "Phone", dataIndex: "phone" },
    { title: "Email", dataIndex: "email" },
    {
      // ✅ Cột Location gộp Address và City
      title: "Location",
      key: "location",
      render: (_, record) => (
        <div style={{ whiteSpace: "pre-wrap" }}>
          {record.address}
          {record.address && record.city ? ", " : ""}
          {record.city}
        </div>
      ),
    },
    { title: "Occupation", dataIndex: "occupation" },
    { title: "Income Level", dataIndex: "incomeLevel" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            alignItems: "stretch",
          }}
        >
          <Button
            icon={<EditOutlined />}
            size="middle"
            onClick={() => handleEdit(record)}
            style={{ width: "100%" }}
          >
            Edit
          </Button>

          <Popconfirm
            title="Are you sure to delete this customer?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="middle"
              style={{ width: "100%" }}
            >
              Delete
            </Button>
          </Popconfirm>

          <Button
            type="primary"
            icon={<HistoryOutlined />}
            size="middle"
            onClick={() => handleViewHistory(record)}
            style={{ width: "100%" }}
          >
            View Orders
          </Button>
        </div>
      ),
    },
  ];

  // 🧾 Order columns
  const orderColumns = [
    { title: "Order Code", dataIndex: "orderNumber", key: "orderNumber" },
    {
      title: "Quotation Date",
      dataIndex: "quotationDate",
      key: "quotationDate",
    },
    { title: "Total Amount", dataIndex: "totalAmount", key: "totalAmount" },
    { title: "Status", dataIndex: "status", key: "status" },
  ];

  if (loading)
    return <Spin size="large" className="flex justify-center mt-10" />;

  return (
    <Card
      title={
        selectedCustomer
          ? `🧾 Orders of ${selectedCustomer.fullName}`
          : "Customer Management"
      }
      extra={
        !selectedCustomer && (
          <Space>
            {/* ✅ Search Input */}
            <Search
              placeholder="Search by name, code or phone"
              allowClear
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 300 }}
            />

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setOpenModal(true);
                setEditingCustomer(null); // Đảm bảo reset trạng thái edit khi thêm mới
                form.resetFields();
              }}
            >
              Add Customer
            </Button>
          </Space>
        )
      }
    >
      {!selectedCustomer ? (
        <Table
          columns={customerColumns}
          dataSource={filteredCustomers.map((c) => ({ ...c, key: c.id }))} // ✅ Sử dụng dữ liệu đã lọc
          pagination={{ pageSize: 8 }}
          bordered
        />
      ) : (
        <>
          {filteredOrders.length > 0 ? (
            <Table
              columns={orderColumns}
              dataSource={filteredOrders.map((o) => ({ ...o, key: o.id }))}
              pagination={{ pageSize: 5 }}
              bordered
            />
          ) : (
            <p>This customer has no orders yet.</p>
          )}
          <Button
            icon={<ArrowLeftOutlined />}
            className="mt-3"
            onClick={() => setSelectedCustomer(null)}
          >
            Back to Customer List
          </Button>
        </>
      )}

      {/* 🧩 Modal Add/Edit Customer */}
      <Modal
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
        open={openModal}
        onCancel={() => {
          setOpenModal(false);
          setEditingCustomer(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Customer Code"
            name="customerCode"
            rules={[{ required: true, message: "Please enter customer code!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[{ required: true, message: "Please enter full name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="ID Number"
            name="idNumber"
            rules={[{ required: true, message: "Please enter ID Number!" }]} // ✅ Cài đặt là bắt buộc
          >
            <Input />
          </Form.Item>

          <Form.Item label="Phone" name="phone">
            <Input />
          </Form.Item>

          <Form.Item label="Email" name="email">
            <Input type="email" />
          </Form.Item>

          <Form.Item label="Address" name="address">
            <Input />
          </Form.Item>

          <Form.Item label="City" name="city">
            <Input />
          </Form.Item>

          <Form.Item label="Date of Birth" name="dateOfBirth">
            <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Occupation" name="occupation">
            <Input />
          </Form.Item>

          <Form.Item label="Income Level" name="incomeLevel">
            <Select placeholder="Select income level">
              <Option value="Low">Low</Option>
              <Option value="Medium">Medium</Option>
              <Option value="High">High</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default Customers;
