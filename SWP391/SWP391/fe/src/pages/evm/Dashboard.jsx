import { Card, Col, Row, Statistic, Table } from "antd";
import {
    CarOutlined,
    AppstoreOutlined,
    ShopOutlined,
    DollarOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";

// ✅ Import các API service
import { fetchVehicleInventories } from "../../services/vehicle-inventories.api";
import { fetchDealers } from "../../services/dealer.api";
import { fetchVehicleDetails } from "../../services/vehicle-detail.api";
import { fetchContracts } from "../../services/contract.api";
// ✅ IMPORT API CÔNG NỢ TỔNG HỢP
import { fetchCompanyDebtReport } from "../../services/report.api"; 

// --- HÀM HỖ TRỢ ---
const formatCurrency = (amount) => {
    const numberAmount = Number(amount);
    if (isNaN(numberAmount) || numberAmount === 0) return "0 VND";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(numberAmount);
};

const normalizeData = (res) => {
    return Array.isArray(res.data)
        ? res.data
        : res.data?.content || res.data || [];
};

export default function Dashboard() {
    const [stats, setStats] = useState({
        vehicles: 0, 
        stock: 0,
        dealers: 0,
    });
    const [vehicleData, setVehicleData] = useState([]);
    const [dealerData, setDealerData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // ✅ THÊM fetchCompanyDebtReport VÀO PROMISE.ALL
            const [inventoryRes, dealerRes, detailRes, contractRes, debtRes] = await Promise.all([
                fetchVehicleInventories(),
                fetchDealers(),
                fetchVehicleDetails(), // Nguồn chính cho xe
                fetchContracts(),
                fetchCompanyDebtReport(), // API mới lấy công nợ tổng hợp
            ]);

            const inventories = normalizeData(inventoryRes); 
            const dealers = normalizeData(dealerRes);
            const vehicleDetails = normalizeData(detailRes); 
            const contracts = normalizeData(contractRes);
            const debtReport = normalizeData(debtRes); // Dữ liệu công nợ
            
            const stockStatuses = ["in_stock", "available"]; 

            // --- TÍNH TOÁN CÁC CHỈ SỐ CỐT LÕI ---
            
            // 1. Gộp tồn kho theo Detail ID
            const inventoryCountByDetailId = inventories.reduce((acc, inv) => {
                if (stockStatuses.includes(inv.status)) {
                    acc[inv.vehicleDetailId] = (acc[inv.vehicleDetailId] || 0) + 1;
                }
                return acc;
            }, {});

            // 2. TỔNG TỒN KHO (Chung)
            const totalStock = inventories
                .filter((item) => stockStatuses.includes(item.status))
                .length;

            // 3. ĐẾM SỐ MẪU XE DUY NHẤT
            const uniqueModels = new Set(vehicleDetails.map(d => d.modelName)).size;
            
            // 4. TÍNH MAP SỐ LƯỢNG HỢP ĐỒNG
            const contractCountMap = contracts.reduce((acc, contract) => {
                acc[contract.dealerId] = (acc[contract.dealerId] || 0) + 1;
                return acc;
            }, {});
            
            // 5. TẠO MAP CÔNG NỢ TỪ BÁO CÁO CÔNG NỢ HÃNG
            const dealerDebtMap = debtReport.reduce((acc, item) => {
                // Sử dụng dealerId và totalDebt từ báo cáo công nợ
                acc[item.dealerId] = item.totalDebt || 0; 
                return acc;
            }, {});


            setStats({
                vehicles: uniqueModels, 
                stock: totalStock,
                dealers: dealers.length,
            });
            
            // --- TẠO BẢNG DANH MỤC XE & TỒN KHO ---
            
            const groupedStock = vehicleDetails.reduce((acc, detail) => {
                const stockCount = inventoryCountByDetailId[detail.id] || 0;
                
                const groupKey = `${detail.modelName}|${detail.versionName}`;
                
                // Tránh lỗi undefined nếu modelName không có
                if (!detail.modelName) return acc;

                if (acc[groupKey]) {
                    acc[groupKey].stock += stockCount;
                } else {
                    acc[groupKey] = {
                        model: detail.modelName,
                        versions: detail.versionName,
                        stock: stockCount,
                        key: groupKey, 
                    };
                }
                return acc;
            }, {});
            
            const vehicleTable = Object.values(groupedStock);
            
            // Bổ sung Tồn kho bị thất lạc
            const totalStockInTable = vehicleTable.reduce((sum, item) => sum + item.stock, 0);
            const unmappedStock = totalStock - totalStockInTable;

            if (unmappedStock > 0) {
                vehicleTable.push({
                    key: 'unmapped',
                    model: "Unmapped/Unknown Model",
                    versions: "Lỗi ánh xạ Detail ID", 
                    stock: unmappedStock,
                });
            }
            
            // Bảng đại lý - SỬ DỤNG DỮ LIỆU CÔNG NỢ TỪ BÁO CÁO
            const dealerTable = dealers.map((d) => {
                const currentDebt = dealerDebtMap[d.id] || 0; // Lấy nợ từ map báo cáo
                return {
                    key: d.id,
                    name: d.dealerName, 
                    contracts: contractCountMap[d.id] || 0, 
                    debt: formatCurrency(currentDebt), 
                    rawDebt: currentDebt, // Dùng rawDebt mới cho logic màu
                };
            }).sort((a, b) => b.rawDebt - a.rawDebt); // Sắp xếp theo công nợ giảm dần

            setVehicleData(vehicleTable);
            setDealerData(dealerTable);
        } catch (err) {
            console.error("❌ Error loading dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER COMPONENTS ---
    
    const vehicleColumns = [
        { title: "Mẫu xe", dataIndex: "model" },
        { title: "Phiên bản", dataIndex: "versions" }, 
        { 
            title: "Tồn kho", 
            dataIndex: "stock",
            render: (stock) => (
                <span style={{ color: stock === 0 ? '#cf1322' : 'inherit', fontWeight: stock === 0 ? 'bold' : 'normal' }}>
                    {stock} xe
                </span>
            )
        },
    ];

    const dealerColumns = [
        { title: "Tên đại lý", dataIndex: "name" },
        { 
            title: "Hợp đồng", 
            dataIndex: "contracts",
            sorter: (a, b) => a.contracts - b.contracts,
        },
        { 
            title: "Công nợ", 
            dataIndex: "debt",
            sorter: (a, b) => a.rawDebt - b.rawDebt, // Sắp xếp dựa trên rawDebt
            render: (debt, record) => (
                <span style={{ color: record.rawDebt > 0 ? '#cf1322' : 'inherit' }}>
                    {debt}
                </span>
            )
        },
    ];


    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">EVM Dashboard</h2>

            {/* 🔹 Thống kê tổng quan */}
            <Row gutter={[16, 16]}>
                {/* Số mẫu xe */}
                <Col span={8}>
                    <Card loading={loading} className="shadow-sm">
                        <Statistic 
                            title="Số mẫu xe" 
                            value={stats.vehicles} 
                            prefix={<CarOutlined />} 
                        />
                    </Card>
                </Col>
                {/* Tồn kho tổng */}
                <Col span={8}>
                    <Card loading={loading} className="shadow-sm">
                        <Statistic
                            title="Tồn kho tổng"
                            value={stats.stock}
                            suffix="xe"
                            prefix={<AppstoreOutlined />} 
                        />
                    </Card>
                </Col>
                {/* Số đại lý */}
                <Col span={8}>
                    <Card loading={loading} className="shadow-sm">
                        <Statistic 
                            title="Số đại lý" 
                            value={stats.dealers} 
                            prefix={<ShopOutlined />} 
                        />
                    </Card>
                </Col>
            </Row>

            {/* 🔹 Bảng dữ liệu */}
            <Row gutter={[16, 16]} className="mt-6">
                <Col span={12}>
                    <Card title="Danh mục xe & Tồn kho" loading={loading} className="shadow-sm">
                        <Table
                            dataSource={vehicleData}
                            columns={vehicleColumns}
                            pagination={{ pageSize: 7 }}
                            size="small"
                            rowKey="key"
                        />
                    </Card>
                </Col>

                <Col span={12}>
                    <Card title="Đại lý & Công nợ" loading={loading} className="shadow-sm">
                        <Table
                            dataSource={dealerData}
                            columns={dealerColumns}
                            pagination={{ pageSize: 7 }}
                            size="small"
                            rowKey="key"
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}