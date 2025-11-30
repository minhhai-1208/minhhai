import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Button,
  Form,
  Input,
  Select,
  Tag,
  Popconfirm,
  Drawer,
  Row,
  Col,
  Tooltip,
} from "antd";
import { toast } from "react-toastify";
import { useSelector } from "react-redux"; // 🆕 1. Import useSelector
import {
  fetchVehicleVersions,
  postVehicleVersions,
  putVehicleVersions,
  removeVehicleVersions,
} from "../../../services/vehicle-versions.api";
import { fetchVehicles } from "../../../services/vehicle.api";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CarOutlined,
  TagOutlined,
  BookOutlined,
  EyeOutlined, // 🆕 Import icon xem chi tiết
} from "@ant-design/icons";

const VehicleVersions = () => {
  const [versions, setVersions] = useState([]);
  const [filteredVersions, setFilteredVersions] = useState([]);
  const [models, setModels] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 8,
  });
  const [searchText, setSearchText] = useState("");

  // 🆕 2. Lấy Role từ Redux và kiểm tra quyền
  const { role } = useSelector((state) => state.account);
  // Chỉ Admin mới được phép Thêm/Sửa/Xóa
  const canEdit = ["admin"].includes(role?.toLowerCase());

  // --- LOAD DATA ---
  const loadVehicleVersions = async () => {
    setLoading(true);
    try {
      const res = await fetchVehicleVersions();
      const data = Array.isArray(res.data) ? res.data : [];
      setVersions(data);
      setFilteredVersions(data);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching vehicle versions!");
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleModels = async () => {
    try {
      const modelsData = await fetchVehicles();
      const dataArray = Array.isArray(modelsData) ? modelsData : [];
      const options = dataArray.map((model) => ({
        value: model.id,
        label: model.modelName,
      }));
      setModels(options);
    } catch (err) {
      console.error("Error fetching vehicle models:", err);
    }
  };

  useEffect(() => {
    loadVehicleVersions();
    loadVehicleModels();
  }, []);

  // --- SEARCH REALTIME ---
  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredVersions(versions);
      return;
    }
    const filtered = versions.filter(
      (v) =>
        v.versionName.toLowerCase().includes(value.toLowerCase()) ||
        v.versionCode.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredVersions(filtered);
  };

  // --- CRUD LOGIC ---
  const handleSubmit = async (values) => {
    try {
      const finalValues = {
        ...values,
        modelId: Number(values.modelId),
        versionName: values.versionName?.trim(),
        versionCode: values.versionCode?.trim(),
        featuresDescription: values.featuresDescription?.trim() || "",
        status: values.status || "active",
      };

      if (editingVersion) {
        await putVehicleVersions({ ...finalValues, id: Number(editingVersion.id) });
        toast.success("Vehicle Version updated successfully!");
      } else {
        await postVehicleVersions(finalValues, finalValues.modelId);
        toast.success("Vehicle Version added successfully!");
      }

      handleCloseDrawer();
      loadVehicleVersions();
    } catch (err) {
      console.error("POST/PUT VehicleVersion ERROR:", err.response?.data || err);
      toast.error("Error saving version!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await removeVehicleVersions(id);
      toast.success("Vehicle Version deleted!");
      loadVehicleVersions();
    } catch (err) {
      console.error(err);
      toast.error("Error deleting version!");
    }
  };

  const handleCloseDrawer = () => {
    setOpen(false);
    setEditingVersion(null);
    form.resetFields();
  };

  const getModelLabel = (modelId) => {
    // 1. Tìm kiếm trong danh sách models xem có ai khớp ID không
    const model = models.find((m) => m.value === modelId);
    // 2. Nếu tìm thấy -> Trả về tên (label)
    // 3. Nếu không thấy -> Trả về chuỗi "ID: ..." (Cơ chế dự phòng/fallback)
    return model ? model.label : `ID: ${modelId}`;
  };

  const handleTableChange = (paginationInfo) => {
    setPagination({
      ...pagination,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    });
  };

  const columns = [
    {
      title: "Version",
      dataIndex: "versionName",
      key: "versionName",
      fixed: "left",
      width: 180,
      render: (name, record) => (
        <div className="font-semibold text-base flex flex-col">
          <span className="text-blue-600">{name}</span>
          <Tag color="default" className="mt-1 text-xs text-gray-500">
            {record.versionCode}
          </Tag>
        </div>
      ),
    },
    {
      title: "Model Name",
      dataIndex: "modelId",
      key: "modelId",
      width: 150,
      render: (modelId) => (
        <span className="text-gray-700">{getModelLabel(modelId)}</span>
      ),
    },
    {
      title: "Features Description",
      dataIndex: "featuresDescription",
      key: "featuresDescription",
      width: 300,
      render: (text) => (
        <Tooltip title={text}>
          <span className="truncate block max-w-xs">{text || "No description"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) =>
        status === "active" ? (
          <Tag color="green" className="font-medium">
            ACTIVE
          </Tag>
        ) : (
          <Tag color="volcano" className="font-medium">
            INACTIVE
          </Tag>
        ),
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <div className="flex gap-1 justify-center">
          {/* 🆕 3. Logic hiển thị nút Edit/Delete/View */}
          {canEdit ? (
            <>
              <Tooltip title="Edit">
                <Button
                  type="text"
                  icon={<EditOutlined className="text-blue-500 hover:text-blue-700" />}
                  onClick={() => {
                    setEditingVersion(record);
                    form.setFieldsValue(record);
                    setOpen(true);
                  }}
                />
              </Tooltip>
              <Popconfirm
                title="Are you sure delete this version?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Tooltip title="Delete">
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined className="hover:text-red-700" />}
                  />
                </Tooltip>
              </Popconfirm>
            </>
          ) : (
            // Nếu không có quyền -> Chỉ hiện nút View
            <Tooltip title="View Details">
              <Button
                type="text"
                icon={<EyeOutlined className="text-gray-500 hover:text-blue-500" />}
                onClick={() => {
                  setEditingVersion(record);
                  form.setFieldsValue(record);
                  setOpen(true);
                }}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6 gap-2">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <CarOutlined className="mr-3 text-blue-600" />
          Vehicle Version Management
        </h1>

        <div className="flex gap-2">
          <Input
            placeholder="Search by Version Name or Code"
            allowClear
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
          />
          
          {/* 🆕 4. Ẩn nút Add nếu không có quyền */}
          {canEdit && (
            <Button
              type="primary"
              size="large"
              className="bg-blue-600 hover:bg-blue-700 font-semibold flex items-center gap-1 shadow-md"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                setEditingVersion(null);
                setOpen(true);
                form.setFieldsValue({ status: "active" });
              }}
            >
              Add New Version
            </Button>
          )}
        </div>
      </div>

      <Card className="shadow-xl rounded-xl" loading={loading}>
        <Table
          columns={columns}
          dataSource={filteredVersions}
          rowKey="id"
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      {/* Drawer form */}
      <Drawer
        title={
          <span className="text-xl font-bold text-gray-800">
             {/* Đổi title dựa trên quyền và hành động */}
            {!canEdit ? "View Details: " : (editingVersion ? "Edit Version: " : "Create New Version")}
            <span className="text-blue-600 ml-2">
              {editingVersion?.versionName || ""}
            </span>
          </span>
        }
        width={500}
        open={open}
        onClose={handleCloseDrawer}
        maskClosable={false}
        destroyOnClose
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseDrawer} size="large">
              {canEdit ? "Cancel" : "Close"}
            </Button>
            
            {/* 🆕 5. Ẩn nút Save nếu không có quyền */}
            {canEdit && (
                <Button
                onClick={form.submit}
                type="primary"
                size="large"
                className="bg-blue-600 font-semibold"
                >
                {editingVersion ? "Save Changes" : "Create Version"}
                </Button>
            )}
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: "active" }}
          className="p-4 bg-white rounded-lg"
          disabled={!canEdit} // 🆕 6. Disable form nếu là chế độ View Only
        >
          {editingVersion && (
            <Form.Item name="id" hidden>
              <Input type="hidden" />
            </Form.Item>
          )}

          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
            Version Details
          </h3>

          <Form.Item
            label="Vehicle Model"
            name="modelId"
            rules={[{ required: true, message: "Please select vehicle model" }]}
          >
            <Select placeholder="Select Model" options={models} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Version Code"
                name="versionCode"
                rules={[{ required: true, message: "Please enter version code" }]}
              >
                <Input prefix={<TagOutlined />} placeholder="e.g. V001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Version Name"
                name="versionName"
                rules={[{ required: true, message: "Please enter version name" }]}
              >
                <Input placeholder="e.g. Cao cấp" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Features Description" name="featuresDescription">
            <Input.TextArea
              prefix={<BookOutlined />}
              rows={3}
              placeholder="Describe main features"
            />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select
              placeholder="Select current status"
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default VehicleVersions;