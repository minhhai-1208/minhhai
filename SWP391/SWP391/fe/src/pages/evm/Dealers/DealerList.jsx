import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Button,
  Form,
  Input,
  Select,
  Tag,
  Popconfirm,
  InputNumber,
  Drawer,
  Row,
  Col,
  Tooltip,
  DatePicker,
} from "antd";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useSelector } from "react-redux"; // 🆕 1. Import useSelector
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ShopOutlined,
  DollarOutlined,
  LineChartOutlined,
  PhoneOutlined,
  MailOutlined,
  EyeOutlined, // 🆕 Import icon View
} from "@ant-design/icons";
import {
  fetchDealers,
  postDealer,
  putDealer,
  removeDealer,
} from "../../../services/dealer.api";

// --- Hàm hỗ trợ định dạng tiền tệ ---
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return "";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

// --- Hàm parse tiền tệ từ InputNumber ---
const parserCurrency = (value) => value.replace(/[₫,. \s]/g, "");

const DealerList = () => {
  const [dealers, setDealers] = useState([]);
  const [filteredDealers, setFilteredDealers] = useState([]);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // ✅ Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 8,
  });

  // 🆕 2. Lấy Role từ Redux
  const { role } = useSelector((state) => state.account);
  // Chỉ Admin mới được Thêm/Sửa/Xóa
  const canEdit = ["admin"].includes(role?.toLowerCase());

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
  // 📦 Fetch danh sách dealers
  const loadDealers = async () => {
    setLoading(true);
    try {
      const res = await fetchDealers();
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setDealers(data);
      setFilteredDealers(data);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching dealer list!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDealers();
  }, []);

  // 🔍 Filter theo dealerId (local)
  const handleFilterChange = (value) => {
    setSelectedDealer(value);
    if (!value) {
      setFilteredDealers(dealers);
    } else {
      setFilteredDealers(dealers.filter((d) => d.id === value));
    }
  };

  // 🧾 Submit form (Add / Update)
  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        contractDate: values.contractDate
          ? dayjs(values.contractDate).format("YYYY-MM-DD")
          : null,
        salesTarget: Number(values.salesTarget || 0),
        debtLimit: Number(values.debtLimit || 0),
        currentDebt: Number(values.currentDebt || editing?.currentDebt || 0),
      };

      if (editing) {
        payload.id = editing.id;
        await putDealer(payload);
        toast.success("Dealer updated successfully!");
      } else {
        await postDealer(payload);
        toast.success("Dealer added successfully!");
      }

      handleCloseDrawer();
      loadDealers();
    } catch (err) {
      console.error("POST/PUT Dealer ERROR:", err.response?.data || err);
      toast.error("Error saving dealer! Check required fields and API log.");
    }
  };

  // 🗑 Delete dealer
  const handleDelete = async (id) => {
    try {
      await removeDealer(id);
      toast.success("Dealer deleted!");
      const currentPage = pagination.current;
      await loadDealers();
      setPagination((prev) => ({ ...prev, current: currentPage }));
    } catch (err) {
      console.error("DELETE Dealer ERROR:", err.response?.data || err);
      toast.error("Error deleting dealer!");
    }
  };

  // ✅ Close Drawer
  const handleCloseDrawer = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const handleEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      contractDate: record.contractDate ? dayjs(record.contractDate) : null,
    });
    setOpen(true);
  };

  // 🧱 Columns
  const columns = [
    {
      title: "Dealer / Code",
      dataIndex: "dealerName",
      key: "dealerName",
      fixed: "left",
      width: 200,
      render: (name, record) => (
        <div className="flex flex-col text-sm">
          <span className="font-semibold text-blue-600 flex items-center">
            <ShopOutlined className="mr-1" />
            {name}
          </span>
          <span className="text-xs text-gray-500">
            Code: {record.dealerCode}
          </span>
        </div>
      ),
    },
    {
      title: "Location / Contact",
      key: "location_contact",
      width: 250,
      render: (_, record) => (
        <div className="flex flex-col text-sm">
          <Tooltip title={`Address: ${record.address}`}>
            <span className="font-medium text-gray-800 cursor-help">
              {record.city} ({record.region})
            </span>
          </Tooltip>
          <span className="text-xs text-gray-600 flex items-center mt-1">
            <PhoneOutlined className="mr-1" />
            {record.phone}
          </span>
          <span className="text-xs text-gray-600 flex items-center">
            <MailOutlined className="mr-1" />
            {record.email}
          </span>
        </div>
      ),
    },
    {
      title: "Targets & Debt",
      key: "finance",
      width: 250,
      render: (_, record) => (
        <div className="flex flex-col text-sm">
          <Tooltip title="Sales Target">
            <span className="font-medium text-green-600 flex items-center cursor-help">
              <LineChartOutlined className="mr-1" />
              Target: {formatCurrency(record.salesTarget)}
            </span>
          </Tooltip>
          <Tooltip title="Current Debt / Debt Limit">
            <span className="text-red-600 font-semibold flex items-center mt-1 cursor-help">
              <DollarOutlined className="mr-1" />
              Debt: {formatCurrency(record.currentDebt)} /{" "}
              {formatCurrency(record.debtLimit)}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) =>
        status === "active" ? (
          <Tag color="green" className="font-medium">
            ACTIVE
          </Tag>
        ) : (
          <Tag color="volcano" className="font-medium">
            INACTIVE
          </Tag>
        ),
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 80,
      render: (_, record) => (
        <div className="flex gap-1 justify-center">
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
                title="Are you sure delete this dealer?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Tooltip title="Delete">
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined className="hover:text-red-700" />}
                  />
                </Tooltip>
              </Popconfirm>
            </>
          ) : (
            // Nếu không có quyền -> Chỉ hiện View
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
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <ShopOutlined className="mr-3 text-blue-600" />
          Dealer Management
        </h1>
        
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
              form.setFieldsValue({ status: "active" });
            }}
          >
            Add New Dealer
          </Button>
        )}
      </div>

      {/* FILTER SECTION */}
      <div className="mb-4">
        <Select
          allowClear
          showSearch
          placeholder="Filter by Dealer ID"
          optionFilterProp="label"
          style={{ width: 300 }}
          value={selectedDealer}
          onChange={handleFilterChange}
          options={dealers.map((d) => ({
            label: `${d.dealerName} (ID: ${d.id})`,
            value: d.id,
          }))}
        />
      </div>

      <Card className="shadow-xl rounded-xl" loading={loading}>
        <Table
          columns={columns}
          dataSource={filteredDealers}
          rowKey="id"
          pagination={{
            ...pagination,
            onChange: (page, pageSize) =>
              setPagination({ current: page, pageSize }),
          }}
        />
      </Card>

      {/* Drawer */}
      <Drawer
        title={
          <span className="text-xl font-bold text-gray-800">
            {/* Đổi title dựa trên quyền */}
            {!canEdit
              ? "View Dealer: "
              : editing
              ? "Edit Dealer: "
              : "Add New Dealer"}
            <span className="text-blue-600 ml-2">
              {editing?.dealerName || ""}
            </span>
          </span>
        }
        open={open}
        onClose={handleCloseDrawer}
        width={720}
        destroyOnClose
        maskClosable={false}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseDrawer} size="large">
              {canEdit ? "Cancel" : "Close"}
            </Button>

            {/* 🆕 5. Ẩn nút Save nếu không có quyền */}
            {canEdit && (
              <Button
                onClick={form.submit}
                type="primary"
                size="large"
                className="bg-blue-600 font-semibold"
              >
                {editing ? "Save Changes" : "Create Dealer"}
              </Button>
            )}
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: "active" }}
          className="p-4 bg-white rounded-lg"
          disabled={!canEdit} // 🆕 6. Disable form nếu View Only
        >
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
            Basic Information
          </h3>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Dealer Code"
                name="dealerCode"
                rules={[
                  { required: true, message: "Please enter dealer code" },
                ]}
              >
                <Input placeholder="e.g. DL001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Dealer Name"
                name="dealerName"
                rules={[
                  { required: true, message: "Please enter dealer name" },
                ]}
              >
                <Input placeholder="e.g. EV City Motors" />
              </Form.Item>
            </Col>
          </Row>

          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mt-6 mb-4">
            Location & Contact
          </h3>
          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: "Please enter address" }]}
          >
            <Input.TextArea rows={2} placeholder="Enter full address" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="City" name="city">
                <Input placeholder="Enter city" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Region" name="region">
                <Input placeholder="Enter region" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Contact Person" name="contactPerson">
                <Input placeholder="Enter contact person" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Phone"
                name="phone"
                rules={[
                  {
                    pattern: /^[0-9]{9,15}$/,
                    message: "Invalid phone number",
                  },
                ]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Email"
                name="email"
                rules={[{ type: "email", message: "Invalid email address" }]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col>
          </Row>

          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mt-6 mb-4">
            Contract & Finance
          </h3>

          {/* ✅ Dùng DatePicker thay cho Input */}
          <Form.Item
            label="Contract Date"
            name="contractDate"
            rules={[{ required: true, message: "Please select contract date" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="YYYY-MM-DD"
              placeholder="Select contract date"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Sales Target"
                name="salesTarget"
                rules={[
                  { required: true, message: "Please enter sales target" },
                ]}
              >
                <InputNumber
                  {...positiveNumberProps}
                  formatter={formatCurrency}
                  parser={parserCurrency}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Debt Limit"
                name="debtLimit"
                rules={[{ required: true, message: "Please enter debt limit" }]}
              >
                <InputNumber
                  {...positiveNumberProps}
                  formatter={formatCurrency}
                  parser={parserCurrency}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Current Debt"
                name="currentDebt"
                hidden={!editing}
              >
                <InputNumber
                  {...positiveNumberProps}
                  formatter={formatCurrency}
                  parser={parserCurrency}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select
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

export default DealerList;