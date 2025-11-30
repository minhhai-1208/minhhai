import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPaymentsByOrderId } from "../../../service/payment.api"; 
import { Table, Spin, Alert, Typography } from "antd"; 
import { DollarCircleOutlined } from "@ant-design/icons";
import moment from "moment"; 

const { Title } = Typography;

export default function OrderPayments() {

  const { orderId } = useParams(); 

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * @function fetchPayments
   * Fetches the list of payments based on orderId
   */
  const fetchPayments = async (id) => {
    if (!id) {
      setError("Order ID not found in the URL.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await getPaymentsByOrderId(id);
      // Assuming the API returns the payment array directly
      setPayments(response.data || []); 
    } catch (err) {
      console.error("Error loading payments list:", err);
      setError("Failed to load payment data. Please try again.");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Call API when the component mounts or orderId changes
    fetchPayments(orderId);
  }, [orderId]);

  // Table column configuration
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Order Number",
      dataIndex: "orderNumber",
      key: "orderNumber",
    },
    {
      title: "Payment Type",
      dataIndex: "paymentType",
      key: "paymentType",
      // Translate payment types for display
      render: (type) => type === 'deposit' ? 'Deposit' : 'Final Payment',
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: 'right',
      sorter: (a, b) => a.amount - b.amount,
      // Format amount as currency
      render: (amount) => amount.toLocaleString('en-US') + ' VND',
    },
    {
      title: "Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
    },
    {
      title: "Payment Date",
      dataIndex: "paymentDate",
      key: "paymentDate",
      // Format: DD/MM/YYYY (Time removed as requested)
      render: (date) => moment(date).format("DD/MM/YYYY"), 
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Transaction Reference",
      dataIndex: "transactionReference",
      key: "transactionReference",
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" tip="Loading payment data..." />
      </div>
    );
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }
  
  return (
    <div>
      <Title level={2} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <DollarCircleOutlined />
        Payment List - Order #{orderId}
      </Title>
      
      {payments.length === 0 ? (
        <Alert
          message="No Payments Found"
          description={`There are currently no payment transactions recorded for Order #${orderId}.`}
          type="info"
          showIcon
        />
      ) : (
        <Table
          columns={columns}
          dataSource={payments}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )}
    </div>
  );
}