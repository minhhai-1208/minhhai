import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Tag,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Form,
  Table,
  Button,
  Modal,
  Card,
  message,
  Spin,
  Space, // Import Space để căn chỉnh Search và Title
} from "antd";
import {
  EditOutlined,
  CarOutlined,
  CalendarOutlined,
  SearchOutlined, // Import SearchOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";

import {
  fetchVehicleInventories,
  putVehicleInventories,
} from "../../../service/vehicle-inventories.api";
import { getVehicleDetailById } from "../../../service/vehicle-details.api";

// --- STATUS CONFIGURATION ---
const STATUS_MAP = {
  in_stock: { color: "green", text: "In Stock" },
  sold: { color: "red", text: "Sold" },
  in_transit: { color: "blue", text: "In Transit" },
  maintenance: { color: "gold", text: "Under Maintenance" },
  hold: { color: "purple", text: "On Hold" },
  reserved: { color: "magenta", text: "Reserved" },
  available: { color: "cyan", text: "Available" },
  active: { color: "lime", text: "Active" },
};

const VehicleStatusOptions = Object.keys(STATUS_MAP).map((key) => (
  <Select.Option key={key} value={key}>
    {STATUS_MAP[key].text}
  </Select.Option>
));

const { Search } = Input; // Destructuring Search component

export default function VehicleInventoryManager() {
  const [form] = Form.useForm();
  const [data, setData] = useState([]); // Dữ liệu gốc
  const [filteredData, setFilteredData] = useState([]); // ✅ Dữ liệu đã lọc (dùng cho Table)
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchText, setSearchText] = useState(""); // ✅ State cho chuỗi tìm kiếm

  const account = useSelector((state) => state.account);
  const currentDealerId = Number(account?.dealerId);

  // --- HÀM LỌC DỮ LIỆU (LIVE SEARCH) ---
  const handleSearch = useCallback(
    (value) => {
      setSearchText(value);
      const lowerCaseValue = value.toLowerCase();

      if (!lowerCaseValue) {
        setFilteredData(data);
        return;
      }

      const filtered = data.filter((item) => {
        return (
          item.vinNumber?.toLowerCase().includes(lowerCaseValue) ||
          item.modelName?.toLowerCase().includes(lowerCaseValue) ||
          item.versionName?.toLowerCase().includes(lowerCaseValue) ||
          item.colorName?.toLowerCase().includes(lowerCaseValue) ||
          item.chassisNumber?.toLowerCase().includes(lowerCaseValue) ||
          item.engineNumber?.toLowerCase().includes(lowerCaseValue)
        );
      });

      setFilteredData(filtered);
    },
    [data]
  ); // Phụ thuộc vào `data` gốc

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    if (!currentDealerId) {
      message.error("Dealer ID not found. Unable to fetch vehicle data.");
      return;
    }

    try {
      setLoading(true);
      const inventoryRes = await fetchVehicleInventories();
      const rawInventoryData = inventoryRes.data;

      const filteredInventory = rawInventoryData.filter(
        (item) => Number(item.dealerId) === currentDealerId
      );

      const detailPromises = filteredInventory.map(async (item) => {
        if (item.vehicleDetailId) {
          try {
            const detailRes = await getVehicleDetailById(item.vehicleDetailId);
            return { ...item, ...detailRes.data, status: item.status };
          } catch (detailError) {
            console.error(
              `Failed to fetch detail for ID ${item.vehicleDetailId}:`,
              detailError
            );
            return item;
          }
        }
        return item;
      });

      const enrichedData = await Promise.all(detailPromises);
      setData(enrichedData);
      setFilteredData(enrichedData); // ✅ Khởi tạo dữ liệu lọc
      message.success("Vehicle inventory data loaded successfully!");
    } catch (err) {
      console.error(err);
      message.error(
        `Failed to load vehicle list! Error: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  }, [currentDealerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Re-filter khi dữ liệu gốc thay đổi ---
  useEffect(() => {
    handleSearch(searchText);
  }, [data, handleSearch, searchText]);

  // --- FORM HANDLING ---
  const handleEdit = (record) => {
    setIsEditing(true);
    const processedRecord = {
      ...record,
      manufacturingDate: record.manufacturingDate
        ? dayjs(record.manufacturingDate)
        : null,
      receivedDate: record.receivedDate ? dayjs(record.receivedDate) : null,
      soldDate: record.soldDate ? dayjs(record.soldDate) : null,
      status: record.status?.toLowerCase() || "in_stock",
    };
    form.setFieldsValue(processedRecord);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setIsEditing(false);
  };

  const handleSubmit = async (inputValues) => {
    if (!currentDealerId) {
      message.error("Dealer ID not available for submission.");
      return;
    }

    try {
      setLoading(true);
      const values = { ...inputValues };

      values.manufacturingDate =
        values.manufacturingDate?.format("YYYY-MM-DD") || null;
      values.receivedDate = values.receivedDate?.format("YYYY-MM-DD") || null;
      values.soldDate = values.soldDate?.format("YYYY-MM-DD") || null;
      values.wholesalePrice = Number(values.wholesalePrice || 0);
      values.retailPrice = Number(values.retailPrice || 0);
      values.status = values.status?.toLowerCase();

      if (!values.id) {
        message.error("Cannot save: Vehicle ID is missing for update.");
        setLoading(false);
        return;
      }

      await putVehicleInventories(values);
      message.success(`Vehicle VIN ${values.vinNumber} updated successfully!`);
      handleCancel();
      await fetchData();
    } catch (err) {
      console.error(err);
      message.error(
        `Save failed! Error: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // --- TABLE CONFIGURATION ---
  const columns = useMemo(
    () => [
      {
        title: "No.",
        key: "no",
        width: 60,
        align: "center",
        render: (_, __, index) => index + 1,
      },
      {
        title: "Vehicle Identifiers",
        key: "identifiers",
        width: 200,
        render: (_, record) => (
          <div className="text-sm">
            <p className="font-semibold text-gray-700 m-0">
              - {record.vinNumber}
            </p>
            <p className="font-semibold text-gray-700 m-0">
              - {record.chassisNumber}
            </p>
            <p className="font-semibold text-gray-700 m-0">
              - {record.engineNumber}
            </p>
          </div>
        ),
      },
      {
        title: "Model / Version",
        key: "model_version",
        width: 170,
        render: (_, record) => (
          <div>
            <span className="font-semibold text-indigo-700">
              {record.modelName || "N/A"}
            </span>
            <br />
            <span className="text-sm text-gray-500">
              {record.versionName || "N/A"}
            </span>
          </div>
        ),
      },
      {
        title: "Color",
        dataIndex: "colorName",
        key: "colorName",
        align: "center",
        render: (color) => <Tag color="blue">{color || "N/A"}</Tag>,
      },
      {
        title: "Retail Price",
        dataIndex: "retailPrice",
        key: "retailPrice",
        align: "right",
        sorter: (a, b) => a.retailPrice - b.retailPrice,
        render: (value) => (
          <span className="font-bold text-red-600">
            {value?.toLocaleString("vi-VN")} VND
          </span>
        ),
      },
      {
        title: "Wholesale Price",
        dataIndex: "wholesalePrice",
        key: "wholesalePrice",
        align: "right",
        sorter: (a, b) => a.wholesalePrice - b.wholesalePrice,
        render: (value) => (
          <span className="font-semibold text-orange-600">
            {value?.toLocaleString("vi-VN")} VND
          </span>
        ),
      },
      {
        title: "Received Date",
        dataIndex: "receivedDate",
        key: "receivedDate",
        align: "center",
        render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "N/A"),
      },
      {
        title: "Inventory Status",
        dataIndex: "status",
        key: "status",
        align: "center",
        render: (status) => {
          const key = status?.toLowerCase();
          const cfg = STATUS_MAP[key] || {
            color: "default",
            text: status || "Unknown",
          };
          return <Tag color={cfg.color}>{cfg.text}</Tag>;
        },
      },
      {
        title: "Actions",
        key: "action",
        align: "center",
        render: (_, record) => (
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            className="text-blue-500 hover:text-blue-700"
          >
            Edit
          </Button>
        ),
      },
    ],
    []
  );

  // --- FORM ITEMS ---
  const vehicleFormItems = (
    <>
      <Form.Item name="id" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="dealerId" hidden>
        <InputNumber />
      </Form.Item>

      <Form.Item
        label="Vehicle Detail ID (Model/Color)"
        name="vehicleDetailId"
        rules={[
          { required: true, message: "Please provide a valid detail ID!" },
        ]}
      >
        <InputNumber disabled style={{ width: "100%" }} />
      </Form.Item>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Form.Item label="VIN Number" name="vinNumber">
          <Input disabled />
        </Form.Item>
        <Form.Item label="Chassis Number" name="chassisNumber">
          <Input disabled />
        </Form.Item>
        <Form.Item label="Engine Number" name="engineNumber">
          <Input disabled />
        </Form.Item>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Form.Item label="Status" name="status" rules={[{ required: true }]}>
          <Select placeholder="Select status">{VehicleStatusOptions}</Select>
        </Form.Item>
        <Form.Item label="Manufacturing Date" name="manufacturingDate">
          <DatePicker
            disabled
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            suffixIcon={<CalendarOutlined />}
          />
        </Form.Item>
        <Form.Item label="Received Date" name="receivedDate">
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            suffixIcon={<CalendarOutlined />}
          />
        </Form.Item>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item
          label="Wholesale Price"
          name="wholesalePrice"
          rules={[{ required: true }]}
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            formatter={(v) =>
              `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VND"
            }
            parser={(v) => v.replace(/\s?VND|(,*)/g, "")}
          />
        </Form.Item>
        <Form.Item
          label="Retail Price"
          name="retailPrice"
          rules={[{ required: true }]}
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            formatter={(v) =>
              `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VND"
            }
            parser={(v) => v.replace(/\s?VND|(,*)/g, "")}
          />
        </Form.Item>
      </div>

      <Form.Item label="Sold Date" name="soldDate">
        <DatePicker
          style={{ width: "100%" }}
          format="DD/MM/YYYY"
          suffixIcon={<CalendarOutlined />}
        />
      </Form.Item>
    </>
  );

  // --- RENDER ---
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <Card
        title={
          <div className="flex items-center space-x-2">
            <CarOutlined className="text-2xl text-blue-600" />
            <span className="text-xl font-bold text-gray-800">
              Vehicle Inventory Management (Dealer: {currentDealerId || "N/A"})
            </span>
          </div>
        }
        extra={
          // ✅ Tích hợp Search Component vào phần extra
          <Space>
            <Search
              placeholder="Search by VIN, Model, Version or Color"
              allowClear
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 350 }}
            />
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredData} // ✅ Sử dụng dữ liệu đã lọc
            rowKey="id"
            pagination={{ pageSize: 8 }}
          />
        </Spin>

        <Modal
          title="Edit Vehicle Information"
          open={isModalOpen}
          onCancel={handleCancel}
          onOk={() => form.submit()}
          okText="Save Changes"
          cancelText="Cancel"
          confirmLoading={loading}
          width={800}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {vehicleFormItems}
          </Form>
        </Modal>
      </Card>
    </div>
  );
}
