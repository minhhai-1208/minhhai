import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Image,
  Spin,
  Button,
  Modal,
  Select,
  Descriptions,
  Tag,
  Typography,
} from "antd";
import { toast } from "react-toastify";
import {
  getVehicleById,
  fetchVehicles,
} from "../../../service/vehicle-models.api";
import { fetchVehicleDetails } from "../../../service/vehicle-details.api";
import { getVehicleColorlById } from "../../../service/vehicle-colors.api";
import { getVehicleVersionById } from "../../../service/vehicle-versions.api";
import { SwapOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

// Màu Accent Color (Đồng bộ với Header/Sidebar)
const ACCENT_COLOR = "#00BCD4";

const ComparePage = () => {
  const { ids } = useParams();
  const navigate = useNavigate();

  const [modelSpecs, setModelSpecs] = useState([]);
  const [versionSpecs, setVersionSpecs] = useState([]);
  const [colorSpecs, setColorSpecs] = useState([]);

  const [details, setDetails] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]); // Danh sách ALL DETAILs

  const [loading, setLoading] = useState(true);
  const [compareModal, setCompareModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null); // Detail ID được chọn

  const idList = ids ? ids.split(",").map(Number) : []; // ID List là Detail IDs

  // 🔹 Map color name -> hex code (Giữ nguyên)
  const getColorHex = (colorName) => {
    if (!colorName) return "#d9d9d9";
    const lower = colorName.toLowerCase();
    if (lower.includes("đỏ")) return "#FF0000";
    if (lower.includes("xanh dương") || lower.includes("dương"))
      return "#0000FF";
    if (lower.includes("xanh lá")) return "#00FF00";
    if (lower.includes("vàng")) return "#FFFF00";
    if (lower.includes("đen")) return "#000000";
    if (lower.includes("trắng")) return "#f9f0f0ff";
    if (lower.includes("bạc")) return "#C0C0C0";
    if (lower.includes("xám") || lower.includes("ghi")) return "#808080";
    if (lower.includes("cam")) return "#FFA500";
    if (lower.includes("hồng")) return "#FFC0CB";
    if (lower.includes("nâu")) return "#A52A2A";
    if (lower.includes("tím")) return "#800080";
    return "#d9d9d9";
  };

  // 🔹 Format date as DD/MM/YYYY with leading zeros (Giữ nguyên)
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // ============================================================
  // ✅ HÀM LỌC TÍCH HỢP CHO SELECT (LIVE SEARCH)
  // ============================================================
  const filterVehicleOption = (input, option) => {
    const lowerCaseInput = input.toLowerCase();

    // Dữ liệu xe được lấy từ prop 'item' đã truyền vào Option
    const modelName = option.item.modelName?.toLowerCase() || "";
    const colorName = option.item.colorName?.toLowerCase() || "";
    const versionName = option.item.versionName?.toLowerCase() || "";
    const detailCode = option.item.detailCode?.toLowerCase() || "";

    // Tìm kiếm nếu chuỗi input có trong bất kỳ trường nào
    return (
      modelName.includes(lowerCaseInput) ||
      colorName.includes(lowerCaseInput) ||
      versionName.includes(lowerCaseInput) ||
      detailCode.includes(lowerCaseInput)
    );
  };

  // 🔹 Load comparison data (Logic giữ nguyên)
  const loadData = async (idList) => {
    setLoading(true);
    try {
      const allDetailsRes = await fetchVehicleDetails();
      const allDetails = allDetailsRes.data;

      let selectedDetails = idList
        .map((id) => allDetails.find((d) => d.id === id))
        .filter(Boolean);

      // Sắp xếp các chi tiết đang so sánh theo tên Model
      selectedDetails.sort((a, b) => {
        const nameA = a.modelName ? a.modelName.toUpperCase() : "";
        const nameB = b.modelName ? b.modelName.toUpperCase() : "";
        // Sử dụng localeCompare với tùy chọn numeric: true cho sắp xếp tự nhiên
        return nameA.localeCompare(nameB, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      });

      setDetails(selectedDetails);

      if (selectedDetails.length === 0) {
        setModelSpecs([]);
        setVersionSpecs([]);
        setColorSpecs([]);
        setLoading(false);
        return;
      }

      const modelIds = selectedDetails.map((d) => d.modelId);
      const versionIds = selectedDetails.map((d) => d.versionId);
      const colorIds = selectedDetails.map((d) => d.colorId);

      const fetchPromises = [];

      const modelPromises = modelIds.map((id) => getVehicleById(id));
      fetchPromises.push(Promise.all(modelPromises));

      const versionPromises = versionIds.map((id) => getVehicleVersionById(id));
      fetchPromises.push(Promise.all(versionPromises));

      const colorPromises = colorIds.map((id) => getVehicleColorlById(id));
      fetchPromises.push(Promise.all(colorPromises));

      const [modelsRes, versionRes, colorRes] = await Promise.all(
        fetchPromises
      );

      setModelSpecs(modelsRes.map((res) => res.data));
      setVersionSpecs(versionRes.map((res) => res.data));
      setColorSpecs(colorRes.map((res) => res.data));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load comparison data!");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Load all vehicles for adding new comparison (Lấy ALL DETAILs)
  const loadAllVehicles = async () => {
    try {
      const res = await fetchVehicleDetails();
      let allDetails = res.data;

      // ✅ ÁP DỤNG SẮP XẾP TỰ NHIÊN CHO DANH SÁCH CHỌN
      allDetails.sort((a, b) => {
        const nameA = a.modelName ? a.modelName.toUpperCase() : "";
        const nameB = b.modelName ? b.modelName.toUpperCase() : "";
        return nameA.localeCompare(nameB, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      });

      setAllVehicles(allDetails);
    } catch (error) {
      console.error("Error loading vehicles:", error);
    }
  };

  useEffect(() => {
    if (idList.length > 0) loadData(idList);
  }, [ids]);

  useEffect(() => {
    loadAllVehicles();
  }, []);

  // 🔹 When confirming selection in modal
  const handleConfirmChange = () => {
    if (!selectedVehicleId) {
      toast.warning("Please select a vehicle to replace!");
      return;
    }

    const newIds = [...details.map((d) => d.id)];

    if (selectedIndex === details.length) newIds.push(selectedVehicleId);
    else newIds[selectedIndex] = selectedVehicleId;

    const newRoute = `/dealer/compare/${newIds.join(",")}`; // URL chứa các Detail IDs
    setCompareModal(false);
    navigate(newRoute);
  };

  if (loading)
    return (
      <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
    );

  if (details.length === 0 && !loading) {
    return (
      <div style={{ padding: 24 }}>
        <Title level={3}>No vehicles selected for comparison.</Title>
        <p>Please use the button above to add a vehicle detail to compare.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        {/* CHỈNH MÀU TIÊU ĐỀ CHÍNH */}
        <Title level={2} style={{ color: ACCENT_COLOR }}>
          Electric Vehicle Detail Comparison (SKUs)
        </Title>
        <Button
          type="primary"
          onClick={() => {
            setSelectedIndex(details.length);
            setCompareModal(true);
            setSelectedVehicleId(null);
          }}
        >
          ➕ Add Vehicle to Compare
        </Button>
      </div>

      <Row gutter={24} justify="center" align="top">
        {details.map((detail, index) => {
          const model = modelSpecs[index] || {};
          const version = versionSpecs[index] || {};
          const color = colorSpecs[index] || {};

          return (
            <Col
              span={Math.min(24 / details.length, 6)}
              key={detail.id}
              style={{ minWidth: 350 }}
            >
              {/* Card ngoài: Bắt buộc phải có height: 100% để kéo dài trong Col */}
              <Card
                title={
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "4px 0",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <Text strong style={{ fontSize: 16 }}>
                      {model.modelName}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {detail.versionName} / {detail.colorName}
                    </Text>
                    <Button
                      type="text"
                      icon={<SwapOutlined />}
                      size="small"
                      onClick={() => {
                        setSelectedIndex(index);
                        setCompareModal(true);
                        setSelectedVehicleId(detail.id);
                      }}
                      style={{ marginTop: 8 }}
                    >
                      Change
                    </Button>
                  </div>
                }
                style={{
                  borderRadius: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  marginBottom: 24,
                  height: "100%", // ✅ Quan trọng: Kéo dài Card
                  display: "flex",
                  flexDirection: "column",
                }}
                bodyStyle={{ flexGrow: 1 }} // ✅ Quan trọng: Đẩy nội dung chiếm hết không gian còn lại
              >
                {/* =================================================== */}
                {/* KHUNG ẢNH CỐ ĐỊNH (giữ nguyên) */}
                {/* =================================================== */}
                <div
                  style={{
                    width: "100%",
                    height: 200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid #e8e8e8",
                  }}
                >
                  {detail.imgURL ? (
                    <Image
                      src={detail.imgURL}
                      alt={detail.modelName || "Vehicle image"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        borderRadius: 8,
                      }}
                      fallback="/images/no-image.png"
                      preview={false}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#999",
                        fontSize: 14,
                      }}
                    >
                      No Image Available
                    </div>
                  )}
                </div>
                {/* =================================================== */}
                {/* KẾT THÚC KHUNG ẢNH CỐ ĐỊNH */}
                {/* =================================================== */}

                {/* ✅ Bảng Descriptions (Đây là nơi cần đảm bảo sự đồng nhất) */}
                <Descriptions
                  bordered
                  size="small"
                  column={1}
                  // ✅ Tối ưu: Đảm bảo nhãn có chiều rộng cố định để tránh layout dịch chuyển
                  labelStyle={{ width: "150px", fontWeight: 500 }}
                >
                  <Descriptions.Item label="Retail Price">
                    <Text strong type="success">
                      {detail.finalPrice
                        ? detail.finalPrice.toLocaleString("vi-VN") + " VND"
                        : "N/A"}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Detail Code">
                    {detail.detailCode || "N/A"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Color">
                    <span
                      style={{
                        display: "inline-block",
                        width: "20px",
                        height: "20px",
                        backgroundColor: getColorHex(detail.colorName),
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        verticalAlign: "middle",
                      }}
                    ></span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Hex Code">
                    {color.hexColor || "N/A"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Battery Capacity">
                    {model.batteryCapacity || "N/A"} kWh
                  </Descriptions.Item>
                  <Descriptions.Item label="Range">
                    {model.rangeKm || "N/A"} km
                  </Descriptions.Item>
                  <Descriptions.Item label="Motor Power">
                    {model.motorPower || "N/A"} kW
                  </Descriptions.Item>

                  <Descriptions.Item label="Version Code">
                    {version.versionCode || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Version Features">
                    {version.featuresDescription || "N/A"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Model Status">
                    <Tag color={model.status === "active" ? "green" : "red"}>
                      {model.status || "N/A"}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Version Status">
                    <Tag color={version.status === "active" ? "green" : "red"}>
                      {version.status || "N/A"}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* 🔹 Modal to select vehicle (ĐÃ TÍCH HỢP LIVE SEARCH) */}
      <Modal
        title={
          selectedIndex === details.length
            ? "Select Vehicle Detail to Add"
            : "Select Vehicle Detail to Replace"
        }
        open={compareModal}
        onCancel={() => setCompareModal(false)}
        onOk={handleConfirmChange}
        okText={selectedIndex === details.length ? "Add" : "Replace"}
      >
        <Text style={{ marginBottom: 8, display: "block" }}>
          Search by Model, Version, Color, or Detail Code:
        </Text>
        <Select
          showSearch // ✅ Bật thanh tìm kiếm
          placeholder="Search and select a vehicle detail"
          style={{ width: "100%" }}
          value={selectedVehicleId}
          onChange={setSelectedVehicleId}
          filterOption={filterVehicleOption} // ✅ Áp dụng hàm lọc tùy chỉnh
        >
          {/* Lọc để không thêm Detail ID đã có */}
          {allVehicles
            .filter((v) => !details.some((d) => d.id === v.id))
            .map((v) => (
              // ✅ Thêm prop 'item' để hàm lọc có thể truy cập dữ liệu đầy đủ
              <Select.Option key={v.id} value={v.id} item={v}>
                **{v.modelName}** ({v.versionName} - {v.colorName})
              </Select.Option>
            ))}
        </Select>
      </Modal>
    </div>
  );
};

export default ComparePage;
