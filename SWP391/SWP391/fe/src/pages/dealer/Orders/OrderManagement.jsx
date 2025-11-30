import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
  Tag,
  Space,
  Popconfirm,
  InputNumber,
  Card,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  DollarCircleOutlined,
  FileTextOutlined, // Icon for Contract
} from "@ant-design/icons";

import OrderDetailView from "./OrderDetailView";

// --- API Imports ---
import {
  fetchOrders,
  getOrderById,
  putOrder,
  removeOrder,
} from "../../../service/order.api";

import { postVNPayDeposit, postVNPayFinal } from "../../../service/payment.api";
// 📌 Import getContractByOrderId để kiểm tra
import { getContractByOrderId } from "../../../service/contracts.api";

const { Option } = Select;
const { Search } = Input;

// --- Status Map
const STATUS_MAP = {
  // 1. Trạng thái khởi tạo/Đang xử lý (Màu Trung tính/Blue) - **TIẾN TRÌNH**
  // Màu Xanh Dương/Blue - Thể hiện quá trình, đang bắt đầu hoặc cần chú ý ban đầu
  draft_quotation: { color: "blue", text: "DRAFT QUOTATION" }, // Xanh Lam (Blue)
  ready_for_contract: { color: "geekblue", text: "READY FOR CONTRACT" }, // Xanh Lam Đậm (Geekblue)

  // 2. Trạng thái Tài chính (Quan trọng/Tích cực) - **THÀNH CÔNG**
  // Màu Xanh Lá (Green) - Thể hiện thành công, hoàn tất hoặc giao dịch quan trọng.
  deposited: { color: "cyan", text: "DEPOSITED" }, // Xanh Ngọc (Cyan) - Gần xanh lá, nổi bật hơn cho giao dịch tài chính
  signed: { color: "green", text: "SIGNED" }, // Xanh Lá Cây (Green) - Hoàn tất thủ tục
  payment_completed: { color: "success", text: "PAYMENT COMPLETED" }, // Xanh Lá Đậm/Success - Hoàn tất và nổi bật nhất

  // 3. Trạng thái Cần Hành động/Chờ đợi (Cảnh báo nhẹ/Vàng) - **CẢNH BÁO/CHỜ**
  // Màu Vàng/Cam (Yellow/Orange) - Thể hiện cảnh báo nhẹ, cần chú ý hoặc đang chờ.
  pending_delivery: { color: "gold", text: "Pending Delivery" }, // Vàng (Gold) - Chờ hành động tiếp theo

  // 4. Trạng thái Tiêu cực/Kết thúc (Đỏ/Xám) - **TIÊU CỰC/TRUNG LẬP**
  // Màu Đỏ (Red) - Thể hiện lỗi, hủy bỏ, nguy hiểm. Màu Trung lập (Gray) - Kết thúc, không cần hành động.
  cancelled: { color: "error", text: "Cancelled" }, // Đỏ/Error - Bị hủy, tiêu cực

  // Các trạng thái đang chờ khác (Đã điều chỉnh màu để phân biệt với "pending_delivery")
  awaiting_vehicle: { color: "purple", text: "AWAITING VEHICLE" }, // Tím (Purple) - Đang chờ nguồn lực/hàng hóa, khác với chờ hành động của khách
  ready_for_final_payment: {
    color: "volcano",
    text: "READY FOR FINAL PAYMENT",
  }, // Cam Lửa (Volcano) - Quan trọng, cần thanh toán cuối (gần với Warning hơn)
};

const statusOptions = Object.keys(STATUS_MAP).map((key) => ({
  value: key,
  label: STATUS_MAP[key].text,
}));

// Statuses allowing contract creation
const CAN_CREATE_CONTRACT_STATUS = [
  "deposited",
  "ready_for_contract",
  "quotation",
];

export default function OrderManagement() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [detailedOrder, setDetailedOrder] = useState(null);
  const [promotionName, setPromotionName] = useState(null);
  const [form] = Form.useForm();

  const [searchText, setSearchText] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);

  // 📌 State mới: Lưu trữ {orderId: contractId} để kiểm tra nhanh
  const [contractMap, setContractMap] = useState({});

  const account = JSON.parse(localStorage.getItem("account")) || {};
  const currentDealerId = Number(account.dealerId) || 0;

  // --- Search Function (Giữ nguyên) ---
  const handleSearch = (value) => {
    setSearchText(value);
    const lowerCaseValue = value.toLowerCase();

    if (!lowerCaseValue) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter((order) => {
      const vehicleDetails = order.orderDetails?.[0]?.vehicleDetail;
      const vehicleInfo = vehicleDetails
        ? `${vehicleDetails.modelName} ${vehicleDetails.versionName} ${vehicleDetails.colorName}`.toLowerCase()
        : "";

      return (
        order.customerName?.toLowerCase().includes(lowerCaseValue) ||
        order.staffName?.toLowerCase().includes(lowerCaseValue) ||
        vehicleInfo.includes(lowerCaseValue)
      );
    });

    setFilteredOrders(filtered);
  };

  // --- Load Orders (Đã thêm logic kiểm tra hợp đồng) ---
  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await fetchOrders();
      let ordersData = res || [];

      if (currentDealerId) {
        ordersData = ordersData.filter(
          (order) => Number(order.dealerId) === currentDealerId
        );
      }

      // 📌 BƯỚC MỚI: KIỂM TRA HỢP ĐỒNG CHO TỪNG ĐƠN HÀNG
      const contractChecks = {};
      const contractPromises = ordersData.map(async (order) => {
        try {
          // Gọi API để lấy hợp đồng theo orderId (trả về mảng)
          const contracts = await getContractByOrderId(order.id);

          // Giả định API trả về một mảng. Nếu có hợp đồng, lấy ID hợp đồng đầu tiên.
          if (contracts && contracts.length > 0) {
            contractChecks[order.id] = contracts[0].id;
          }
        } catch (e) {
          // Bỏ qua lỗi nếu đơn hàng chưa có hợp đồng (404) hoặc lỗi khác
          console.warn(
            `Could not fetch contract for Order ${order.id}:`,
            e.message
          );
        }
      });

      await Promise.all(contractPromises);
      setContractMap(contractChecks);
      // ------------------------------------

      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (error) {
      console.error("Error loading orders:", error);
      message.error("Failed to load the order list!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDealerId]);

  useEffect(() => {
    handleSearch(searchText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  // --- Handle Create Contract (Navigation Only) ---
  const handleCreateContract = (orderId) => {
    // Điều hướng đến trang tạo hợp đồng
    navigate(`/dealer/contracts/create/${orderId}`);
  };

  // --- Handle View Contract (Navigation Only) ---
  const handleViewContract = (contractId) => {
    // Điều hướng đến trang xem chi tiết hợp đồng
    navigate(`/dealer/contracts/${contractId}`);
  };
  const handleViewPayment = (orderId) => {
    navigate(`/dealer/paymentByOrder/${orderId}`);
  };

  // --- Handle View Details (Giữ nguyên) ---
  const handleViewDetails = async (record) => {
    try {
      setLoading(true);
      const res = await getOrderById(record.id);
      const orderData = res;

      if (!orderData) {
        throw new Error("API returned empty data.");
      }

      setDetailedOrder(orderData);
      const fetchedPromotionName = orderData.promotionName || null;
      setPromotionName(fetchedPromotionName);

      setIsDetailModalVisible(true);
    } catch (error) {
      console.error("Critical Error during Detail View:", error);
      message.error(
        `Failed to load order details! Check console for: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Handle Deposit Payment ---
  const handleDepositPayment = async (orderId) => {
    try {
      setLoading(true);
      const response = await postVNPayDeposit(orderId);
      const { paymentUrl, success, message: apiMessage } = response.data;

      if (success && paymentUrl) {
        message.success(apiMessage || "Opening VNPay payment tab...");
        window.location.href = paymentUrl;
      } else {
        message.error(apiMessage || "Failed to create payment URL.");
      }
      await loadOrders();
    } catch (error) {
      console.error("Error creating VNPay deposit URL:", error);
      message.error(
        `Deposit payment failed: ${
          error.response?.data?.message || "VNPay connection error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Handle Final Payment ---
  const handleFinalPayment = async (orderId) => {
    try {
      setLoading(true);
      const response = await postVNPayFinal(orderId);
      const { paymentUrl, success, message: apiMessage } = response.data;

      if (success && paymentUrl) {
        message.success(apiMessage || "Opening VNPay final payment tab...");
        window.location.href = paymentUrl;
      } else {
        message.error(apiMessage || "Failed to create final payment URL.");
      }
      await loadOrders();
    } catch (error) {
      console.error("Error creating VNPay final URL:", error);
      message.error(
        `Final payment failed: ${
          error.response?.data?.message || "VNPay connection error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Handle Delete ---
  const handleDelete = async (orderId) => {
    try {
      setLoading(true);
      await removeOrder(orderId);
      message.success("Order deleted successfully!");
      await loadOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      message.error(
        `Failed to delete order: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Handle Save Edit ---
  const handleSave = async (values) => {
    try {
      setLoading(true);
      const orderDetailsData = editingOrder.orderDetails;
      const updatedOrder = {
        ...editingOrder,
        ...values,
        id: editingOrder.id,
        orderDetails: orderDetailsData,
      };
      await putOrder(updatedOrder);
      message.success("Order updated successfully!");
      setIsModalVisible(false);
      setEditingOrder(null);
      await loadOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      message.error(
        `Update failed: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Table Columns (Đã cập nhật Actions) ---
  const columns = [
    {
      title: "NO.",
      dataIndex: "orderNumber",
      key: "no",
      width: 80,
      align: "center",
      render: (text, record, index) => {
        const originalIndex = orders.findIndex((o) => o.id === record.id);
        return originalIndex !== -1 ? originalIndex + 1 : index + 1;
      },
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "Staff Name",
      dataIndex: "staffName",
      key: "staffName",
    },
    {
      title: "Vehicle",
      key: "vehicle",
      render: (_, record) => {
        const orderDetails = record.orderDetails;

        if (!orderDetails || orderDetails.length === 0) {
          return "N/A";
        }

        const sortedDetails = [...orderDetails].sort((a, b) => {
          const nameA = a.vehicleDetail?.modelName || "";
          const nameB = b.vehicleDetail?.modelName || "";

          return nameA.localeCompare(nameB, "vi", { sensitivity: "base" });
        });

        return (
          <ul>
            {sortedDetails.map((detail, index) => {
              const vd = detail.vehicleDetail || {};
              const name = `${vd.modelName || ""}${
                vd.versionName ? ` - ${vd.versionName}` : ""
              }${vd.colorName ? ` - (${vd.colorName})` : ""}`;
              const quantity = detail.quantity || 1;

              if (vd.modelName) {
                return (
                  <li
                    key={index}
                    style={{ listStyleType: "disc", marginLeft: "20px" }}
                  >
                    {name.trim()} ({quantity})
                  </li>
                );
              }
              return null;
            })}
          </ul>
        );
      },
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount) => `${amount?.toLocaleString() || 0} VND`,
    },
    {
      title: "Deposit",
      dataIndex: "depositAmount",
      key: "depositAmount",
      render: (amount) => `${amount?.toLocaleString() || 0} VND`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const map = STATUS_MAP[status] || { color: "default", text: status };
        return <Tag color={map.color}>{map.text}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          {/* Nút XEM CHI TIẾT */}
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            title="View Details"
          />

          {/* 💸 NÚT VIEW PAYMENT (ĐÃ THÊM) */}
          <Button
            icon={<DollarCircleOutlined />} // Bạn cần import icon này
            onClick={() => handleViewPayment(record.id)} // Giả sử record.id là ID để xem Payment
            title="View Payment"
          >
            View Payment
          </Button>

          {/* 📌 NÚT HỢP ĐỒNG (View hoặc Create) */}
          {contractMap[record.id] ? (
            <Button
              icon={<FileTextOutlined />}
              type="default"
              title="View Contract"
              onClick={() => handleViewContract(contractMap[record.id])} // View Contract
            >
              View Contract
            </Button>
          ) : (
            /* NÚT TẠO HỢP ĐỒNG (Chỉ hiển thị nếu chưa có và status cho phép) */
            CAN_CREATE_CONTRACT_STATUS.includes(record.status) && (
              <Button
                icon={<FileTextOutlined />}
                type="primary"
                ghost
                onClick={() => handleCreateContract(record.id)} // Create Contract
                title="Create Contract"
              >
                Create Contract
              </Button>
            )
          )}
          {/* Nút XÓA (Delete) */}
          <Popconfirm
            title="Are you sure you want to delete this order?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              icon={<DeleteOutlined />}
              danger
              //disabled={!["draft_quotation", "PENDING","quotation"].includes(record.status)}
              title="Delete Order (Draft only)"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // --- Navigate to Create New Quotation ---
  const handleCreateNew = () => {
    navigate("/dealer/quotation");
  };

  return (
    <Card
      title={`Order & Quotation Management - Dealer #${currentDealerId}`}
      extra={
        <Space>
          <Search
            placeholder="Search by Customer, Staff or Vehicle"
            allowClear
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateNew}
          >
            Create New Quotation
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Spin>

      {/* Modal Edit */}
      <Modal
        title={`Edit Order: ${editingOrder?.orderNumber}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select placeholder="Select status">
              {statusOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="depositAmount"
            label="Deposit Amount (VND)"
            rules={[{ required: true }]}
          >
            <InputNumber
              min={0}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Add any relevant notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal View Details */}
      <Modal
        title={`Order Details: ${detailedOrder?.orderNumber}`}
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {detailedOrder && (
          <OrderDetailView
            order={detailedOrder}
            onDeposit={handleDepositPayment}
            onFinalPayment={handleFinalPayment}
            isLoading={loading}
            promotionName={promotionName}
          />
        )}
      </Modal>
    </Card>
  );
}
