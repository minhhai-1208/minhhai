import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Table,
  Tag,
  message,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  Spin,
  Typography,
  Card,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  fetchFeedbacks,
  postFeedback,
  putFeedback,
  removeFeedback,
} from "../../../service/feedbacks.api";
import { fetchCustomers } from "../../../service/customers.api";
import { fetchOrders } from "../../../service/order.api";
import { PlusOutlined, ReloadOutlined, EditOutlined, SearchOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

// --- CONFIGURATION OPTIONS (Giữ nguyên) ---
const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const TYPE_OPTIONS = [
    { value: "feedback", label: "Feedback" },
    { value: "complaint", label: "Complaint" },
];

const PRIORITY_OPTIONS = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
];

const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // ✅ Filter States: Bỏ searchText
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  // const [searchText, setSearchText] = useState(""); // ❌ BỎ SEARCH TEXT
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [filterPriority, setFilterPriority] = useState(null);


  const account = useSelector((state) => state.account);
  const currentDealerId = Number(account?.dealerId);

  // --- HÀM LỌC CHÍNH (ÁP DỤNG CÁC BỘ LỌC CHỌN) ---
  const applyFilters = useCallback(() => {
    let currentData = feedbacksWithCustomer;
    // const lowerCaseSearch = searchText?.toLowerCase(); // ❌ BỎ LIVE SEARCH LOGIC

    // 1. Lọc theo Status
    if (filterStatus) {
      currentData = currentData.filter(item => item.status === filterStatus);
    }

    // 2. Lọc theo Type
    if (filterType) {
        currentData = currentData.filter(item => item.feedbackType === filterType);
    }

    // 3. Lọc theo Priority
    if (filterPriority) {
        currentData = currentData.filter(item => item.priority === filterPriority);
    }

    setFilteredFeedbacks(currentData);
  }, [feedbacks, customers, filterStatus, filterType, filterPriority]);


  // --- HÀM TẢI DỮ LIỆU CHUNG (Giữ nguyên) ---
  const loadData = useCallback(async () => {
    if (!currentDealerId) {
      message.warning("Không tìm thấy ID đại lý.");
      return;
    }

    setLoading(true);
    try {
      const [feedbacksRes, customersRes, ordersRes] = await Promise.all([
        fetchFeedbacks(),
        fetchCustomers(),
        fetchOrders(),
      ]);

      const allFeedbacks = feedbacksRes.data || [];
      const filteredFeedbacks = allFeedbacks.filter(
        (f) => Number(f.dealerId) === currentDealerId
      ).map(f => ({
        ...f,
        key: f.id || f.feedbackId,
        feedbackId: f.feedbackId || f.id
      }));
      setFeedbacks(filteredFeedbacks);

      const allCustomers = customersRes.data || [];
      const filteredCustomers = allCustomers.filter(
        (c) => Number(c.dealerId) === currentDealerId
      );
      setCustomers(filteredCustomers);

      const allOrders = ordersRes?.data || (Array.isArray(ordersRes) ? ordersRes : []); 
      const filteredOrders = allOrders.filter(
        (o) => Number(o.dealerId) === currentDealerId
      );
      setOrders(filteredOrders);

    } catch (error) {
      message.error("Lỗi khi tải dữ liệu.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentDealerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // ✅ Kích hoạt lọc khi dữ liệu gốc hoặc bộ lọc thay đổi
  useEffect(() => {
    applyFilters();
  }, [feedbacks, customers, filterStatus, filterType, filterPriority, applyFilters]);


  const filterOrdersByCustomer = (customerId) => {
    if (!customerId) return [];
    return orders.filter((o) => Number(o.customerId) === Number(customerId));
  };

  const handleSave = async (values) => {
    try {
      const dataToSend = { ...values, dealerId: currentDealerId };

      if (editingFeedback) {
        await putFeedback({ ...dataToSend, id: editingFeedback.feedbackId });
        message.success("Cập nhật phản hồi thành công!");
      } else {
        await postFeedback(dataToSend);
        message.success("Thêm phản hồi thành công!");
      }

      handleCancelModal();
      loadData();
    } catch (error) {
      message.error("Lỗi khi lưu phản hồi.");
      console.error(error);
    }
  };

  const handleDelete = async (feedbackId) => {
    try {
      await removeFeedback(feedbackId);
      message.success("Đã xóa phản hồi.");
      loadData();
    } catch (error) {
      message.error("Không thể xóa phản hồi.");
      console.error("Xóa lỗi:", error.response?.data || error);
    }
  };

  const handleEdit = (record) => {
    const feedbackId = record.feedbackId || record.id;
    setEditingFeedback({ ...record, feedbackId });
    
    setSelectedCustomerId(record.customerId); 

    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    setEditingFeedback(null);
    setSelectedCustomerId(null); 
    form.resetFields();
  };

  // --- MAP FEEDBACKS WITH CUSTOMER INFO (Sử dụng useMemo để tối ưu) ---
  const feedbacksWithCustomer = useMemo(() => {
    return feedbacks.map((f) => {
        const customer = customers.find((c) => c.id === f.customerId);
        return {
          ...f,
          customerInfo: customer
            ? `${customer.fullName} | ${customer.phone || "N/A"} | ${customer.email || "N/A"}`
            : "Không tìm thấy khách hàng",
        };
    });
  }, [feedbacks, customers]);


  // --- CUSTOM RENDERERS FOR SIMPLIFIED TAGS ---
  const renderPriorityTag = (priority) => {
    const key = priority?.toLowerCase();
    let color;
    let textColor = 'black';
    let bgColor;

    if (key === 'high') {
      color = 'red'; 
      bgColor = '#fff1f0'; // Light red background
      textColor = '#cf1322'; // Dark red text
    } else if (key === 'medium') {
      color = 'orange'; 
      bgColor = '#fff7e6';
      textColor = '#d46b08';
    } else { // low/default
      color = 'blue';
      bgColor = '#e6f7ff';
      textColor = '#1890ff';
    }

    return (
        <Tag style={{ backgroundColor: bgColor, color: textColor, border: `1px solid ${color}` }}>
            {priority.toUpperCase()}
        </Tag>
    );
  };
  
  const renderStatusTag = (status) => {
    const key = status?.toLowerCase();
    let color;
    
    if (key === 'resolved') {
      color = 'green';
    } else if (key === 'in_progress') {
      color = 'geekblue';
    } else if (key === 'closed') {
      color = 'red';
    } else { // open/default
      color = 'blue';
    }

    return (
        <Tag color={color}>
            {status.toUpperCase().replace("_", " ")}
        </Tag>
    );
  };

  const renderTypeTag = (type) => {
      const key = type?.toLowerCase();
      // Giữ lại màu sắc cơ bản nhưng không quá nổi bật
      return (
          <Tag color={key === "complaint" ? "volcano" : "green"}>
              {type === "complaint" ? "Complaint" : "Feedback"}
          </Tag>
      );
  };


  // --- TABLE COLUMNS (Sử dụng renderers mới) ---
  const columns = [
    {
      title: "No.",
      key: "index",
      width: 70,
      align: "center",
      render: (_, __, index) => {
          const originalIndex = feedbacksWithCustomer.findIndex(f => f.feedbackId === __.feedbackId);
          return originalIndex !== -1 ? originalIndex + 1 : index + 1;
      },
    },
    {
      title: "Customer Info",
      dataIndex: "customerInfo",
      key: "customerInfo",
      width: 320,
      render: (info) => <span>{info}</span>,
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      ellipsis: true,
    },
    {
      title: "Feedback Type",
      dataIndex: "feedbackType",
      key: "feedbackType",
      render: renderTypeTag,
      width: 150,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: renderPriorityTag,
      width: 120,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: renderStatusTag,
      width: 150,
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      align: "center",
      render: (_, record) => (
        <Space size="small" onClick={(e) => e.stopPropagation()}>
          <Button
            icon={<EditOutlined />}
            type="primary"
            ghost
            size="small"
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Bạn có chắc muốn xoá?"
            onConfirm={() => handleDelete(record.feedbackId)}
            okText="Xoá"
            cancelText="Huỷ"
          >
            <Button danger size="small">
              Xoá
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Card
        className="shadow-md"
        style={{ borderRadius: 8 }}
      >
        {/* HEADER VÀ FILTER MỚI */}
        <div className="mb-6 flex justify-between items-center">
            <Title level={5} className="text-blue-700 m-0">
                Feedbacks
            </Title>
            
            <Space size="middle" wrap>
                {/* Lọc theo Priority */}
                <Select
                    placeholder="Priority"
                    allowClear
                    style={{ width: 120 }}
                    onChange={setFilterPriority}
                    value={filterPriority}
                    options={PRIORITY_OPTIONS}
                />

                {/* Lọc theo Type */}
                <Select
                    placeholder="Type"
                    allowClear
                    style={{ width: 120 }}
                    onChange={setFilterType}
                    value={filterType}
                    options={TYPE_OPTIONS}
                />
                
                {/* Lọc theo Status */}
                <Select
                    placeholder="Status"
                    allowClear
                    style={{ width: 150 }}
                    onChange={setFilterStatus}
                    value={filterStatus}
                    options={STATUS_OPTIONS}
                />
                
                <Button icon={<ReloadOutlined />} onClick={loadData}>
                    Refresh
                </Button>
                
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setEditingFeedback(null);
                        setSelectedCustomerId(null);
                        form.resetFields();
                        setIsModalVisible(true);
                    }}
                >
                    Add Feedback
                </Button>
            </Space>
        </div>


        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" tip="Đang tải..." />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredFeedbacks}
            pagination={{ pageSize: 10 }}
            rowClassName="cursor-pointer hover:bg-gray-100"
            onRow={(record) => ({
              onClick: () => navigate(`/dealer/feedbacks/${record.feedbackId}`),
            })}
          />
        )}
      </Card>


      {/* Modal thêm/sửa phản hồi (Giữ nguyên) */}
      <Modal
        title={editingFeedback ? "Cập Nhật Phản Hồi" : "Thêm Phản Hồi"}
        open={isModalVisible}
        onCancel={handleCancelModal}
        okText={editingFeedback ? "Lưu thay đổi" : "Thêm"}
        cancelText="Hủy"
        onOk={() => form.submit()}
        centered
        width={700}
      >
        <Form layout="vertical" form={form} onFinish={handleSave}>
          <Form.Item
            label="Khách hàng"
            name="customerId"
            rules={[{ required: true, message: "Vui lòng chọn khách hàng" }]}
          >
            <Select
              placeholder="Chọn khách hàng trong đại lý"
              onChange={(value) => {
                setSelectedCustomerId(value);
                form.setFieldsValue({ orderId: undefined });
              }}
              showSearch
              optionFilterProp="children"
            >
              {customers.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.fullName
                    ? `${c.fullName} (${c.customerCode || 'N/A'})`
                    : `Customer #${c.id}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Đơn hàng"
            name="orderId"
            rules={[{ required: true, message: "Vui lòng chọn đơn hàng" }]}
          >
            <Select
              placeholder="Chọn đơn hàng"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              disabled={!selectedCustomerId && !editingFeedback?.customerId}
            >
              {filterOrdersByCustomer(selectedCustomerId || editingFeedback?.customerId)
                .map((order) => {
                const vehicle =
                  order.orderDetails?.[0]?.vehicleDetail?.modelName ||
                  "Không rõ xe";
                return (
                  <Option key={order.id} value={order.id}>
                    {`#${order.orderNumber || order.id} - ${
                      order.customerName
                    } - ${vehicle}`}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>

          <Space className="w-full" size="middle" wrap>
             <Form.Item
                label="Loại phản hồi"
                name="feedbackType"
                rules={[{ required: true, message: "Chọn loại phản hồi" }]}
                style={{ minWidth: 150 }}
            >
                <Select>
                <Option value="feedback">Feedback</Option>
                <Option value="complaint">Complaint</Option>
                </Select>
            </Form.Item>

            <Form.Item
                label="Mức độ ưu tiên"
                name="priority"
                initialValue="medium"
                style={{ minWidth: 150 }}
            >
                <Select>
                <Option value="low">Low</Option>
                <Option value="medium">Medium</Option>
                <Option value="high">High</Option>
                </Select>
            </Form.Item>

             <Form.Item label="Trạng thái" name="status" initialValue="open" style={{ minWidth: 150 }}>
                <Select>
                <Option value="open">Open</Option>
                <Option value="in_progress">In Progress</Option>
                <Option value="resolved">Resolved</Option>
                <Option value="closed">Closed</Option>
                </Select>
            </Form.Item>
          </Space>


          <Form.Item
            label="Tiêu đề"
            name="subject"
            rules={[{ required: true, message: "Nhập tiêu đề phản hồi" }]}
          >
            <Input placeholder="Ví dụ: Chậm giao xe" />
          </Form.Item>

          <Form.Item
            label="Nội dung"
            name="description"
            rules={[{ required: true, message: "Nhập nội dung phản hồi" }]}
          >
            <TextArea rows={3} />
          </Form.Item>

        </Form>
      </Modal>
    </div>
  );
};

export default FeedbackList;