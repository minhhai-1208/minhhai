import React from "react";
import { Table, Button, Tag, Descriptions, Popconfirm } from "antd";
import { WalletOutlined } from "@ant-design/icons";

// --- Status Map (Cần định nghĩa lại hoặc import từ nơi chung)
// Tạm định nghĩa lại để component độc lập
const STATUS_MAP = {
  draft_quotation: { color: "blue", text: "DRAFT_QUOTATION" },
  ready_for_contract: { color: "geekblue", text: "READY_FOR_CONTRACT" },
  deposited: { color: "purple", text: "DEPOSITED" },
  pending_delivery: { color: "gold", text: "Pending Delivery" },
  signed: { color: "green", text: "SIGNED" },
  cancelled: { color: "red", text: "Cancelled" },
};

export default function OrderDetailView({
  order,
  onDeposit,
  onFinalPayment,
  isLoading,
  promotionName,
}) {
  // Logic hiển thị nút thanh toán
  const showDepositButton =
    ["draft_quotation", "quotation"].includes(order.status) &&
    order.depositAmount > 0;

  // Chỉ thanh toán cuối cùng khi đã deposited VÀ remainingAmount > 0
  const showFinalPaymentButton =
    ["signed", "ready_for_final_payment"].includes(order.status) &&
    order.remainingAmount > 0;

  // Tính tổng chiết khấu cho cả đơn
  const baseTotal = order.orderDetails.reduce(
    (sum, detail) =>
      sum + (detail.vehicleDetail?.finalPrice * detail.quantity || 0),
    0
  );
  const totalDiscount = baseTotal - order.totalAmount;

  return (
    <div className="p-4">
      <Descriptions
        bordered
        column={2}
        size="small"
        title="General Information"
      >
        <Descriptions.Item label="Order No.">
          {order.orderNumber}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={STATUS_MAP[order.status]?.color || "default"}>
            {STATUS_MAP[order.status]?.text || order.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Customer Name">
          {order.customerName}
        </Descriptions.Item>
        <Descriptions.Item label="Staff Name">
          {order.staffName}
        </Descriptions.Item>
        <Descriptions.Item label="Quotation Date">
          {new Date(order.quotationDate).toLocaleDateString("en-US")}
        </Descriptions.Item>
        <Descriptions.Item label="Valid Until">
          {new Date(order.quotationValidUntil).toLocaleDateString("en-US")}
        </Descriptions.Item>

        {/* TRƯỜNG KHUYẾN MÃI */}
        <Descriptions.Item label="Applied Promotion" span={2}>
          {/* Hiển thị Tên Khuyến Mãi (hoặc ID) */}
          {promotionName ||
            (order.promotionId ? `ID: ${order.promotionId}` : "None")}

          {/* 📌 SỬA ĐỔI: Chỉ hiển thị chuỗi văn bản, loại bỏ Tag */}
          {totalDiscount > 0 && (
            <span className="ml-2 font-semibold text-red-600">
              (Total Discount: {totalDiscount.toLocaleString()} VND)
            </span>
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Total Amount">
          {order.totalAmount?.toLocaleString()} VND
        </Descriptions.Item>
        <Descriptions.Item label="Deposit Amount">
          {order.depositAmount?.toLocaleString()} VND
        </Descriptions.Item>
        <Descriptions.Item label="Remaining Amount">
          {order.remainingAmount?.toLocaleString()} VND
        </Descriptions.Item>
        <Descriptions.Item label="Notes" span={2}>
          {order.notes || "N/A"}
        </Descriptions.Item>
      </Descriptions>

      {/* 📌 KHU VỰC NÚT THANH TOÁN */}
      <div className="mt-4 text-center">
        {showDepositButton && (
          <Popconfirm
            title={`Xác nhận thanh toán đặt cọc ${order.depositAmount?.toLocaleString()} VND qua VNPay?`}
            onConfirm={() => onDeposit(order.id)}
            okText="Thanh Toán Đặt Cọc"
            cancelText="Hủy"
          >
            <Button
              icon={<WalletOutlined />}
              type="primary"
              size="large"
              loading={isLoading}
            >
              Thanh Toán Đặt Cọc
            </Button>
          </Popconfirm>
        )}

        {showFinalPaymentButton && (
          <Popconfirm
            title={`Xác nhận thanh toán cuối cùng ${order.remainingAmount?.toLocaleString()} VND qua VNPay?`}
            onConfirm={() => onFinalPayment(order.id)}
            okText="Thanh Toán Cuối Cùng"
            cancelText="Hủy"
          >
            <Button
              icon={<WalletOutlined />}
              type="primary"
              size="large"
              loading={isLoading}
            >
              Thanh Toán Cuối Cùng
            </Button>
          </Popconfirm>
        )}
      </div>
      {/* --------------------------- */}

      <h3 className="mt-6 mb-3 font-semibold">Product Details</h3>
      <Table
        dataSource={order.orderDetails}
        rowKey="id"
        pagination={false}
        size="small"
        columns={[
          {
            title: "Vehicle Model",
            key: "model",
            render: (text, record) =>
              `${record.vehicleDetail?.modelName}-${record.vehicleDetail?.colorName}`,
          },
          {
            title: "Version",
            dataIndex: ["vehicleDetail", "versionName"],
            key: "version",
          },
          // Giá Bán Gốc
          {
            title: "Final Price (Listed)",
            key: "finalPrice",
            render: (text, record) =>
              record.vehicleDetail?.finalPrice?.toLocaleString() + " VND",
          },

          { title: "Quantity", dataIndex: "quantity", key: "quantity" },
        ]}
      />
    </div>
  );
}
