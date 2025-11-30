import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Popconfirm,
  Tag,
  Drawer,
  Tooltip,
  Row,
  Col,
  InputNumber,
  Space,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ShopOutlined,
  CarOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  FieldTimeOutlined,
  TruckOutlined,
  EyeOutlined, // 🆕 Import icon View
} from "@ant-design/icons";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useSelector } from "react-redux"; // 🆕 1. Import useSelector
import api from "../../../config/axios";
import {
  fetchContracts,
  postContract,
  putContract,
  removeContract,
} from "../../../services/contract.api";

// ✅ THÊM IMPORTS CHO CÁC ENTITY KHÁC
import { fetchOrders } from "../../../services/order.api";
import { fetchCustomers } from "../../../services/customers.api";

// --- Hàm hỗ trợ format ---
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "0 VND";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

// Hàm lấy màu cho Tag Status
const getStatusColor = (status) => {
  switch (status) {
    case "completed":
      return "green";
    case "signed":
      return "blue";
    case "draft":
      return "orange";
    case "cancelled":
      return "red";
    default:
      return "default";
  }
};

export default function Contracts() {
  const [allContracts, setAllContracts] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // ✅ STATE CHO FILTER
  const [selectedDealerId, setSelectedDealerId] = useState(null);

  // 🆕 2. Lấy Role từ Redux
  const { role } = useSelector((state) => state.account);
  // Chỉ Admin hoặc Manager mới được Thêm/Sửa/Xóa
  const canEdit = ["admin", "evm_manager"].includes(role?.toLowerCase());

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

  // 🔹 Fetch dữ liệu ban đầu
  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractsRes, dealersRes, ordersRes, customersRes] =
        await Promise.all([
          fetchContracts(),
          api.get("/dealers"),
          fetchOrders(),
          fetchCustomers(),
        ]);

      const contractList = contractsRes.data || contractsRes || [];

      setAllContracts(contractList);
      applyFilters(contractList, selectedDealerId);

      setDealers(dealersRes.data || dealersRes || []);
      setOrders(ordersRes.data || ordersRes || []);
      setCustomers(customersRes.data || customersRes || []);
    } catch (err) {
      console.error(err);
      toast.error("Error loading data!");
    } finally {
      setLoading(false);
    }
  };

  // ✅ HÀM LỌC CHÍNH (Client-Side)
  const applyFilters = (data, dealerId) => {
    let filteredData = data;

    if (dealerId !== null && dealerId !== undefined) {
      filteredData = data.filter((item) => item.dealerId === dealerId);
    }

    setContracts(filteredData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ useEffect theo dõi thay đổi filter
  useEffect(() => {
    applyFilters(allContracts, selectedDealerId);
  }, [selectedDealerId, allContracts]);

  // Helper: Lấy tên Dealer
  const getDealerName = (dealerId) => {
    const dealer = dealers.find((d) => d.id === dealerId);
    return dealer ? dealer.dealerName || dealer.name : `D-ID ${dealerId}`;
  };

  // Helper: Lấy Customer Label
  const getCustomerLabel = (id) => {
    const customer = customers.find((c) => c.id === id);
    const name =
      customer?.fullName ||
      customer?.customerName ||
      customer?.name ||
      "Tên khách hàng không rõ";
    return `${name} (ID: ${id})`;
  };

  // Đóng Drawer
  const handleCloseDrawer = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ customerId: null, vehicleId: null });
  };

  // Khởi tạo Edit
  const handleEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      totalValue:
        record.totalValue !== undefined && record.totalValue !== null
          ? Number(record.totalValue)
          : undefined,
      contractDate: record.contractDate ? dayjs(record.contractDate) : null,
      deliveryDate: record.deliveryDate ? dayjs(record.deliveryDate) : null,
      status: record.status || undefined,
      orderId: record.orderId || undefined,
      customerId: record.customerId || undefined,
    });
    setOpen(true);
  };

  // ✅ Xử lý khi chọn Order ID từ Select
  const handleOrderSelect = (orderId) => {
    const selectedOrder = orders.find((o) => o.id === orderId);

    form.setFieldsValue({
      customerId: null,
      totalValue: null,
    });

    if (selectedOrder) {
      toast.success(`Order #${orderId} data loaded!`);
      form.setFieldsValue({
        customerId: selectedOrder.customerId,
        dealerId: selectedOrder.dealerId || form.getFieldValue("dealerId"),
        totalValue:
          selectedOrder.totalValue || form.getFieldValue("totalValue"),
      });
      form.validateFields(["customerId"]);
    } else {
      toast.warn(`Order data for #${orderId} not found.`);
    }
  };

  // 🧾 Thêm / Cập nhật hợp đồng
  const handleSubmit = async (values) => {
    try {
      const contractDateStr = values.contractDate
        ? values.contractDate.format("YYYY-MM-DD")
        : null;
      const deliveryDateStr = values.deliveryDate
        ? values.deliveryDate.format("YYYY-MM-DD")
        : null;

      const totalAmountValue =
        values.totalValue === null || values.totalValue === undefined
          ? 0
          : Number(values.totalValue);

      if (isNaN(totalAmountValue)) {
        toast.error("Total Amount must be a valid number!");
        return;
      }

      const finalPayload = {
        dealerId: values.dealerId,
        customerId: parseInt(values.customerId),
        orderId: values.orderId ? parseInt(values.orderId) : null,
        totalValue: totalAmountValue,
        contractDate: contractDateStr,
        deliveryDate: deliveryDateStr,
        termsConditions: values.termsConditions || "",
        warrantyInfo: values.warrantyInfo || "",
        insuranceInfo: values.insuranceInfo || "",
        filePath: "",
      };

      if (editing) {
        await putContract({ id: editing.id, ...finalPayload });
        toast.success("Contract updated successfully!");
      } else {
        const postPayload = {
          ...finalPayload,
          contractNumber: values.contractNumber,
          status: values.status,
        };
        await postContract(postPayload);
        toast.success("Contract created successfully!");
      }

      handleCloseDrawer();
      fetchData();
    } catch (err) {
      console.error("Save Error:", err.response?.data || err);
      toast.error(
        `Error saving contract! ${
          err.response?.data?.message ||
          "Lỗi: Hãy đảm bảo các ID (Customer, Order) tồn tại."
        }`
      );
    }
  };

  // 🗑 Xóa hợp đồng
  const handleDelete = async (id) => {
    try {
      await removeContract(id);
      toast.success("Contract deleted!");
      fetchData();
    } catch (err) {
      console.error("Delete Error:", err.response?.data || err);
      toast.error(
        `Error deleting contract! ${err.response?.data?.message || ""}`
      );
    }
  };

  // 📋 Cột hiển thị
  const columns = [
    {
      title: "ID/Number",
      key: "id_number",
      width: 150,
      render: (_, record) => (
        <div className="flex flex-col text-sm">
          <span className="font-bold text-blue-600">#{record.id}</span>
          <Tooltip title="Contract Number">
            <span className="text-gray-800 flex items-center cursor-help">
              <FileTextOutlined className="mr-1 text-xs" />{" "}
              {record.contractNumber || "N/A"}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Dealer",
      key: "dealer",
      width: 200,
      render: (_, record) => (
        <span className="font-medium text-gray-800 flex items-center cursor-help">
          <ShopOutlined className="mr-1 text-purple-600" />
          {getDealerName(record.dealerId)}
        </span>
      ),
    },

    {
      title: "Dates (Contract / Delivery)",
      key: "dates",
      width: 200,
      render: (_, record) => (
        <div className="flex flex-col text-xs">
          <Tooltip title={`Contract Date: ${record.contractDate}`}>
            <span className="text-gray-800 cursor-help flex items-center">
              <CalendarOutlined className="mr-1 text-green-600" />
              Contr: {record.contractDate || "N/A"}
            </span>
          </Tooltip>
          <Tooltip title={`Expected Delivery: ${record.deliveryDate}`}>
            <span className="text-red-500 cursor-help flex items-center mt-1">
              <TruckOutlined className="mr-1" />
              Deliv: {record.deliveryDate || "N/A"}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: "totalValue",
      dataIndex: "totalValue",
      key: "totalValue",
      width: 130,
      render: (amount) => (
        <span className="font-bold text-orange-600">
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)} className="font-medium">
          {status ? status.toUpperCase() : "N/A"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <div className="flex justify-center gap-1">
          {/* 🆕 3. Phân quyền Action */}
          {canEdit ? (
            <>
              <Tooltip title="Edit">
                <Button
                  type="text"
                  icon={
                    <EditOutlined className="text-blue-500 hover:text-blue-700" />
                  }
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
              <Popconfirm
                title="Confirm deletion?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
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
            // Nếu không có quyền -> Chỉ hiện nút View
            <Tooltip title="View Details">
              <Button
                type="text"
                icon={
                  <EyeOutlined className="text-gray-500 hover:text-blue-500" />
                }
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* HEADER ĐỒNG NHẤT */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <FileTextOutlined className="mr-3 text-blue-600 text-3xl" />
          Contract Management
        </h1>
        {/* ✅ FILTER VÀ BUTTON */}
        <Space>
          <Select
            placeholder="Filter by Dealer"
            allowClear
            showSearch
            style={{ width: 250 }}
            optionFilterProp="label"
            onChange={(value) => setSelectedDealerId(value || null)}
            options={dealers.map((d) => ({
              label: d.dealerName || `Dealer ${d.id}`,
              value: d.id,
            }))}
          />
          
          {/* 🆕 4. Ẩn nút Add nếu không có quyền */}
          {canEdit && (
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
              Add New Contract
            </Button>
          )}
        </Space>
      </div>

      <Card className="shadow-xl rounded-xl" loading={loading}>
        <Table
          columns={columns}
          dataSource={contracts}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* DRAWER cho Add / Edit */}
      <Drawer
        title={
          <span className="text-xl font-bold text-gray-800">
            {/* Đổi title dựa trên quyền */}
            {!canEdit
              ? "View Contract Details"
              : editing
              ? `Edit Contract #${editing.id}`
              : "Create New Contract"}
            <span className="text-blue-600 ml-2">
              {editing?.contractNumber || ""}
            </span>
          </span>
        }
        open={open}
        onClose={handleCloseDrawer}
        width={720}
        destroyOnClose={true}
        maskClosable={false}
        footer={
          <div className="flex justify-end gap-3">
            <Button onClick={handleCloseDrawer} size="large">
              {canEdit ? "Cancel" : "Close"}
            </Button>
            
            {/* 🆕 5. Ẩn nút Save nếu không có quyền */}
            {canEdit && (
              <Button
                onClick={form.submit}
                type="primary"
                size="large"
                className="bg-blue-600 hover:bg-blue-700 font-bold shadow-md"
              >
                {editing ? "Update" : "Create"}
              </Button>
            )}
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="p-1"
          disabled={!canEdit} // 🆕 6. Disable form nếu View Only
        >
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
            Core Contract Details
          </h3>

          <Row gutter={16}>
            <Col span={8}>
              {editing ? (
                <Form.Item label="Contract Number">
                  <Input value={editing.contractNumber} disabled />
                </Form.Item>
              ) : (
                <Form.Item
                  label="Contract Number"
                  name="contractNumber"
                  rules={[
                    { required: true, message: "Enter contract number" },
                  ]}
                >
                  <Input
                    placeholder="e.g. CON001"
                    prefix={<FileTextOutlined />}
                  />
                </Form.Item>
              )}
            </Col>
            <Col span={8}>
              <Form.Item
                label="Dealer"
                name="dealerId"
                rules={[{ required: true, message: "Please select dealer" }]}
              >
                <Select
                  placeholder="Select dealer"
                  options={dealers.map((d) => ({
                    label: d.dealerName || d.name,
                    value: d.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: "Select status" }]}
              >
                <Select placeholder="Select status">
                  <Select.Option value="draft">Draft</Select.Option>
                  <Select.Option value="signed">Signed</Select.Option>
                  <Select.Option value="completed">Completed</Select.Option>
                  <Select.Option value="cancelled">Cancelled</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Contract Date"
                name="contractDate"
                rules={[{ required: true, message: "Please select date" }]}
              >
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Delivery Date" name="deliveryDate">
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Total Value"
                name="totalValue"
                rules={[{ required: true, message: "Enter total amount" }]}
              >
                <InputNumber
                  {...positiveNumberProps}
                  placeholder="Total amount (VND)"
                  prefix={<DollarOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mt-4 mb-4">
            Associated Entities
          </h3>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Order ID"
                name="orderId"
                rules={[{ required: true, message: "Order ID is required" }]}
              >
                <Select
                  placeholder="Select associated Order ID"
                  onChange={handleOrderSelect}
                  options={orders.map((o) => ({
                    value: o.id,
                    label: `Order #${o.id}`,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Customer ID"
                name="customerId"
                rules={[{ required: true, message: "Enter customer ID" }]}
              >
                <Select
                  placeholder="Select customer ID"
                  options={customers.map((c) => ({
                    value: c.id,
                    label: getCustomerLabel(c.id),
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}></Row>

          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mt-4 mb-4">
            Additional Information
          </h3>

          <Form.Item label="Terms & Conditions" name="termsConditions">
            <Input.TextArea rows={3} placeholder="Enter terms and conditions" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Warranty Info" name="warrantyInfo">
                <Input
                  placeholder="e.g. Bảo hành 3 năm"
                  prefix={<FieldTimeOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Insurance Info" name="insuranceInfo">
                <Input
                  placeholder="e.g. Bảo hiểm xe 1"
                  prefix={<InfoCircleOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </div>
  );
}