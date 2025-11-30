import React, { useEffect, useState } from "react";
import {
    Card,
    Table,
    Tag,
    Tooltip,
    Button,
    Space,
    Modal,
    Input,
    Form,
} from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    CarOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";

// Import API functions
import {
    fetchPendingVehicleRequests,
    approveVehicleRequest,
    rejectVehicleRequest,
} from "../../../services/vehicle-request.api";

// Helper function to get status tag color/icon
const getStatusTag = (status) => {
    switch (status?.toLowerCase()) {
        case "pending":
            return (
                <Tag icon={<ClockCircleOutlined />} color="processing">
                    {status}
                </Tag>
            );
        case "approved":
            return (
                <Tag icon={<CheckCircleOutlined />} color="success">
                    {status}
                </Tag>
            );
        case "rejected":
            return (
                <Tag icon={<CloseCircleOutlined />} color="error">
                    {status}
                </Tag>
            );
        default:
            return <Tag color="default">{status}</Tag>;
    }
};

const VehicleRequest = () => {
    const [requestData, setRequestData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
    const [currentRequestId, setCurrentRequestId] = useState(null);
    const [form] = Form.useForm(); // Form cho Reject

    // State for Approve Modal
    const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [approveForm] = Form.useForm(); // Form cho Approve

    const loadPendingRequests = async () => {
        setLoading(true);
        try {
            const res = await fetchPendingVehicleRequests();
            const data = res.data || [];

            const tableData = data.map((item) => ({
                ...item,
                key: item.id,
            }));

            setRequestData(tableData);
        } catch (err) {
            console.error("Error fetching pending requests:", err);
            toast.error("Failed to load pending requests."); // Đã dịch
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPendingRequests();
    }, []);

    // --- APPROVE LOGIC ---

    const handleApprove = (record) => {
        setCurrentRequest(record);
        approveForm.setFieldsValue({ approvedQuantity: record.requestedQuantity });
        setIsApproveModalVisible(true);
    };

    const handleApproveSubmit = async (values) => {
        if (!currentRequest) return;

        const approvedQuantity = values.approvedQuantity;

        if (
            approvedQuantity <= 0 ||
            approvedQuantity > currentRequest.requestedQuantity
        ) {
            toast.error(
                `Approved Quantity must be greater than 0 and not exceed ${currentRequest.requestedQuantity}`
            ); // Đã dịch
            return;
        }

        setLoading(true);
        try {
            // Truyền approvedQuantity vào hàm API
            await approveVehicleRequest(currentRequest.id, approvedQuantity);
            toast.success(
                `Request #${currentRequest.id} approved with quantity ${approvedQuantity}.`
            ); // Đã dịch
            loadPendingRequests();
        } catch (err) {
            console.error("Error approving request:", err);
            const errorMessage = err.response?.data?.message || "Failed to approve request.";
            toast.error(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
            setIsApproveModalVisible(false);
            setCurrentRequest(null);
            approveForm.resetFields();
        }
    };

    // --- REJECT LOGIC (ĐÃ SỬA) ---
    const handleReject = (id) => {
        setCurrentRequestId(id);
        setIsRejectModalVisible(true);
    };

    const handleRejectSubmit = async (values) => {
        // LOẠI BỎ LOGIC validationFields Ở ĐÂY VÌ NÓ ĐANG GẶP LỖI STATE/REGISTER VALUE
        
        setLoading(true);
        try {
            // Gọi API, Form.Item name="reason" sẽ truyền lý do vào values.reason
            await rejectVehicleRequest(currentRequestId, values.reason);
            
            toast.success(
                `Request #${currentRequestId} rejected. Reason: ${values.reason}`
            ); // Đã dịch
            loadPendingRequests();
        } catch (err) {
            // SỬA ĐỔI: Thêm logic hiển thị lỗi chi tiết từ BE
            console.error("Error rejecting request:", err);
            const errorMessage = err.response?.data?.message || "Failed to reject request.";
            toast.error(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
            setIsRejectModalVisible(false);
            setCurrentRequestId(null);
            form.resetFields();
        }
    };

    // --- TABLE COLUMNS (GIỮ NGUYÊN) ---
    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 80,
            render: (id) => (
                <Tag color="default" className="font-bold">
                    {id}
                </Tag>
            ),
        },
        {
            title: "Dealer", // Đã dịch
            dataIndex: "dealerName",
            key: "dealerName",
            width: 150,
            render: (name, record) => (
                <Tooltip title={`ID: ${record.dealerId}`}>{name}</Tooltip>
            ),
        },
        {
            title: "Vehicle Configuration", // Đã dịch
            key: "full_detail",
            width: 290,
            render: (_, record) => (
                <div className="flex flex-col text-sm">
                    {/* Thêm VehicleDetailId vào tiêu đề phụ */}
                    <span className="font-semibold text-gray-800">
                        {record.vehicleModelName} ({record.vehicleVersionName})
                    </span>
                    <span className="text-xs text-gray-500">
                        Color: {record.vehicleColorName} (Detail ID:{" "}
                        <Tag color="processing" size="small">
                            {record.vehicleDetailId}
                        </Tag>
                        )
                    </span>
                </div>
            ),
        },
        {
            title: "Requested Quantity", // Đã dịch
            dataIndex: "requestedQuantity",
            key: "requestedQuantity",
            width: 180,
            render: (text) => (
                <Tag color="blue" className="font-semibold text-base">
                    {text}
                </Tag>
            ),
        },
        // {
        //     title: "Available Qty", // Đã dịch
        //     dataIndex: "availableQuantity",
        //     key: "availableQuantity",
        //     width: 120,
        //     render: (text) => <Tag color="green" className="font-semibold text-base">{text || 0}</Tag>
        // },
        {
            title: "Status", // Đã dịch
            dataIndex: "status",
            key: "status",
            width: 120,
            render: getStatusTag,
        },
        {
            title: "Request Date", // Đã dịch
            dataIndex: "requestDate",
            key: "requestDate",
            width: 150,
        },
        {
            title: "Action", // Đã dịch
            key: "action",
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    {/* Approve Button */}
                    <Tooltip title={`Approve Request #${record.id}`}>
                        {" "}
                        {/* Đã dịch */}
                        <Button
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleApprove(record)}
                            type="primary"
                            size="small"
                        >
                            Approve
                        </Button>
                    </Tooltip>

                    {/* Reject Button */}
                    <Tooltip title={`Reject Request #${record.id}`}>
                        {" "}
                        {/* Đã dịch */}
                        <Button
                            icon={<CloseCircleOutlined />}
                            onClick={() => handleReject(record.id)}
                            danger
                            size="small"
                        >
                            Reject
                        </Button>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
                <CarOutlined className="mr-3 text-blue-600" />
                Pending Vehicle Requests Management {/* Đã dịch */}
            </h2>

            <Card
                title="List of Pending Requests"
                loading={loading}
                className="shadow-xl rounded-xl"
            >
                {" "}
                {/* Đã dịch */}
                <Table
                    dataSource={requestData}
                    columns={columns}
                    rowKey="key"
                    pagination={{ pageSize: 10 }}
                    size="middle"
                />
            </Card>

            {/* Approve Modal */}
            <Modal
                title={`Approve Request #${currentRequest?.id}`}
                open={isApproveModalVisible}
                onCancel={() => setIsApproveModalVisible(false)}
                footer={null}
            >
                <Form
                    form={approveForm}
                    onFinish={handleApproveSubmit}
                    layout="vertical"
                >
                    <p className="mb-4">
                        Dealer **{currentRequest?.dealerName}** requested **
                        {currentRequest?.requestedQuantity}** vehicles. Available Quantity:
                        **{currentRequest?.availableQuantity || 0}**. {/* Đã dịch */}
                    </p>
                    <Form.Item
                        name="approvedQuantity"
                        label="Approved Quantity" // Đã dịch
                        rules={[
                            {
                                required: true,
                                message: "Please enter the approved quantity!",
                            }, // Đã dịch
                            {
                                type: "number",
                                min: 1,
                                message: "Quantity must be a positive number!",
                            }, // Đã dịch
                        ]}
                        initialValue={currentRequest?.requestedQuantity}
                    >
                        <Input
                            type="number"
                            min={1}
                            max={currentRequest?.requestedQuantity}
                            placeholder="Enter the quantity you approve"
                        />{" "}
                        {/* Đã dịch */}
                    </Form.Item>
                    <Form.Item className="text-right mb-0">
                        <Space>
                            <Button onClick={() => setIsApproveModalVisible(false)}>
                                Cancel
                            </Button>{" "}
                            {/* Đã dịch */}
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Confirm Approval {/* Đã dịch */}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Reject Modal */}
            <Modal
                title={`Reject Request #${currentRequestId}`}
                open={isRejectModalVisible}
                onCancel={() => setIsRejectModalVisible(false)}
                footer={null}
                // SỬA: Đảm bảo Form State được reset hoàn toàn
                destroyOnClose={true} 
            >
                <Form
                    form={form}
                    onFinish={handleRejectSubmit}
                    layout="vertical"
                    initialValues={{ reason: '' }}
                >
                    <Form.Item
                        name="reason"
                        label="Rejection Reason" // Đã dịch
                        // SỬA: XÓA RULES ĐỂ FORM CHO PHÉP SUBMIT
                        // Validation đã được chuyển sang Backend (hoặc người dùng phải đảm bảo nhập lý do)
                        // rules={[
                        //     { required: true, message: "Please enter the reason for rejection!" },
                        // ]} 
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="Enter the reason for rejecting this request"
                        />{" "}
                        {/* Đã dịch */}
                    </Form.Item>
                    <Form.Item className="text-right mb-0">
                        <Space>
                            <Button onClick={() => setIsRejectModalVisible(false)}>
                                Cancel
                            </Button>{" "}
                            {/* Đã dịch */}
                            <Button
                                type="primary"
                                danger
                                // SỬA: Ép Form submit trực tiếp, bỏ htmlType="submit"
                                onClick={form.submit} 
                                loading={loading}
                            >
                                Confirm Rejection {/* Đã dịch */}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default VehicleRequest;