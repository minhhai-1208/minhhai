import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Table,
  Row,
  Col,
  Card,
  Empty,
  Select,
  Space,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { toast } from "react-toastify";
import api from "../config/axios";
import { ReloadOutlined } from "@ant-design/icons"; // ✅ Import Icon Reset

// --- GLOBAL CONFIGURATION ---
const CARD_COLUMN_SPAN = { xs: 24, sm: 12, md: 8, lg: 6 };

const ManageTemplate = ({
  columns,
  apiURL,
  formItems,
  viewMode = "table",
  onCardClick,
  filterByDealer = true,
  filters = [],
}) => {
  const [data, setData] = useState([]); // Dữ liệu gốc từ API
  const [filteredData, setFilteredData] = useState([]); // Dữ liệu sau khi lọc (sử dụng cho render)
  const [filtersValue, setFiltersValue] = useState({}); // Lưu trữ giá trị các bộ lọc hiện tại
  const [open, setOpen] = useState(false);
  const [form] = useForm();

  // 🔹 Lấy dealerID từ localStorage (chỉ khi cần lọc)
  let dealerID = null;
  if (filterByDealer) {
    const account = JSON.parse(localStorage.getItem("account")) || {};
    dealerID = Number(account.dealerId);
  }

  // --- HÀM TRÍCH XUẤT UNIQUE OPTIONS ---
  const getUniqueOptions = useCallback((field) => {
    if (!data.length) return [];
    
    const uniqueValues = new Set();
    data.forEach(item => {
      const value = item[field];
      if (value) uniqueValues.add(value);
    });

    return Array.from(uniqueValues).sort().map(value => ({
      value: value,
      label: value,
    }));
  }, [data]);

  // --- HÀM LỌC DỮ LIỆU CHÍNH ---
  const applyFilters = useCallback(() => {
    let currentData = data;

    // Lặp qua tất cả các bộ lọc đã được cấu hình
    filters.forEach(filter => {
      const value = filtersValue[filter.field];
      const fieldName = filter.field;

      if (value) {
        currentData = currentData.filter(item => {
          // Xử lý trường hợp giá trị là chuỗi (select)
          return item[fieldName] === value;
        });
      }
    });

    setFilteredData(currentData);
  }, [data, filters, filtersValue]);

  // 🔹 Lấy dữ liệu và lọc theo dealerID (nếu cần)
  const fetchData = async () => {
    try {
      const res = await api.get(apiURL);
      let loadedData = res.data;

      // 💡 Lọc theo dealerID (nếu bật)
      if (filterByDealer && dealerID) {
        loadedData = loadedData.filter(
          (item) => Number(item.dealerId) === dealerID
        );
      }

      // 💡 Chuẩn hóa trường ảnh (BE trả về imgURL)
      loadedData = loadedData.map((item) => ({
        ...item,
        imageUrl: item.imgURL || item.imageUrl || "", // gán imageUrl = imgURL
      }));

      // ✅ Sắp xếp theo số trong modelName (nếu có)
      const sortedData = loadedData.sort((a, b) => {
        const extractNumber = (name) => {
          if (!name) return 0;
          const match = name.match(/(\d+)$/);
          return match ? parseInt(match[0], 10) : 0;
        };

        const numA = extractNumber(a.modelName);
        const numB = extractNumber(b.modelName);

        return numA - numB;
      });

      setData(sortedData); // Lưu dữ liệu gốc
      setFilteredData(sortedData); // Khởi tạo dữ liệu lọc
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tải dữ liệu!");
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiURL, filterByDealer]);

  // ✅ Kích hoạt lọc mỗi khi filtersValue hoặc data gốc thay đổi
  useEffect(() => {
    applyFilters();
  }, [filtersValue, data, applyFilters]);

  // --- HÀM RESET FILTERS ---
  const handleResetFilters = () => {
    setFiltersValue({});
    // Sau khi reset filtersValue, useEffect sẽ tự động gọi applyFilters()
  };


  // 🔹 Thêm / Sửa
  const handleSubmitForm = async (values) => {
    try {
      if (filterByDealer && dealerID) {
        values.dealerId = dealerID;
      }

      const isEdit = !!values.id;
      const res = isEdit
        ? await api.put(`${apiURL}/${values.id}`, values)
        : await api.post(apiURL, values);

      toast.success(isEdit ? "Cập nhật thành công!" : "Thêm mới thành công!");
      setOpen(false);
      form.resetFields();
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Lưu thất bại!");
    }
  };

  // --- RENDER HÀNG BỘ LỌC VÀ NÚT RESET ---
  const renderFilters = useMemo(() => (
    <Space size="middle" style={{ marginBottom: 20 }}>
      {filters.map((filter) => (
        <Select
          key={filter.field}
          placeholder={`Chọn ${filter.label}`}
          allowClear
          style={{ width: 180 }}
          onChange={(value) => setFiltersValue(prev => ({
            ...prev,
            [filter.field]: value
          }))}
          value={filtersValue[filter.field]}
          options={getUniqueOptions(filter.field)}
        />
      ))}
      {/* ✅ NÚT RESET */}
      {(Object.keys(filtersValue).length > 0) && (
        <Button 
            icon={<ReloadOutlined />} 
            onClick={handleResetFilters}
        >
            Đặt lại
        </Button>
      )}
    </Space>
  ), [filters, filtersValue, getUniqueOptions]);


  return (
    <>
      {/* RENDER BỘ LỌC */}
      {filters.length > 0 && renderFilters}
      
      {viewMode === "table" && (
        <Table
          columns={columns}
          dataSource={filteredData} // ✅ Sử dụng filteredData
          rowKey="id"
          pagination={{ pageSize: 6 }}
        />
      )}

      {viewMode === "card" && (
        <Row gutter={[16, 16]}>
          {filteredData.length === 0 ? ( // ✅ Kiểm tra filteredData
            <Col span={24}>
              <Empty description="Không có dữ liệu phù hợp với bộ lọc" />
            </Col>
          ) : (
            filteredData.map((item) => ( // ✅ Map qua filteredData
              <Col {...CARD_COLUMN_SPAN} key={item.id}>
                <Card
                  hoverable
                  onClick={() => onCardClick && onCardClick(item)}
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                    transition: "transform 0.2s",
                  }}
                  cover={
                    item.imageUrl ? (
                      <img
                        alt={item.modelName}
                        src={item.imageUrl}
                        style={{
                          height: 160,
                          width: "100%",
                          objectFit: "cover", 
                          objectPosition: "center 80%", 
                          backgroundColor: "#fafafa",
                          borderRadius: 8, 
                          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", 
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: 160,
                          backgroundColor: "#f0f0f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#888",
                          fontSize: 14,
                          fontWeight: 500,
                          borderRadius: 8, 
                        }}
                      >
                        NO IMAGE
                      </div>
                    )
                  }
                >
                  {/* ✅ MODEL NAME + COLOR */}
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 18,
                      color: "#000",
                      marginBottom: 6,
                      textAlign: "center",
                    }}
                  >
                    {item.modelName || "Không rõ tên"}{" "}
                    {item.colorName && (
                      <span style={{ fontWeight: 500, color: "#333" }}>
                        ({item.colorName})
                      </span>
                    )}
                  </div>

                  {/* ✅ FINAL PRICE */}
                  <div
                    style={{
                      textAlign: "center",
                      color: "#1890ff",
                      fontSize: 16,
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    {item.finalPrice
                      ? item.finalPrice.toLocaleString("vi-VN") + " VND"
                      : "Chưa có giá"}
                  </div>

                  {/* ✅ VERSION */}
                  <div
                    style={{ textAlign: "center", color: "#666", fontSize: 14 }}
                  >
                    {item.versionName || "Không rõ loại"}
                  </div>
                </Card>
              </Col>
            ))
          )}
        </Row>
      )}

      <Modal
        title="Thông tin"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText="Lưu"
        cancelText="Huỷ"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitForm}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          {formItems}
        </Form>
      </Modal>
    </>
  );
};

export default ManageTemplate;