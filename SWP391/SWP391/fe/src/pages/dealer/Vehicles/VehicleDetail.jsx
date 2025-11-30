import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Spin,
  Button,
  Tag,
  Typography,
  Descriptions,
  Modal,
  Select,
  Divider,
} from "antd";
import { toast } from "react-toastify";
import {
  // ... import functions
  fetchVehicles,
  getVehicleById,
} from "../../../service/vehicle-models.api";
import { fetchVehicleDetails } from "../../../service/vehicle-details.api";
import { getVehicleColorlById } from "../../../service/vehicle-colors.api";
import { getVehicleVersionById } from "../../../service/vehicle-versions.api";

const { Title, Text } = Typography;

const VehicleDetail = () => {
  const { ids } = useParams();
  const detailId = ids ? Number(ids) : null;

  const navigate = useNavigate();

  // 🔹 Data states
  const [vehicle, setVehicle] = useState(null);
  const [versionSpecs, setVersionSpecs] = useState(null);
  const [colorSpecs, setColorSpecs] = useState(null);
  const [details, setDetails] = useState([]);
  const [detailInfo, setDetailInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Compare states
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [allVehicles, setAllVehicles] = useState([]);
  const [selectedCompareVehicleId, setSelectedCompareVehicleId] =
    useState(null);

  // ============================================================
  // 🔹 INDIVIDUAL LOADERS
  // ============================================================

  const loadVehicle = async (modelId) => {
    try {
      const res = await getVehicleById(modelId);
      setVehicle(res.data);
      return res.data;
    } catch (error) {
      console.error("Error loading vehicle model:", error);
      toast.error("Could not load vehicle model information!");
      return null;
    }
  };

  const loadVersionSpecs = async (versionId) => {
    try {
      const res = await getVehicleVersionById(versionId);
      setVersionSpecs(res.data);
      return res.data;
    } catch (error) {
      console.error("Error loading version specs:", error);
      toast.error("Could not load version specifications!");
      return null;
    }
  };

  const loadColorSpecs = async (colorId) => {
    try {
      const res = await getVehicleColorlById(colorId);
      setColorSpecs(res.data);
      return res.data;
    } catch (error) {
      console.error("Error loading color specs:", error);
      toast.error("Could not load color specifications!");
      return null;
    }
  };

  const loadDetailsList = async (modelId) => {
    try {
      const res = await fetchVehicleDetails();
      const filtered = res.data.filter(
        (d) => Number(d.modelId) === Number(modelId)
      );
      setDetails(filtered);
    } catch (error) {
      console.error("Error loading details list:", error);
      toast.error("Could not load detail data list!");
    }
  };

  const loadAllVehicles = async () => {
    try {
      const res = await fetchVehicleDetails();
      let allDetails = res.data;

      const sortedDetails = allDetails.sort((a, b) => {
        const nameA = a.modelName ? a.modelName.toUpperCase() : "";
        const nameB = b.modelName ? b.modelName.toUpperCase() : "";

        return nameA.localeCompare(nameB, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      });

      setAllVehicles(sortedDetails);
    } catch (error) {
      console.error("Error loading vehicle list:", error);
    }
  };

  const getSingleDetail = async (id) => {
    const res = await fetchVehicleDetails();
    return res.data.find((d) => Number(d.id) === Number(id));
  };

  // ============================================================
  // ✅ HÀM LỌC TÍCH HỢP CHO SELECT
  // ============================================================
  /**
   * Hàm lọc tùy chỉnh, sử dụng để tìm kiếm trong Select component của Ant Design.
   * @param {string} input - Chuỗi người dùng gõ vào ô tìm kiếm.
   * @param {object} option - Đối tượng Option đang được kiểm tra.
   * @returns {boolean} - Trả về true nếu phù hợp, false nếu không.
   */
  const filterVehicleOption = (input, option) => {
    const lowerCaseInput = input.toLowerCase();

    // Dữ liệu xe được truyền qua prop 'item' của Select.Option
    const modelName = option.item.modelName?.toLowerCase() || '';
    const colorName = option.item.colorName?.toLowerCase() || '';
    const versionName = option.item.versionName?.toLowerCase() || '';
    const detailCode = option.item.detailCode?.toLowerCase() || '';

    // Tìm kiếm nếu chuỗi input có trong bất kỳ trường nào
    return (
      modelName.includes(lowerCaseInput) ||
      colorName.includes(lowerCaseInput) ||
      versionName.includes(lowerCaseInput) ||
      detailCode.includes(lowerCaseInput)
    );
  };

  // ============================================================
  // ✅ Load everything when the page opens
  // ============================================================
  useEffect(() => {
    const loadData = async () => {
      if (!detailId) {
        toast.error("Missing vehicle detail ID!");
        setLoading(false);
        return;
      }

      setLoading(true);
      let currentDetail = null;

      try {
        currentDetail = await getSingleDetail(detailId);

        if (!currentDetail || !currentDetail.modelId) {
          toast.error("Vehicle detail information or linked IDs not found!");
          setLoading(false);
          return;
        }

        const { modelId, versionId, colorId } = currentDetail;

        await Promise.all([
          loadVehicle(modelId),
          loadVersionSpecs(versionId),
          loadColorSpecs(colorId),
          loadDetailsList(modelId),
          loadAllVehicles(),
        ]);

        setDetailInfo({ ...currentDetail });
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load vehicle details!");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [ids]);

  const handleConfirmCompare = () => {
    if (!selectedCompareVehicleId) {
      toast.warning("Please select a vehicle to compare!");
      return;
    }
    navigate(`/dealer/compare/${detailId},${selectedCompareVehicleId}`);
    setCompareModalVisible(false);
    setSelectedCompareVehicleId(null);
  };

  const handleOpenCompareModal = () => {
    setSelectedCompareVehicleId(null);
    setCompareModalVisible(true);
  }

  // ============================================================
  // 🎨 RENDER
  // ============================================================
  if (loading)
    return (
      <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
    );

  if (!vehicle || !detailInfo) return <p>Vehicle information not found!</p>;

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "N/A";
    return `${value.toLocaleString("en-US")} VND`;
  };

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0 }}>
          <span style={{ fontWeight: 300, color: "#666" }}>Details for:</span>{" "}
          **{vehicle.modelName}** ({vehicle.modelCode})
        </Title>
      }
      style={{
        width: "100%",
        margin: "0 auto",
        padding: 0,
        borderRadius: 12,
        boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
      }}
      bodyStyle={{ padding: 24 }}
    >
      <Row gutter={[32, 24]} align="stretch">
        {/* =================================================== */}
        {/* COLUMN 1 (10): IMAGE, VERSION & PRICING & COLOR */}
        {/* =================================================== */}
        <Col span={10}>
          {/* FRAME CHUNG CHO ẢNH VÀ GIÁ */}
          <Card
            bodyStyle={{ padding: 0 }}
            style={{
              marginBottom: 24,
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #e0e0e0",
            }}
          >
            {/* Image Block */}
            <div style={{ padding: 24, backgroundColor: "#f9f9f9" }}>
              {detailInfo.imgURL ? (
                <img
                  src={detailInfo.imgURL}
                  alt={detailInfo.modelName || "Vehicle image"}
                  style={{
                    width: "100%",
                    maxHeight: 400,
                    objectFit: "contain",
                    borderRadius: 8,
                  }}
                  onError={(e) =>
                    (e.currentTarget.src = "/images/no-image.png")
                  }
                />
              ) : (
                <div
                  style={{
                    height: 350,
                    background: "#e0e0e0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#666",
                    fontSize: 18,
                  }}
                >
                  No Image Available
                </div>
              )}
            </div>

            {/* ✅ VERSION & PRICING */}
            <div
              style={{
                padding: 16,
                borderTop: "1px solid #e8e8e8",
                backgroundColor: "#fff",
              }}
            >
              <Row gutter={16} align="middle">
                <Col flex="1 1 50%">
                  <Text type="" style={{ fontSize: 14 }}>
                    Version:
                  </Text>
                  <Title
                    level={4}
                    style={{
                      margin: 0,
                      color: "#000",
                      fontWeight: 700,
                      lineHeight: 1.2,
                      textAlign: "left",
                    }}
                  >
                    {detailInfo.versionName}
                  </Title>
                </Col>

                <Col flex="1 1 50%">
                  <Text type="" style={{ fontSize: 14 }}>
                    Final Price:
                  </Text>
                  <Title
                    level={4}
                    style={{
                      margin: 0,
                      color: "#000",
                      fontWeight: 700,
                      lineHeight: 1.2,
                      textAlign: "left",
                    }}
                  >
                    {formatCurrency(detailInfo.finalPrice)}
                  </Title>
                </Col>
              </Row>
            </div>
          </Card>

          {/* COLOR DETAILS */}
          <Card size="small" title="Color Details" style={{ borderRadius: 12 }}>
            <Descriptions column={1} size="small" layout="horizontal">
              <Descriptions.Item label="Color Name">
                <span
                  style={{
                    display: "inline-block",
                    width: "16px",
                    height: "16px",
                    backgroundColor: colorSpecs?.hexColor || "#ccc",
                    border: "1px solid #ccc",
                    marginRight: "8px",
                    verticalAlign: "middle",
                    borderRadius: "4px",
                  }}
                ></span>
                {detailInfo.colorName || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Hex Code">
                {colorSpecs?.hexColor || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={colorSpecs?.status === "active" ? "green" : "red"}>
                  {colorSpecs?.status || "N/A"}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* =================================================== */}
        {/* COLUMN 2 (14): TECHNICAL SPECIFICATIONS */}
        {/* =================================================== */}
        <Col span={14}>
          <Title level={4} style={{ marginBottom: 16 }}>
            Technical Specifications
          </Title>

          {/* BLOCK 1: MODEL SPECIFICATIONS */}
          <Card
            title="1. Model Specifications"
            bordered={false}
            style={{ marginBottom: 24 }}
          >
            <Descriptions
              bordered
              size="middle"
              column={2}
              labelStyle={{ fontWeight: 500, width: "160px" }}
            >
              <Descriptions.Item label="Category">
                {vehicle.category}
              </Descriptions.Item>

              <Descriptions.Item label="Battery Capacity">
                {vehicle.batteryCapacity} kWh
              </Descriptions.Item>
              <Descriptions.Item label="Range (km)">
                {vehicle.rangeKm} km
              </Descriptions.Item>
              <Descriptions.Item label="Motor Power">
                {vehicle.motorPower} kW
              </Descriptions.Item>
              <Descriptions.Item label="Charging Time">
                {vehicle.chargingTime} kW
              </Descriptions.Item>
              <Descriptions.Item label="Seats">
                {vehicle.seats}
              </Descriptions.Item>
              <Descriptions.Item label="Model Code">
                {vehicle.modelCode}
              </Descriptions.Item>
              <Descriptions.Item label="Model Status">
                <Tag color={vehicle.status === "active" ? "green" : "red"}>
                  {vehicle.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* BLOCK 2: VERSION DETAILS */}
          <Card
            title={`2. Version Details: ${detailInfo.versionName}`}
            bordered={false}
            style={{ marginBottom: 24 }}
          >
            <Descriptions bordered size="middle" column={2}>
              <Descriptions.Item label="Version Code">
                {versionSpecs?.versionCode || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Version Status">
                <Tag
                  color={versionSpecs?.status === "active" ? "green" : "red"}
                >
                  {versionSpecs?.status || "N/A"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Feature Description" span={2}>
                <Text type="">
                  {versionSpecs?.featuresDescription ||
                    "No detailed feature description available."}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* =================================================== */}
      {/* ACTION BUTTONS (Bottom Right) */}
      {/* =================================================== */}
      <div style={{ marginTop: 20, textAlign: "right" }}>
        <Button
          type="primary"
          size="large"
          onClick={handleOpenCompareModal}
        >
          Compare with Other Details
        </Button>
      </div>

      {/* COMPARE MODAL */}
      <Modal
        title={<Title level={4}>Select Vehicle Detail to Compare</Title>}
        open={compareModalVisible}
        onCancel={() => setCompareModalVisible(false)}
        onOk={handleConfirmCompare}
        okText="Compare"
        cancelText="Cancel"
      >
        <Text style={{ marginBottom: 8, display: 'block' }}>Search and select a vehicle detail:</Text>
        <Select
          showSearch // Bật ô tìm kiếm
          placeholder="Search by Model Name, Version, Color, or Detail Code"
          style={{ width: "100%" }}
          value={selectedCompareVehicleId}
          onChange={setSelectedCompareVehicleId}
          filterOption={filterVehicleOption} // Sử dụng hàm lọc tùy chỉnh
        >
          {allVehicles
            .filter((v) => v.id !== detailId)
            .map((v) => (
              <Select.Option key={v.id} value={v.id} item={v}>
                **{v.modelName}** ({v.versionName} - {v.colorName})
              </Select.Option>
            ))}
        </Select>
      </Modal>
    </Card>
  );
};

export default VehicleDetail;