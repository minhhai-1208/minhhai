import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Popconfirm,
  DatePicker,
  Card,
  Drawer,
  Row,
  Col,
  Tag,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux"; // 🆕 1. Import useSelector
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  GiftOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  TagsOutlined,
  EyeOutlined, // 🆕 Import icon View
} from "@ant-design/icons";
import {
  fetchPromotions,
  postPromotion,
  putPromotion,
  removePromotion,
} from "../../../services/promotion.api";
import { fetchDealers } from "../../../services/dealer.api";

const DATE_FORMAT = "YYYY-MM-DD";

const Promotion = () => {
  const [promotions, setPromotions] = useState([]);
  const [filteredPromotions, setFilteredPromotions] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedDealerId, setSelectedDealerId] = useState(null);

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

  // --- LOAD DATA ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first!");
      navigate("/login");
      return;
    }

    const loadAllData = async () => {
      await Promise.all([loadPromotions(), loadDealers()]);
    };
    loadAllData();
  }, [navigate]);

  const loadPromotions = async () => {
    try {
      const res = await fetchPromotions();
      const data = Array.isArray(res.data) ? res.data : [];
      setPromotions(data);
      setFilteredPromotions(data);
    } catch (err) {
      console.error("Error fetching promotions:", err);
      toast.error("Error fetching promotions!");
    }
  };

  const loadDealers = async () => {
    try {
      const res = await fetchDealers();
      setDealers(res.data || []);
    } catch (err) {
      console.error("Error fetching dealers:", err);
    }
  };

  // --- SUPPORT FUNCTIONS ---
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  const formatDateValue = (value) =>
    dayjs.isDayjs(value)
      ? value.format(DATE_FORMAT)
      : typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}$/)
      ? value
      : null;

  const getDealerLabel = (dealerId) => {
    const dealer = dealers.find((d) => d.id === dealerId);
    return dealer ? dealer.dealerName : `Dealer #${dealerId}`;
  };

  // --- FILTER BY DEALER ---
  const handleFilterByDealer = (dealerId) => {
    setSelectedDealerId(dealerId);
    if (!dealerId) {
      setFilteredPromotions(promotions);
    } else {
      setFilteredPromotions(promotions.filter((p) => p.dealerId === dealerId));
    }
  };

  // --- HANDLE SUBMIT ---
  const handleSubmit = async (values) => {
    const startDateStr = formatDateValue(values.startDate);
    const endDateStr = formatDateValue(values.endDate);
    const id = values.id;

    const payload = {
      ...values,
      dealerId: Number(values.dealerId),
      discountValue: values.discountValue,
      minOrderValue: values.minOrderValue || 0,
      maxUsage: values.maxUsage,
      currentUsage: values.currentUsage || 0,
      startDate: startDateStr,
      endDate: endDateStr,
      applicableModels: values.applicableModels || "",
    };

    try {
      if (id) {
        await putPromotion(payload);
        toast.success("Promotion updated successfully!");
      } else {
        await postPromotion(payload);
        toast.success("Promotion added successfully!");
      }
      handleCloseDrawer();
      loadPromotions();
    } catch (err) {
      console.error("Error saving promotion:", err);
      toast.error("Error saving promotion!");
    }
  };

  // --- DELETE / EDIT ---
  const handleDelete = async (id) => {
    try {
      await removePromotion(id);
      toast.success("Promotion deleted!");
      loadPromotions();
    } catch (err) {
      console.error("Error deleting promotion:", err);
      toast.error("Error deleting promotion!");
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
      discountValue: Number(record.discountValue),
      minOrderValue: Number(record.minOrderValue),
      maxUsage: Number(record.maxUsage),
      currentUsage: Number(record.currentUsage),
    });
    setOpen(true);
  };

  const handleCloseDrawer = () => {
    setOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  // --- TABLE COLUMNS ---
  const columns = [
    {
      title: "Promotion Name / Code",
      key: "name_code",
      fixed: "left",
      width: 250,
      render: (_, r) => (
        <div className="flex flex-col text-sm">
          <span className="font-semibold text-blue-600">
            {r.promotionName}
          </span>
          <span className="text-xs text-gray-500 flex items-center">
            <TagsOutlined className="mr-1" /> Code: {r.promotionCode}
          </span>
        </div>
      ),
    },
    {
      title: "Value / Min Order",
      key: "value_min",
      width: 200,
      render: (_, r) => (
        <div className="flex flex-col text-sm">
          <Tag
            color={r.discountType === "percentage" ? "orange" : "green"}
            className="font-semibold cursor-help"
          >
            {r.discountType === "percentage"
              ? `${r.discountValue}% OFF`
              : formatCurrency(r.discountValue)}
          </Tag>
          <span className="text-xs text-gray-600 mt-1">
            Min: {formatCurrency(r.minOrderValue)}
          </span>
        </div>
      ),
    },
    {
      title: "Usage (Used / Max)",
      key: "usage",
      width: 150,
      render: (_, r) => (
        <div className="flex flex-col text-sm">
          <span className="font-semibold text-gray-800">
            {r.currentUsage} / {r.maxUsage}
          </span>
          <span className="text-xs text-gray-500">
            Remaining: {r.maxUsage - r.currentUsage}
          </span>
        </div>
      ),
    },
    {
      title: "Dealer",
      dataIndex: "dealerId",
      key: "dealerId",
      width: 160,
      render: (dealerId) => (
        <Tooltip title={getDealerLabel(dealerId)}>
          <Tag color="blue" className="cursor-help">
            {getDealerLabel(dealerId)}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: "Period",
      key: "period",
      width: 200,
      render: (_, r) => (
        <div className="flex flex-col text-xs">
          <span className="text-gray-800 flex items-center gap-1">
            <ClockCircleOutlined className="text-green-500" />
            {r.startDate}
          </span>
          <span className="text-red-500 flex items-center gap-1 mt-1">
            <FieldTimeOutlined /> {r.endDate}
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        let color = "green";
        if (status === "inactive") color = "volcano";
        if (status === "expired") color = "red";
        return (
          <Tag color={color} className="font-medium">
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 90,
      render: (_, r) => (
        <div className="flex justify-center gap-1">
          {/* 🆕 3. Phân quyền Action */}
          {canEdit ? (
            <>
              <Tooltip title="Edit">
                <Button
                  type="text"
                  icon={<EditOutlined className="text-blue-500" />}
                  onClick={() => handleEdit(r)}
                />
              </Tooltip>
              <Popconfirm
                title="Delete this promotion?"
                onConfirm={() => handleDelete(r.id)}
              >
                <Tooltip title="Delete">
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            </>
          ) : (
            // Nếu không có quyền -> Chỉ hiện View
            <Tooltip title="View Details">
              <Button
                type="text"
                icon={<EyeOutlined className="text-gray-500 hover:text-blue-500" />}
                onClick={() => handleEdit(r)}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  // --- RENDER ---
  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <GiftOutlined className="mr-3 text-red-600" />
          Promotion Management
        </h1>
        <div className="flex gap-3 items-center">
          <Select
            allowClear
            showSearch
            placeholder="Filter by Dealer"
            style={{ width: 250 }}
            options={dealers.map((d) => ({
              value: d.id,
              label: d.dealerName,
            }))}
            value={selectedDealerId}
            onChange={handleFilterByDealer}
          />
          
          {/* 🆕 4. Ẩn nút Add nếu không có quyền */}
          {canEdit && (
            <Button
              type="primary"
              className="bg-blue-600"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                setEditingRecord(null);
                setOpen(true);
                form.setFieldsValue({
                  status: "active",
                  currentUsage: 0,
                  minOrderValue: 0,
                });
              }}
            >
              Add Promotion
            </Button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <Card className="shadow-xl rounded-xl">
        <Table
          dataSource={filteredPromotions}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* DRAWER FORM */}
      <Drawer
        title={
          <span className="text-xl font-bold">
            {/* Đổi title dựa trên quyền */}
            {!canEdit ? "View Promotion Details" : (editingRecord ? "Edit Promotion" : "Create Promotion")}
          </span>
        }
        open={open}
        onClose={handleCloseDrawer}
        width={720}
        destroyOnClose
        maskClosable={false}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseDrawer}>
                {canEdit ? "Cancel" : "Close"}
            </Button>
            
            {/* 🆕 5. Ẩn nút Save nếu không có quyền */}
            {canEdit && (
              <Button type="primary" onClick={form.submit}>
                {editingRecord ? "Save Changes" : "Create"}
              </Button>
            )}
          </div>
        }
      >
        <Form 
            layout="vertical" 
            form={form} 
            onFinish={handleSubmit}
            disabled={!canEdit} // 🆕 6. Disable form nếu View Only
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Promotion Name"
                name="promotionName"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Promotion Code"
                name="promotionCode"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Discount Type"
                name="discountType"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: "fixed_amount", label: "Fixed Amount" },
                    { value: "percentage", label: "Percentage" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Discount Value"
                name="discountValue"
                rules={[{ required: true }]}
              >
                <InputNumber {...positiveNumberProps} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Min Order Value"
                name="minOrderValue"
                rules={[{ required: true }]}
              >
                <InputNumber {...positiveNumberProps} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Max Usage"
                name="maxUsage"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} {...positiveNumberProps} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Current Usage"
                name="currentUsage"
                rules={[{ required: true }]}
              >
                <InputNumber {...positiveNumberProps} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Start Date"
                name="startDate"
                rules={[{ required: true }]}
              >
                <DatePicker format={DATE_FORMAT} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="End Date"
                name="endDate"
                rules={[{ required: true }]}
              >
                <DatePicker format={DATE_FORMAT} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Applicable Models"
            name="applicableModels"
          >
            <Input placeholder="M001,M002..." />
          </Form.Item>
          <Form.Item
            label="Target Dealer"
            name="dealerId"
            rules={[{ required: true }]}
          >
            <Select
              options={dealers.map((d) => ({
                value: d.id,
                label: d.dealerName,
              }))}
              placeholder="Select Dealer"
            />
          </Form.Item>
          <Form.Item label="Status" name="status" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "expired", label: "Expired" },
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default Promotion;