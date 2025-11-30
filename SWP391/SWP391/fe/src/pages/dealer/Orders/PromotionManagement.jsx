import React, { useEffect, useState, useCallback } from "react";
import {
  Tag,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Form,
  Table,
  Button,
  Modal,
  Popconfirm,
  Card,
  message,
  Space,
  Spin,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import dayjs from "dayjs";

// --- API Imports ---
import {
  fetchPromotions,
  postPromotion,
  putPromotion,
  removePromotion,
} from "../../../service/promotions.api"; // Ensure the import path is correct

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input; // Destructuring Search component

// --- DISCOUNT TYPE OPTIONS for Filter ---
const DISCOUNT_TYPES = [
  { value: "fixed_amount", label: "Fixed Amount" },
  { value: "percentage", label: "Percentage" },
];

export default function PromotionManagement() {
  const [form] = Form.useForm();
  const [data, setData] = useState([]); // Dữ liệu gốc
  const [filteredData, setFilteredData] = useState([]); // ✅ Dữ liệu đã lọc
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // ✅ Search/Filter States
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState(null); // 'fixed_amount' | 'percentage' | null

  // Get dealerId from Redux
  const account = useSelector((state) => state.account);
  const currentDealerId = Number(account?.dealerId);

  // --- HÀM LỌC CHÍNH (KẾT HỢP TÌM KIẾM VÀ LỌC THEO TYPE) ---
  const handleFilter = useCallback(() => {
    let currentData = data;
    const lowerCaseSearch = searchText?.toLowerCase();

    // 1. Lọc theo Tên Khuyến Mãi (Search Text)
    if (lowerCaseSearch) {
      currentData = currentData.filter((item) =>
        item.promotionName?.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // 2. Lọc theo Loại Giảm Giá (Discount Type)
    if (selectedType) {
      currentData = currentData.filter(
        (item) => item.discountType?.toLowerCase() === selectedType
      );
    }

    setFilteredData(currentData);
  }, [data, searchText, selectedType]);

  // --- DATA LOADING AND FILTERING LOGIC ---
  const fetchData = useCallback(async () => {
    if (!currentDealerId) {
      message.error("Dealer ID not found. Unable to fetch promotions.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetchPromotions();

      // Filter data by currentDealerId
      const filteredData = res.data.filter(
        (item) => Number(item.dealerId) === currentDealerId
      );
      setData(filteredData);
      setFilteredData(filteredData); // ✅ Khởi tạo dữ liệu lọc
    } catch (err) {
      console.error(err);
      message.error("Failed to load promotion list!");
    } finally {
      setLoading(false);
    }
  }, [currentDealerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ Kích hoạt lọc khi data, searchText hoặc selectedType thay đổi
  useEffect(() => {
    handleFilter();
  }, [data, searchText, selectedType, handleFilter]);

  // --- FORM AND MODAL HANDLING LOGIC (Giữ nguyên) ---

  // Handle Add New Modal Open
  const handleAdd = () => {
    setIsEditing(false);
    form.resetFields();
    setIsModalOpen(true);
  };

  // Handle Edit Modal Open
  const handleEdit = (record) => {
    setIsEditing(true);

    // Convert startDate, endDate to dayjs objects for RangePicker
    const processedRecord = {
      ...record,
      // Handle null date (though API should return valid dates/ISO strings for existing records)
      dateRange: [
        record.startDate ? dayjs(record.startDate) : null,
        record.endDate ? dayjs(record.endDate) : null,
      ],
    };

    form.setFieldsValue(processedRecord);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setIsEditing(false);
  };

  // Handle Form Submission (Add/Edit)
  const handleSubmit = async (inputValues) => {
    try {
      setLoading(true);

      // 1. Pre-process data and ensure Date format
      let values = { ...inputValues };

      // Convert dateRange to ISO string
      if (values.dateRange && values.dateRange.length === 2) {
        values.startDate = values.dateRange[0]?.toISOString();
        values.endDate = values.dateRange[1]?.toISOString();
      }
      delete values.dateRange;

      // 2. Default/Missing values standardization

      if (!values.promotionCode) {
        values.promotionCode =
          (values.promotionName?.toUpperCase().replace(/\s/g, "_") || "PROMO") +
          "_" +
          Math.floor(Math.random() * 1000);
      }

      if (!values.status) {
        values.status = "ACTIVE";
      }

      // Ensure number types have defaults if not provided
      if (values.minOrderValue === undefined || values.minOrderValue === null) {
        values.minOrderValue = 0;
      }
      if (values.maxUsage === undefined || values.maxUsage === null) {
        values.maxUsage = 9999;
      }

      // Only set currentUsage to 0 on ADD (if ID doesn't exist)
      if (!values.id) {
        values.currentUsage = 0;
      }

      // Default applicableModels
      if (!values.applicableModels) {
        values.applicableModels = "ALL";
      }

      // 3. Add Dealer ID
      values.dealerId = currentDealerId;

      // 4. Call API
      const isUpdate = !!values.id;
      if (isUpdate) {
        await putPromotion(values);
        message.success("Promotion updated successfully!");
      } else {
        await postPromotion(values);
        message.success("New promotion added successfully!");
      }

      handleCancel();
      await fetchData();
    } catch (err) {
      console.error(err);
      message.error(
        `Save failed! Please check Server Logs. Error: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Deletion
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await removePromotion(id);
      message.success("Promotion deleted successfully!");
      await fetchData(); // Reload data after deletion
    } catch (err) {
      console.error(err);
      message.error(
        `Deletion failed! ${err.response?.data?.message || err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // --- TABLE COLUMN CONFIGURATION (Giữ nguyên) ---
  const columns = [
    {
      title: "NO.",
      dataIndex: "id",
      key: "no",
      width: 80,
      align: "center",
      // Render serial number (1, 2, 3...)
      render: (text, record, index) => {
        // Cần tính lại index từ mảng đã lọc
        const originalIndex = data.findIndex((d) => d.id === record.id);
        return originalIndex !== -1 ? originalIndex + 1 : index + 1;
      },
    },
    {
      title: "Promotion Name",
      dataIndex: "promotionName",
      key: "promotionName",
      sorter: (a, b) => a.promotionName.localeCompare(b.promotionName),
    },
    {
      title: "Discount Value",
      dataIndex: "discountValue",
      key: "discountValue",
      align: "right",
      width: 150,
      render: (value, record) => {
        const formattedValue = value?.toLocaleString();

        // Orange for percentage, Blue for fixed amount
        if (record.discountType === "percentage") {
          return (
            <span
              style={{ fontWeight: 600, color: "#fa8c16" }} // Orange
            >{`${formattedValue} %`}</span>
          );
        }
        return (
          <span
            style={{ fontWeight: 600, color: "#1890ff" }} // Blue
          >{`${formattedValue} VND`}</span>
        );
      },
    },
    {
      title: "Discount Type",
      dataIndex: "discountType",
      key: "discountType",
      align: "center",
      width: 150,
      render: (type) => (
        <Tag color={type === "percentage" ? "geekblue" : "volcano"}>
          {type === "percentage" ? "PERCENTAGE" : "FIXED AMOUNT"}
        </Tag>
      ),
    },
    {
      title: "Timeframe", // ✅ Cột Mới: Gộp Ngày Bắt Đầu và Ngày Kết Thúc
      key: "timeframe",
      width: 200,
      align: "center",
      render: (_, record) => {
        const start = dayjs(record.startDate).format("DD/MM/YYYY");
        const end = dayjs(record.endDate).format("DD/MM/YYYY");

        return `${start} - ${end}`;
      },
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Confirm Deletion?"
            description={`Are you sure you want to delete promotion: ${record.promotionName}?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // --- FORM ITEMS CONFIGURATION (Giữ nguyên) ---
  const promotionFormItems = (
    <>
      <Form.Item name="id" hidden>
        <Input />
      </Form.Item>
      <Form.Item
        label="Promotion Name"
        name="promotionName"
        rules={[{ required: true, message: "Please enter promotion name!" }]}
      >
        <Input placeholder="Example: Black Friday Discount" />
      </Form.Item>

      <Form.Item
        label="Discount Type"
        name="discountType"
        initialValue="fixed_amount"
        rules={[{ required: true, message: "Please select discount type!" }]}
      >
        <Select>
          <Option value="fixed_amount">Fixed Amount (VND)</Option>
          <Option value="percentage">Percentage (%)</Option>
        </Select>
      </Form.Item>

      <Form.Item
        label="Discount Value"
        name="discountValue"
        rules={[{ required: true, message: "Please enter discount value!" }]}
      >
        <InputNumber
          min={0}
          style={{ width: "100%" }}
          placeholder="Enter value"
          // Formatter for display
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          // Parser for actual value
          parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
        />
      </Form.Item>

      <Form.Item
        label="Application Timeframe"
        name="dateRange"
        rules={[
          {
            required: true,
            message: "Please select the application timeframe!",
          },
        ]}
      >
        <RangePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
      </Form.Item>

      <Form.Item label="Detailed Description" name="description">
        <Input.TextArea
          rows={3}
          placeholder="Detailed description of application conditions"
        />
      </Form.Item>

      {/* Optional fields can be hidden or included as needed by your API */}
      <Form.Item name="promotionCode" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="status" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="minOrderValue" hidden>
        <InputNumber />
      </Form.Item>
      <Form.Item name="applicableModels" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="maxUsage" hidden>
        <InputNumber />
      </Form.Item>
      <Form.Item name="currentUsage" hidden>
        <InputNumber />
      </Form.Item>
    </>
  );

  // --- RETURN COMPONENT ---
  return (
    <Card
      title="✨ Promotion Management (Per Dealer)"
      extra={
        <Space>
          {/* ✅ Filter by Discount Type */}
          <Select
            placeholder="Filter by Type"
            allowClear
            style={{ width: 150 }}
            onChange={setSelectedType}
            value={selectedType}
          >
            {DISCOUNT_TYPES.map((type) => (
              <Option key={type.value} value={type.value}>
                {type.label}
              </Option>
            ))}
          </Select>

          {/* ✅ Search by Promotion Name */}
          <Search
            placeholder="Search by Promotion Name"
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />

          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add New Promotion
          </Button>
        </Space>
      }
      className="shadow-md rounded-lg"
    >
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredData} // ✅ Sử dụng dữ liệu đã lọc
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      </Spin>

      <Modal
        title={isEditing ? "Edit Promotion" : "Add New Promotion"}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {promotionFormItems}
        </Form>
      </Modal>
    </Card>
  );
}
