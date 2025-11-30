import React, { useEffect, useState } from 'react';
import { Card, Spin, Empty, Select, Row, Col, Typography, Table, Tag, message, Alert } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BoxPlotOutlined, CarOutlined, LineChartOutlined, StopOutlined } from '@ant-design/icons';
import { fetchInventoryConsumption } from '../../../services/report.api';
import { useSelector } from "react-redux"; // 🆕 Import useSelector

const { Title, Text } = Typography;
const getCurrentYear = () => new Date().getFullYear();

const InventoryConsumptionReport = () => {
    // 🆕 1. Lấy Role và kiểm tra quyền
    const { role } = useSelector((state) => state.account);
    const canViewReport = ["admin"].includes(role?.toLowerCase());

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState(getCurrentYear());

    const loadReport = async (year) => {
        if (!canViewReport) return; // Không tải nếu không có quyền
        setLoading(true);
        try {
            const res = await fetchInventoryConsumption(year);
            const rawData = res.data?.modelReports || []; 

            const mappedData = rawData.map(item => ({
                modelName: item.modelName,
                currentStock: item.currentStock,
                soldQuantity: item.annualSales, 
                modelId: item.modelId 
            }));

            setReportData(mappedData);
        } catch (error) {
            console.error("Error loading inventory report:", error);
            message.error("Không thể tải báo cáo tồn kho & tiêu thụ.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (canViewReport) {
            loadReport(selectedYear);
        }
    }, [selectedYear, canViewReport]);
    
    // 🆕 2. Hiển thị thông báo không có quyền
    if (!canViewReport) {
        return (
            <div style={{ padding: 24 }}>
                <Alert
                    message="Truy cập bị từ chối"
                    description="Vai trò Staff không được phép xem các báo cáo hiệu suất."
                    type="error"
                    showIcon
                    icon={<StopOutlined />}
                />
            </div>
        );
    }

    // ... (logic xử lý dữ liệu và columns giữ nguyên)
    const chartData = reportData
        .sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0))
        .slice(0, 5)
        .map(item => ({
            modelName: item.modelName,
            Tồn_kho_hiện_tại: item.currentStock,
            Đã_bán_trong_năm: item.soldQuantity,
        }));

    const columns = [
        { title: 'Mẫu xe', dataIndex: 'modelName', key: 'modelName', width: 150, render: (text) => <Text strong>{text}</Text> },
        { title: 'Tồn kho hiện tại', dataIndex: 'currentStock', key: 'currentStock', sorter: (a, b) => a.currentStock - b.currentStock, render: (qty) => <Tag color="blue">{qty || 0}</Tag>},
        { title: 'Số lượng bán ra', dataIndex: 'soldQuantity', key: 'soldQuantity', sorter: (a, b) => a.soldQuantity - b.soldQuantity, render: (qty) => <Tag color="green">{qty || 0}</Tag>},
        { title: 'Tỷ lệ tồn kho (%)', key: 'stockRatio', render: (_, record) => { const total = (record.currentStock || 0) + (record.soldQuantity || 0); if (total === 0) return '0%'; const ratio = ((record.currentStock || 0) / total) * 100; return `${ratio.toFixed(1)}%`;}},
    ];

    const yearOptions = Array.from({ length: 5 }, (_, i) => ({
        value: getCurrentYear() - i,
        label: `Năm ${getCurrentYear() - i}`,
    }));
    // ... (Phần render JSX giữ nguyên)
    return (
        <div style={{ padding: 24, background: '#f0f2f5' }}>
            <Title level={2} style={{ color: '#001529', marginBottom: 20 }}>
                <BoxPlotOutlined style={{ marginRight: 10 }} />
                Báo Cáo Tồn Kho & Tiêu Thụ
            </Title>
            
            <Row gutter={24} style={{ marginBottom: 20, alignItems: 'center' }}>
                <Col>
                    <Text strong>Chọn năm báo cáo:</Text>
                </Col>
                <Col>
                    <Select
                        defaultValue={selectedYear}
                        style={{ width: 120 }}
                        onChange={setSelectedYear}
                        options={yearOptions}
                        size="large"
                    />
                </Col>
            </Row>

            <Spin spinning={loading}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={12}>
                        <Card title={<><LineChartOutlined /> Biểu Đồ So Sánh Tồn Kho & Tiêu Thụ (Top 5)</>} bordered={false} style={{ borderRadius: 8 }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart
                                        data={chartData}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="modelName" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Area type="monotone" dataKey="Tồn_kho_hiện_tại" stackId="1" stroke="#1890ff" fill="#1890ff" />
                                        <Area type="monotone" dataKey="Đã_bán_trong_năm" stackId="1" stroke="#52c41a" fill="#52c41a" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu biểu đồ" />
                            )}
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card title={<><CarOutlined /> Chi Tiết Tồn Kho & Bán Hàng theo Mẫu xe</>} bordered={false} style={{ borderRadius: 8 }}>
                            <Table
                                dataSource={reportData}
                                columns={columns}
                                rowKey="modelName"
                                pagination={{ pageSize: 5 }}
                                size="small"
                                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu tồn kho" /> }}
                            />
                        </Card>
                    </Col>
                </Row>
            </Spin>
        </div>
    );
};

export default InventoryConsumptionReport;