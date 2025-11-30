import React from "react";
import ManageTemplate from "../../../components/ManageTemplate";
import { Tag } from "antd";
import { useNavigate } from "react-router-dom";

function VehicleList() {
  const navigate = useNavigate();

  // ==========================================================
  // ✅ CẤU HÌNH BỘ LỌC CHO ManageTemplate
  // ==========================================================
  const filtersConfig = [
    {
      label: "Mẫu Xe (Model)",
      field: "modelName", // Tên trường để lọc trên API
      type: "select",
      // Giả định ManageTemplate có thể tự động lấy danh sách duy nhất (unique list)
      // nếu không, bạn cần thêm prop apiPath cho nó tự fetch options.
    },
    {
      label: "Phiên Bản (Version)",
      field: "versionName",
      type: "select",
    },
    {
      label: "Màu Xe (Color)",
      field: "colorName",
      type: "select",
    },
  ];

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      align: "center",
    },
    {
      title: "Detail Code",
      dataIndex: "detailCode",
      key: "detailCode",
    },
    {
      title: "Model",
      dataIndex: "modelName",
      key: "modelName",
    },
    {
      title: "Version",
      dataIndex: "versionName",
      key: "versionName",
    },
    {
      title: "Color",
      dataIndex: "colorName",
      key: "colorName",
    },
    {
      title: "Final Price (VND)",
      dataIndex: "finalPrice",
      key: "finalPrice",
      align: "right",
      render: (value) =>
        value ? value.toLocaleString("vi-VN") + " VND" : "Price N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status) => (
        <Tag color={status === "ACTIVE" ? "green" : "red"}>
          {status || "UNKNOWN"}
        </Tag>
      ),
    },
  ];

  const handleCardClick = (item) => {
    // ✅ CHỈ TRUYỀN DETAIL ID (item.id)
    navigate(`/dealer/vehicle_detail/${item.id}`);
  };

  return (
    <ManageTemplate
      columns={columns}
      apiURL="vehicle-details"
      viewMode="card"
      onCardClick={handleCardClick}
      filterByDealer={false}
      filters={filtersConfig} // ✅ Truyền cấu hình bộ lọc vào đây
    />
  );
}

export default VehicleList;