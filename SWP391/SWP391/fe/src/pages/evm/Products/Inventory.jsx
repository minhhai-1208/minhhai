import React, { useEffect, useState } from "react";
import {
    Table,
    Button,
    Form,
    Input,
    Select,
    Popconfirm,
    Card,
    Drawer,
    Row,
    Col,
    Tag,
    InputNumber,
    Tooltip,
    DatePicker,
} from "antd";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    BarcodeOutlined,
    DollarOutlined,
} from "@ant-design/icons";
import {
    fetchVehicleInventories,
    postVehicleInventories,
    putVehicleInventories,
    removeVehicleInventories,
} from "../../../services/vehicle-inventories.api";
import { fetchVehicleDetails } from "../../../services/vehicle-detail.api";
import { fetchDealers } from "../../../services/dealer.api";

// ✅ Format tiền tệ
const formatCurrency = (amount) => {
    const numberAmount = Number(amount);
    if (isNaN(numberAmount) || numberAmount === 0) return "0 VND";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(numberAmount);
};

// ✅ Chuyển dayjs → string
const formatDateValue = (value) => (value ? dayjs(value).format("YYYY-MM-DD") : null);

const Inventory = () => {
    const [inventories, setInventories] = useState([]);
    const [vehicleDetails, setVehicleDetails] = useState([]);
    const [dealers, setDealers] = useState([]);
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [editingRecord, setEditingRecord] = useState(null);
    // ✅ THAY ĐỔI: Khởi tạo là undefined để Select trống
    const [selectedDealer, setSelectedDealer] = useState(undefined); 

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

    // --- FETCH ---
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please login first!");
            navigate("/login");
            return;
        }
        fetchInventoriesData();
        fetchVehicleDetailsData();
        fetchDealersData();
    }, [navigate]);

    const fetchInventoriesData = async () => {
        try {
            const res = await fetchVehicleInventories();
            const list = Array.isArray(res.data)
                ? res.data
                : res.data?.data || res.data?.content || [];
            setInventories(list);
        } catch (err) {
            console.error("Error fetching inventories:", err);
            toast.error("Error fetching inventories!");
        }
    };

    const fetchVehicleDetailsData = async () => {
        try {
            const res = await fetchVehicleDetails();
            const list = Array.isArray(res.data)
                ? res.data
                : res.data?.data || res.data?.content || [];
            setVehicleDetails(list);
        } catch (err) {
            console.error("Error fetching vehicle details:", err);
        }
    };

    const fetchDealersData = async () => {
        try {
            const res = await fetchDealers();
            const list = Array.isArray(res.data)
                ? res.data
                : res.data?.data || res.data?.content || [];
            setDealers(list);
        } catch (err) {
            console.error("Error fetching dealers:", err);
        }
    };

    // --- SUBMIT FORM ---
    const handleSubmit = async (values) => {
        
        // Xử lý Dealer ID: Gửi NULL nếu không chọn Đại lý (Tức là Kho Trung tâm)
        // Nếu giá trị là null/undefined/0, gửi null.
        const dealerIdValue = values.dealerId;
        const finalDealerId = (dealerIdValue === null || dealerIdValue === undefined || dealerIdValue === 0) 
                             ? null 
                             : Number(dealerIdValue); 
        
        const payload = {
            ...values,
            vehicleDetailId: Number(values.vehicleDetailId),
            dealerId: finalDealerId, 
            wholesalePrice: Number(values.wholesalePrice),
            retailPrice: Number(values.retailPrice),
            manufacturingDate: formatDateValue(values.manufacturingDate),
            receivedDate: formatDateValue(values.receivedDate),
            soldDate: formatDateValue(values.soldDate),
        };

        if (!editingRecord) delete payload.id;
        
        if (payload.vehicleDetailId === 0 || isNaN(payload.vehicleDetailId)) {
             toast.error("Vehicle Detail ID is required.");
             return;
        }

        try {
            if (editingRecord) {
                await putVehicleInventories(payload);
                toast.success("Inventory updated successfully!");
            } else {
                await postVehicleInventories(payload);
                toast.success("Inventory added successfully! (HQ Stock)");
            }
            handleCloseDrawer();
            fetchInventoriesData();
        } catch (err) {
            console.error("POST/PUT Inventory ERROR:", err.response?.data || err);
            toast.error("Error saving inventory! Check required fields.");
        }
    };

    // --- DELETE ---
    const handleDelete = async (id) => {
        try {
            await removeVehicleInventories(id);
            toast.success("Inventory deleted!");
            fetchInventoriesData();
        } catch (err) {
            console.error(err);
            toast.error("Error deleting inventory!");
        }
    };

    const handleCloseDrawer = () => {
        setOpen(false);
        setEditingRecord(null);
        form.resetFields();
    };

    // --- EDIT ---
    const handleEdit = (record) => {
        setEditingRecord(record);
        form.setFieldsValue({
            ...record,
            dealerId: (record.dealerId === 0 || record.dealerId === null) ? null : record.dealerId, 
            manufacturingDate: record.manufacturingDate ? dayjs(record.manufacturingDate) : null,
            receivedDate: record.receivedDate ? dayjs(record.receivedDate) : null,
            soldDate: record.soldDate ? dayjs(record.soldDate) : null,
        });
        setOpen(true);
    };

    // ✅ ĐÃ SỬA: Logic Lọc - Hiển thị tất cả nếu selectedDealer là undefined
    const filteredInventories = selectedDealer === undefined
        ? inventories
        : selectedDealer === null//Kho tổng
            ? inventories.filter((item) => item.dealerId === null || item.dealerId === undefined || item.dealerId === 0)
            : inventories.filter((item) => item.dealerId === selectedDealer);

    // --- TABLE ---
    const columns = [
        {
            title: "VIN / Chassis",
            dataIndex: "vinNumber",
            key: "vinNumber",
            fixed: "left",
            width: 180,
            render: (vin, record) => (
                <div className="flex flex-col text-sm">
                    <Tooltip title="VIN Number">
                        <span className="font-semibold text-gray-800 flex items-center gap-1">
                            <BarcodeOutlined className="text-blue-600" /> {vin}
                        </span>
                    </Tooltip>
                    <Tooltip title="Chassis Number">
                        <span className="text-xs text-gray-500">{record.chassisNumber}</span>
                    </Tooltip>
                </div>
            ),
        },
        {
            title: "Engine / Detail ID",
            key: "engine_details",
            width: 150,
            render: (_, record) => (
                <div className="flex flex-col text-sm">
                    <span className="font-medium text-gray-800">{record.engineNumber}</span>
                    <span className="text-xs text-gray-500">Detail ID: {record.vehicleDetailId}</span>
                </div>
            ),
        },
        {
            title: "Prices (Retail/Wholesale)",
            key: "prices",
            width: 180,
            render: (_, record) => (
                <div className="flex flex-col text-sm">
                    <Tooltip title="Retail Price (Giá Bán Lẻ)">
                        <span className="font-semibold text-green-600 cursor-help">
                            {formatCurrency(record.retailPrice)}
                        </span>
                    </Tooltip>
                    <Tooltip title={`Wholesale Price (Giá Sỉ): ${formatCurrency(record.wholesalePrice)}`}>
                        <span className="text-sm text-gray-500 cursor-help">
                            {formatCurrency(record.wholesalePrice)}
                        </span>
                    </Tooltip>
                </div>
            ),
        },
        {
            title: "Dealer ID",
            dataIndex: "dealerId",
            key: "dealerId",
            width: 100,
            render: (dealerId) =>
                (dealerId === null || dealerId === undefined || dealerId === 0) ? <Tag color="geekblue">HQ</Tag> : <Tag color="blue">D-{dealerId}</Tag>,
        },
        {
            title: "Dates",
            key: "dates",
            width: 150,
            render: (_, record) => (
                <div className="flex flex-col text-xs">
                    <span className="text-gray-800">{record.manufacturingDate}</span>
                    <span className="text-gray-600">{record.receivedDate}</span>
                    {record.soldDate && <Tag color="red">SOLD</Tag>}
                </div>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 100,
            render: (status) => {
                let color = "blue";
                if (status === "sold") color = "red";
                if (status === "in_stock") color = "green";
                return <Tag color={color}>{status.toUpperCase().replace("_", " ")}</Tag>;
            },
        },
        {
            title: "Action",
            key: "actions",
            fixed: "right",
            width: 80,
            render: (_, record) => (
                <div className="flex gap-1 justify-center">
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<EditOutlined className="text-blue-500 hover:text-blue-700" />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Popconfirm title="Delete this item?" onConfirm={() => handleDelete(record.id)}>
                        <Tooltip title="Delete">
                            <Button type="text" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <DollarOutlined className="mr-3 text-green-600" />
                    Vehicle Inventory Management
                </h1>
                <Button
                    type="primary"
                    size="large"
                    className="bg-blue-600 hover:bg-blue-700 font-semibold"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        form.resetFields();
                        setEditingRecord(null);
                        setOpen(true);
                    }}
                >
                    Add New Inventory
                </Button>
            </div>

            {/* ✅ Bộ lọc HQ/Dealer */}
            <div className="mb-4 flex justify-end gap-2">
                <Select
                    allowClear
                    showSearch
                    placeholder="Filter by Dealer"
                    style={{ width: 250 }}
                    optionFilterProp="children"
                    // ✅ THAY ĐỔI: Nếu giá trị là undefined (Clear) hoặc null (HQ option), set về giá trị đó.
                    onChange={(value) => {
                        setSelectedDealer(value === undefined ? undefined : value);
                    }}
                    options={[
                        // Tùy chọn cho Kho Trung tâm (HQ Stock)
                        { label: "Kho Trung tâm (Hãng)", value: null }, 
                        ...dealers.map((d) => ({
                            label: d.dealerName || `Dealer ${d.id}`,
                            value: d.id,
                        })),
                    ]}
                    value={selectedDealer}
                />
            </div>

            <Card className="shadow-xl rounded-xl">
                <Table 
                    dataSource={filteredInventories} 
                    columns={columns} 
                    rowKey="id" 
                />
            </Card>

            {/* Drawer Form */}
            <Drawer
                title={
                    <span className="text-xl font-bold text-gray-800">
                        {editingRecord ? "Edit Inventory: " : "Add New Inventory"}
                        <span className="text-blue-600 ml-2">{editingRecord?.vinNumber || "New Car"}</span>
                    </span>
                }
                open={open}
                onClose={handleCloseDrawer}
                maskClosable={false}
                width={720}
                destroyOnClose
                footer={
                    <div className="flex justify-end gap-2">
                        <Button onClick={handleCloseDrawer}>Cancel</Button>
                        <Button onClick={form.submit} type="primary" className="bg-blue-600 font-semibold">
                            {editingRecord ? "Save Changes" : "Create Inventory"}
                        </Button>
                    </div>
                }
            >
                <Form layout="vertical" form={form} onFinish={handleSubmit}>
                    <Form.Item name="id" hidden>
                        <Input />
                    </Form.Item>

                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
                        Identification & Ownership
                    </h3>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Vehicle Detail"
                                name="vehicleDetailId"
                                rules={[{ required: true, message: "Please select a vehicle detail" }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Select vehicle detail"
                                    optionFilterProp="children"
                                    options={vehicleDetails.map((v) => ({
                                        label: `${v.detailCode} - ${v.modelName} (${v.colorName})`,
                                        value: v.id,
                                    }))}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label="Dealer (Ownership)"
                                name="dealerId"
                            >
                                <Select
                                    allowClear
                                    showSearch
                                    placeholder="Select dealer or leave blank for HQ Stock"
                                    optionFilterProp="children"
                                    options={[
                                        { label: "Kho Trung tâm (Hãng/HQ)", value: null }, 
                                        ...dealers.map((d) => ({
                                            label: d.dealerName || `Dealer ${d.id}`,
                                            value: d.id,
                                        })),
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="VIN Number" name="vinNumber" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Chassis Number" name="chassisNumber" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Engine Number" name="engineNumber" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mt-6 mb-4">Pricing</h3>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Wholesale Price" name="wholesalePrice" rules={[{ required: true }]}>
                                <InputNumber
                                    {...positiveNumberProps}
                                    formatter={(v) => (v ? formatCurrency(v) : "")}
                                    parser={(v) => v.replace(/[^\d]/g, "")}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Retail Price" name="retailPrice" rules={[{ required: true }]}>
                                <InputNumber
                                    {...positiveNumberProps}
                                    formatter={(v) => (v ? formatCurrency(v) : "")}
                                    parser={(v) => v.replace(/[^\d]/g, "")}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mt-6 mb-4">
                        Dates & Status
                    </h3>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                label="Manufacturing Date"
                                name="manufacturingDate"
                                rules={[{ required: true }]}
                            >
                                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Received Date" name="receivedDate" rules={[{ required: true }]}>
                                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Sold Date" name="soldDate">
                                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                        <Select
                            options={[
                                { value: "active", label: "Active" },
                                { value: "in_stock", label: "In Stock" },
                                { value: "sold", label: "Sold" },
                                { value: "transit", label: "In Transit" },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    );
};

export default Inventory;