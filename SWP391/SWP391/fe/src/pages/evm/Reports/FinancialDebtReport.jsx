import React, { useEffect, useState } from 'react';
import { Card, Spin, Empty, Select, Row, Col, Typography, Table, Tag, message, Divider, Statistic, Alert } from 'antd';
import { MoneyCollectOutlined, FileTextOutlined, DollarOutlined, StopOutlined } from '@ant-design/icons';
import { fetchCompanyDebtReport, fetchDealerDebtReport } from '../../../services/report.api';
import { useSelector } from "react-redux"; // 🆕 Import useSelector

const { Title, Text } = Typography;

// Hàm format tiền tệ (Giữ nguyên)
const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "0 VND";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(amount));
};
const fixedCellStyle = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

const FinancialDebtReport = () => {
    // 🆕 1. Lấy Role và kiểm tra quyền
    const { role } = useSelector((state) => state.account);
    const canViewReport = ["admin"].includes(role?.toLowerCase());

    const [companyDebtData, setCompanyDebtData] = useState([]);
    const [dealerDebtData, setDealerDebtData] = useState([]);
    const [totalDealerDebt, setTotalDealerDebt] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedDealerId, setSelectedDealerId] = useState(null);
    const [selectedDealerName, setSelectedDealerName] = useState(null);
    
    // Danh sách Dealer ID khả dụng (được lấy từ dữ liệu tổng hợp)
    const availableDealers = companyDebtData.map(d => ({ value: d.dealerId, label: d.dealerName }));

    // 1. Load Báo cáo Công nợ Hãng xe (Tổng hợp)
    const loadCompanyDebt = async () => {
        if (!canViewReport) return;
        try {
            const res = await fetchCompanyDebtReport();
            setCompanyDebtData(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error loading company debt report:", error);
            message.error("Không thể tải báo cáo công nợ tổng hợp.");
        }
    };

    // 2. Load Báo cáo Công nợ Chi tiết theo Đại lý
    const loadDealerDebt = async (dealerId) => {
        if (!canViewReport || !dealerId) {
            setDealerDebtData([]);
            setTotalDealerDebt(0);
            return;
        }
        setLoading(true);
        try {
            const res = await fetchDealerDebtReport(dealerId);
            const rawData = Array.isArray(res.data) ? res.data : [];
            
            const summaryItem = rawData.find(item => item.summary === "Total Debt");
            const detailData = rawData.filter(item => item.summary !== "Total Debt");

            setDealerDebtData(detailData);
            setTotalDealerDebt(summaryItem ? summaryItem.totalDebt : 0);

        } catch (error) {
            console.error(`Error loading debt report for dealer ${dealerId}:`, error);
            message.error(`Không thể tải chi tiết công nợ cho Đại lý ID ${dealerId}.`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCompanyDebt();
    }, [canViewReport]);

    useEffect(() => {
        loadDealerDebt(selectedDealerId);
        const dealer = companyDebtData.find(d => d.dealerId === selectedDealerId);
        setSelectedDealerName(dealer ? dealer.dealerName : null);
    }, [selectedDealerId, companyDebtData, canViewReport]);

    // 🆕 2. Hiển thị thông báo không có quyền
    if (!canViewReport) {
        return (
            <div style={{ padding: 24 }}>
                <Alert
                    message="Truy cập bị từ chối"
                    description="Vai trò Staff không được phép xem các báo cáo công nợ."
                    type="error"
                    showIcon
                    icon={<StopOutlined />}
                />
            </div>
        );
    }
    
    // ... (Cột và render JSX giữ nguyên)

    const companyDebtColumns = [
        { title: 'ID Đại Lý', dataIndex: 'dealerId', key: 'dealerId', width: 90, sorter: (a, b) => a.dealerId - b.dealerId,},
        { title: 'Tên Đại Lý', dataIndex: 'dealerName', key: 'dealerName', sorter: (a, b) => (a.dealerName || '').localeCompare(b.dealerName || ''), render: (text) => <Text strong>{text}</Text>},
        { title: 'Tổng Công Nợ Phải Thu', dataIndex: 'totalDebt', key: 'totalDebt', sorter: (a, b) => a.totalDebt - b.totalDebt, render: (amount) => <Tag color="red" style={{ fontSize: '14px' }}>{formatCurrency(amount)}</Tag>},
    ];

    const dealerDebtColumns = [
        { title: 'ID Phiếu Giao Xe', dataIndex: 'distributionId', key: 'distributionId', width: 110, onCell: () => ({ style: fixedCellStyle }),},
        { title: 'Ngày Giao Xe', dataIndex: 'distributionDate', key: 'distributionDate', width: 120, onCell: () => ({ style: fixedCellStyle }),},
        { title: 'Mẫu Xe', dataIndex: 'vehicleModel', key: 'vehicleModel', width: 100, onCell: () => ({ style: fixedCellStyle }),},
        { title: 'VIN', dataIndex: 'vin', key: 'vin', width: 120, onCell: () => ({ style: fixedCellStyle }),},
        { title: 'Khoản Nợ', dataIndex: 'debtAmount', key: 'debtAmount', width: 140, onCell: () => ({ style: { ...fixedCellStyle, textAlign: 'right' } }), render: formatCurrency},
        { title: 'Trạng Thái', dataIndex: 'status', key: 'status', width: 100, onCell: () => ({ style: { ...fixedCellStyle, textAlign: 'center' } }), render: (status) => <Tag color={status === 'unpaid' ? 'volcano' : 'green'}>{status.toUpperCase()}</Tag>},
    ];

    return (
        <div style={{ padding: 24, background: '#f0f2f5' }}>
            <Title level={2} style={{ color: '#001529', marginBottom: 20 }}>
                <MoneyCollectOutlined style={{ marginRight: 10 }} />
                Báo Cáo Công Nợ Phải Thu
            </Title>
            
            <Spin spinning={loading}>
                <Row gutter={[30, 30]}> 
                    {/* BẢNG TỔNG HỢP (CÔNG NỢ HÃNG) */}
                    <Col xs={24} lg={12}>
                        <Card 
                            title={<><DollarOutlined /> Báo Cáo Công Nợ Tổng Hợp (Hãng Xe)</>} 
                            bordered={false} 
                            style={{ borderRadius: 8, minHeight: 450 }} 
                        >
                            <Table
                                dataSource={companyDebtData}
                                columns={companyDebtColumns}
                                rowKey="dealerId"
                                pagination={{ pageSize: 5 }}
                                size="middle"
                                scroll={{ y: 300 }} 
                                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu công nợ phải thu" /> }}
                            />
                        </Card>
                    </Col>
                    
                    {/* BẢNG CHI TIẾT (CÔNG NỢ ĐẠI LÝ) */}
                    <Col xs={24} lg={12}>
                        <Card 
                            title={<><FileTextOutlined /> Chi Tiết Công Nợ Theo Đại Lý</>} 
                            bordered={false} 
                            style={{ borderRadius: 8, minHeight: 450 }}
                        >
                            <Row gutter={16} style={{ marginBottom: 15, alignItems: 'center' }}>
                                <Col>
                                    <Text strong>Chọn Đại lý:</Text>
                                </Col>
                                <Col>
                                    <Select
                                        placeholder="Chọn Đại lý để xem chi tiết"
                                        style={{ width: 250 }}
                                        onChange={setSelectedDealerId}
                                        options={availableDealers}
                                        size="large"
                                        allowClear
                                        showSearch
                                        value={selectedDealerId}
                                    />
                                </Col>
                            </Row>
                            
                            {selectedDealerId && (
                                <>
                                    <Divider style={{ margin: '10px 0' }} />
                                    <Statistic
                                        title={`Tổng Nợ Của ${selectedDealerName || `Đại lý ID ${selectedDealerId}`}`}
                                        value={totalDealerDebt}
                                        formatter={formatCurrency}
                                        prefix={<DollarOutlined />}
                                        valueStyle={{ color: '#cf1322', fontSize: '24px', marginBottom: 15 }}
                                    />
                                </>
                            )}
                            
                            <Table
                                dataSource={dealerDebtData}
                                columns={dealerDebtColumns}
                                rowKey="vin"
                                pagination={{ pageSize: 5 }}
                                size="small"
                                scroll={{ y: 250 }} 
                                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Vui lòng chọn đại lý hoặc không có khoản nợ chi tiết" /> }}
                            />
                        </Card>
                    </Col>
                </Row>
            </Spin>
        </div>
    );
};

export default FinancialDebtReport;