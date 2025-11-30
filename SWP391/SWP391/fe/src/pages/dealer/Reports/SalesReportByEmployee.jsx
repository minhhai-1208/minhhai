import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Row,
  Col,
  message,
  Space,
  Empty,
  Typography,
  Statistic,
} from "antd";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { fetchDealerReport } from "../../../service/report.api"; // ✅ Dùng đúng file reports.api.js

const { Title } = Typography;

// 🎨 Màu sắc cho biểu đồ
const COLORS_ORDERS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
const COLORS_REVENUE = ["#8884d8", "#82ca9d"];

// 💡 Hàm định dạng tiền tệ
const formatVND = (value) => {
  if (typeof value !== "number") return "0 VND";
  return value.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};

const SalesReportByEmployee = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // 🧠 Hàm gọi API báo cáo
  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetchDealerReport(); // ✅ API: /api/reports/dealer/{dealer_id}
      setReportData(res);

      message.success("✅ Đã tải báo cáo đại lý thành công!");
    } catch (err) {
      console.error(err);
      message.error(err.message || "Không thể tải báo cáo đại lý!");
    } finally {
      setLoading(false);
    }
  };

  // ⚙️ Gọi khi component mount
  useEffect(() => {
    fetchReport();
  }, []);

  // 📊 Chuẩn bị dữ liệu biểu đồ
  let orderChartData = [];
  let revenueChartData = [];
  let contractChartData = [];

  if (reportData) {
    // Giả lập các trường nếu BE chưa trả đủ
    orderChartData = [
      { name: "Completed Orders", value: reportData.completedOrders || 0 },
      { name: "Pending Orders", value: (reportData.totalOrders || 0) - (reportData.completedOrders || 0) },
    ];

    revenueChartData = [
      {
        name: "Dealer",
        Revenue: reportData.totalRevenue || 0,
      },
    ];

    contractChartData = [
      { name: "Conversion Rate", value: reportData.conversionRate || 0 },
      { name: "Remaining", value: 100 - (reportData.conversionRate || 0) },
    ];
  }

  // 🧱 UI
  return (
    <Card
      title={`📈 Dealer Overview Report: ${reportData?.dealerName || "Loading..."}`}
      bordered={false}
    >
      {reportData ? (
        <>
          {/* Hàng 1: Các chỉ số tổng quan */}
          <Title level={4}>Overview</Title>
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Dealer Location"
                  value={reportData.dealerLocation || "N/A"}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Orders"
                  value={reportData.totalOrders || 0}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Completed Orders"
                  value={reportData.completedOrders || 0}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Conversion Rate"
                  value={reportData.conversionRate || 0}
                  suffix="%"
                  valueStyle={{ color: "#00C49F" }}
                />
              </Card>
            </Col>
          </Row>

          {/* Hàng 2: Biểu đồ */}
          <Title level={4}>Charts</Title>
          <Row gutter={[16, 16]}>
            {/* Biểu đồ 1: Order Status */}
            <Col xs={24} md={8}>
              <Card title="Order Status">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {orderChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS_ORDERS[index % COLORS_ORDERS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Biểu đồ 2: Doanh thu */}
            <Col xs={24} md={8}>
              <Card title="Revenue (VND)">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={formatVND} />
                    <Tooltip formatter={formatVND} />
                    <Legend />
                    <Bar dataKey="Revenue" fill={COLORS_REVENUE[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Biểu đồ 3: Conversion Rate */}
            <Col xs={24} md={8}>
              <Card title="Conversion Rate (%)">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={contractChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                    >
                      {contractChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS_REVENUE[index % COLORS_REVENUE.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <div style={{ padding: "50px 0" }}>
          <Empty
            description={
              loading ? "Đang tải dữ liệu..." : "Không có dữ liệu báo cáo."
            }
          />
        </div>
      )}
    </Card>
  );
};

export default SalesReportByEmployee;
