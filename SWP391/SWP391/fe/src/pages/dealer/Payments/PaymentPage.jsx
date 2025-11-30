import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  message,
  Spin,
} from "antd";
import {
  fetchPayments,
  getPaymentById,
  putPaymentStatus,
} from "../../../service/payment.api";
import api from "../../../config/axios";


const { Option } = Select;

const PaymentPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [form] = Form.useForm();

  // 🟢 Lấy danh sách payment
  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await fetchPayments();
      setPayments(res.data || []);
    } catch (error) {
      message.error("Lỗi khi tải danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // 🟢 Mở modal edit
  const handleEdit = async (record) => {
    try {
      const res = await getPaymentById(record.id);
      setEditingPayment(res.data);
      form.setFieldsValue(res.data);
      setOpen(true);
    } catch {
      message.error("Không thể tải chi tiết payment");
    }
  };

  // 🟢 Cập nhật trạng thái thanh toán
  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      await putPaymentStatus(editingPayment.id, { status: values.status });
      message.success("Cập nhật trạng thái thành công!");
      setOpen(false);
      loadPayments();
    } catch {
      message.error("Cập nhật thất bại!");
    }
  };

  // 🟢 Xoá payment (nếu BE có API DELETE)
  const handleDelete = async (id) => {
    try {
      await api.delete(`/payments/${id}`);
      message.success("Xoá thành công!");
      loadPayments();
    } catch {
      message.error("Không thể xoá payment");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id" },
    { title: "Order Number", dataIndex: "orderNumber" },
    //{ title: "Dealer ID", dataIndex: "dealerId" },
    //{ title: "Customer ID", dataIndex: "customerId" },
    { title: "Amount", dataIndex: "amount" },
    { title: "Type", dataIndex: "paymentType" },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <span
          style={{
            color:
              status === "PAID"
                ? "green"
                : status === "PENDING"
                ? "orange"
                : "red",
          }}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Action",
      render: (text, record) => (
        <Space>
          <Button onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm
            title="Xác nhận xoá?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div style={{ padding: 20 }}>
        <h2>Payment Management</h2>
        <Button type="primary" onClick={loadPayments} style={{ marginBottom: 10 }}>
          Refresh
        </Button>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={payments}
          pagination={{ pageSize: 10 }}
        />

        {/* 🟣 Modal chỉnh sửa trạng thái */}
        <Modal
          open={open}
          title={`Cập nhật Payment #${editingPayment?.id}`}
          onCancel={() => setOpen(false)}
          onOk={handleUpdate}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="Status" name="status" rules={[{ required: true }]}>
              <Select placeholder="Chọn trạng thái">
                <Option value="PENDING">PENDING</Option>
                <Option value="PAID">PAID</Option>
                <Option value="CANCELLED">CANCELLED</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Spin>
  );
};

export default PaymentPage;
