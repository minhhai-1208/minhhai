import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Table, Tag, Typography, Button, Spin, Result } from "antd";
import { getPaymentsByOrderId } from "../../../service/payment.api.js";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const PaymentResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState(null);

  // Parse query parameters from URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const isSuccess = queryParams.get("success") === "true";
    const msg = queryParams.get("message");
    const txnRef = queryParams.get("vnp_TxnRef");

    setSuccess(isSuccess);
    setMessage(msg || "");
    setLoading(true);

    // Extract order ID from txnRef (format: {orderId}_deposit_xxx)
    if (txnRef) {
      const extractedOrderId = txnRef.split("_")[0];
      setOrderId(extractedOrderId);
      fetchPaymentDetails(extractedOrderId);
    } else {
      setLoading(false);
    }
  }, [location.search]);

  // Fetch payment details
  const fetchPaymentDetails = async (orderId) => {
    try {
      const res = await getPaymentsByOrderId(orderId);
      setPayments(res.data || []);
    } catch (error) {
      console.error("Error fetching payment details:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Payment Type",
      dataIndex: "paymentType",
      key: "paymentType",
      width: 140,
      render: (type) =>
        type === "deposit" ? (
          <Tag color="blue">Deposit</Tag>
        ) : (
          <Tag color="green">Final Payment</Tag>
        ),
    },
    {
      title: "Amount (VND)",
      dataIndex: "amount",
      key: "amount",
      width: 160,
      render: (amount) => amount.toLocaleString(),
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: 150,
    },
    {
      title: "Payment Date",
      dataIndex: "paymentDate",
      key: "paymentDate",
      width: 160,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => (
        <Tag color={status === "completed" ? "green" : "orange"}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Transaction No.",
      dataIndex: "vnpTransactionNo",
      key: "vnpTransactionNo",
      width: 180,
    },
    {
      title: "Bank Code",
      dataIndex: "vnpBankCode",
      key: "vnpBankCode",
      width: 140,
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <Card
        bordered={false}
        style={{
          maxWidth: 900,
          margin: "0 auto",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          borderRadius: "12px",
        }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : success ? (
          <>
            <Result
              status="success"
              title="Payment Successful!"
              subTitle={
                message || "Your transaction has been processed successfully."
              }
            />
            <Title level={4} style={{ marginTop: "2rem" }}>
              Transaction Details
            </Title>

            <Table
              columns={columns}
              dataSource={payments}
              pagination={false}
              rowKey="id"
              style={{
                fontSize: "15px",
              }}
              bordered
            />

            <div className="text-center mt-6">
              <Button
                type="primary"
                onClick={() => navigate("/dealer/orderManagement")}
              >
                Back to Orders
              </Button>
            </div>
          </>
        ) : (
          <Result
            status="error"
            title="Payment Failed"
            subTitle={message || "Unable to retrieve transaction information."}
            extra={[
              <Button type="primary" onClick={() => navigate("/dealer/orders")}>
                Back to Orders
              </Button>,
            ]}
          />
        )}
      </Card>
    </div>
  );
};

export default PaymentResults;
