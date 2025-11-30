import React, { useEffect, useState } from 'react';
import { Card, Spin, Empty, Select, Row, Col, Typography, Table, Tag, message, Alert } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GlobalOutlined, LineChartOutlined, DollarOutlined, StopOutlined } from '@ant-design/icons';
import { fetchRegionalSales } from '../../../services/report.api';
import { useSelector } from "react-redux"; // 🆕 Import useSelector

const { Title, Text } = Typography;

const getCurrentYear = () => new Date().getFullYear();

// Hàm format tiền tệ
const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "0 VND";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(amount));
};

const RegionalSalesReport = () => {
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
            const res = await fetchRegionalSales(year);
            // SỬA: Trích xuất mảng dữ liệu từ khóa 'regionalSales'
            const data = res.data?.regionalSales || []; 
            setReportData(data);
        } catch (error) {
            console.error("Error loading regional sales report:", error);
            message.error("Không thể tải báo cáo doanh số khu vực.");
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
    const chartData = reportData.map(item => ({
        ...item,
        totalRevenue: item.totalSales,
        Doanh_số_bán_hàng: item.totalSales,
    }));


    const columns = [
        { title: 'Khu Vực', dataIndex: 'region', key: 'region', width: 150, render: (text) => <Text strong>{text}</Text> },
        { title: 'Tổng Doanh Thu', dataIndex: 'totalSales', key: 'totalSales', sorter: (a, b) => (a.totalSales || 0) - (b.totalSales || 0), render: formatCurrency},
        // Cột 'Số Lượng Xe Bán' bị ẩn do BE không cung cấp
    ];

    const yearOptions = Array.from({ length: 5 }, (_, i) => ({
        value: getCurrentYear() - i,
        label: `Năm ${getCurrentYear() - i}`,
    }));

    // ... (Phần render JSX giữ nguyên)
    return (
        <div style={{ padding: 24, background: '#f0f2f5' }}>
            <Title level={2} style={{ color: '#001529', marginBottom: 20 }}>
                <GlobalOutlined style={{ marginRight: 10 }} />
                Báo Cáo Doanh Số Theo Khu Vực
            </Title>
            
            <Row gutter={24} style={{ marginBottom: 20, alignItems: 'center' }}>
                <Col>
                    <Text strong>Chọn năm:</Text>
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
                        <Card title={<><LineChartOutlined /> Biểu Đồ So Sánh Doanh Số</>} bordered={false} style={{ borderRadius: 8 }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={chartData}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="region" />
                                        <YAxis tickFormatter={(value) => `${(value / 1000000000).toFixed(0)} Tỷ`} /> 
                                        <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                                        <Legend />
                                        <Bar dataKey="totalSales" name="Tổng Doanh Thu" fill="#ff9900" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu biểu đồ" />
                            )}
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card title={<><DollarOutlined /> Chi Tiết Doanh Thu</>} bordered={false} style={{ borderRadius: 8 }}>
                            <Table
                                dataSource={reportData}
                                columns={columns}
                                rowKey="region"
                                pagination={{ pageSize: 5 }}
                                size="small"
                                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu doanh số" /> }}
                            />
                        </Card>
                    </Col>
                </Row>
            </Spin>
        </div>
    );
};

export default RegionalSalesReport;