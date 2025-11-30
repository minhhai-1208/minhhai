import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Tag,
  Form,
  Input,
  Select,
  Popconfirm,
  Card,
  Row,
  Col,
  Drawer,
  InputNumber,
  Tooltip,
  Upload,
} from "antd";
import { toast } from "react-toastify";
import { useSelector } from "react-redux"; // 🆕 1. Import useSelector
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
  DollarOutlined,
  UploadOutlined,
  EyeOutlined, // 🆕 Import icon View
} from "@ant-design/icons";
import {
  fetchVehicleDetails,
  postVehicleDetail,
  putVehicleDetail,
  removeVehicleDetail,
} from "../../../services/vehicle-detail.api";
import { fetchVehicles } from "../../../services/vehicle.api";
import { fetchVehicleVersions } from "../../../services/vehicle-versions.api";
import { fetchVehicleColors } from "../../../services/vehicle-colors.api";
import { uploadFile } from "../../../config/supabase";

const VehicleDetailManager = () => {
  const [details, setDetails] = useState([]);
  const [filteredDetails, setFilteredDetails] = useState([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(null);

  const [models, setModels] = useState([]);
  const [versions, setVersions] = useState([]);
  const [colors, setColors] = useState([]);
  const [filteredVersions, setFilteredVersions] = useState([]);

  const [searchText, setSearchText] = useState("");

  // 🆕 2. Lấy Role từ Redux
  const { role } = useSelector((state) => state.account);
  // Chỉ Adminmới được Thêm/Sửa/Xóa
  const canEdit = ["admin"].includes(role?.toLowerCase());

  // --- Chặn nhập số âm hoặc e ---
  const positiveNumberProps = {
    min: 0,
    style: { width: "100%" },
    onKeyDown: (e) => {
      if (["-", "e", "E"].includes(e.key)) e.preventDefault();
    },
    onPaste: (e) => {
      if (e.clipboardData.getData("Text").includes("-")) e.preventDefault();
    },
  };

  // --- LOAD DATA ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [detailRes, modelRes, versionRes, colorRes] = await Promise.all([
        fetchVehicleDetails(),
        fetchVehicles(),
        fetchVehicleVersions(),
        fetchVehicleColors(),
      ]);

      const detailData = detailRes.data || detailRes;
      setDetails(detailData);
      setFilteredDetails(detailData);

      setModels(modelRes.data || modelRes);
      setVersions(versionRes.data || versionRes);
      setColors(colorRes.data || colorRes);
    } catch (err) {
      console.error(err);
      toast.error("Error loading data!");
    }
  };

  // --- Realtime search ---
  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredDetails(details);
      return;
    }

    const filtered = details.filter((d) => {
      return (
        d.detailCode?.toLowerCase().includes(value.toLowerCase()) ||
        d.modelName?.toLowerCase().includes(value.toLowerCase()) ||
        d.versionName?.toLowerCase().includes(value.toLowerCase()) ||
        d.colorName?.toLowerCase().includes(value.toLowerCase())
      );
    });

    setFilteredDetails(filtered);
  };

  // --- CRUD HANDLERS ---
  const handleSubmit = async (values) => {
    try {
      let imgURL = editing?.imgURL || null;

      const fileList = values?.imgURL || [];
      const fileObj = fileList[0]?.originFileObj;

      if (fileObj) {
        imgURL = await uploadFile(fileObj);
        if (!imgURL) throw new Error("Failed to upload image");
      } else if (editing && fileList.length === 0) {
        imgURL = null;
      }

      const payload = {
        id: editing?.id,
        detailCode: values.detailCode,
        modelId: values.modelId,
        versionId: values.versionId,
        colorId: values.colorId,
        finalPrice: Number(values.finalPrice),
        status: values.status,
        imgURL,
      };

      if (editing) {
        await putVehicleDetail(payload);
        toast.success("Updated successfully!");
      } else {
        await postVehicleDetail(payload);
        toast.success("Created successfully!");
      }

      form.resetFields();
      setOpen(false);
      setEditing(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error saving vehicle detail!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await removeVehicleDetail(id);
      toast.success("Deleted successfully!");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error deleting detail!");
    }
  };

  const handleEdit = (record) => {
    const model = (models.data || models).find((m) => m.id === record.modelId);
    const version = (versions.data || versions).find(
      (v) => v.id === record.versionId
    );
    const color = (colors.data || colors).find((c) => c.id === record.colorId);

    const filtered = (versions.data || versions).filter(
      (v) => v.modelId === model?.id
    );
    setFilteredVersions(filtered);

    let fileList = [];
    if (record.imgURL) {
      fileList = [
        {
          uid: record.id,
          name: record.detailCode + ".jpg",
          status: "done",
          url: record.imgURL,
        },
      ];
    }

    form.setFieldsValue({
      id: record.id,
      detailCode: record.detailCode,
      modelId: model?.id ?? null,
      versionId: version?.id ?? null,
      colorId: color?.id ?? null,
      finalPrice: record.finalPrice,
      status: record.status,
      imgURL: fileList,
    });

    setEditing(record);
    setOpen(true);
  };

  const handleCloseDrawer = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const handleModelChange = (modelId) => {
    const filtered = (versions.data || versions).filter(
      (v) => v.modelId === modelId
    );
    setFilteredVersions(filtered);
    form.setFieldsValue({ versionId: null });
  };

  // --- COLUMNS ---
  const columns = [
    {
      title: "Detail Code",
      dataIndex: "detailCode",
      key: "detailCode",
      width: 120,
      render: (code) => (
        <Tag color="blue" className="font-semibold text-sm">
          {code}
        </Tag>
      ),
    },
    {
      title: "Model / Version",
      key: "model_version",
      width: 200,
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="text-gray-800 font-semibold">
            {record.modelName}
          </span>
          <span className="text-gray-500 text-sm">
            {record.versionName || "—"}
          </span>
        </div>
      ),
    },
    {
      title: "Color",
      dataIndex: "colorName",
      key: "colorName",
      width: 120,
      render: (color) => (
        <Tag color="geekblue" icon={<BgColorsOutlined />}>
          {color}
        </Tag>
      ),
    },
    {
      title: "FinalPrice",
      dataIndex: "finalPrice",
      key: "finalPrice",
      width: 140,
      render: (price) => (
        <span className="font-semibold text-green-600">
          <DollarOutlined className="mr-1" />
          {price?.toLocaleString()} đ
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => (
        <Tag
          color={status === "active" ? "green" : "red"}
          className="font-medium"
        >
          {status === "active" ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) => (
        <div className="flex gap-1 justify-center">
          {/* 🆕 3. Phân quyền Action */}
          {canEdit ? (
            <>
              <Tooltip title="Edit">
                <Button
                  type="text"
                  icon={
                    <EditOutlined className="text-blue-500 hover:text-blue-700" />
                  }
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
              <Popconfirm
                title="Delete this detail?"
                onConfirm={() => handleDelete(record.id)}
              >
                <Tooltip title="Delete">
                  <Button
                    type="text"
                    danger
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
                icon={
                  <EyeOutlined className="text-gray-500 hover:text-blue-500" />
                }
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 gap-2">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <AppstoreOutlined className="mr-3 text-blue-600" />
          Vehicle Detail Management
        </h1>

        <div className="flex gap-2">
          <Input
            placeholder="Search by Code, Model, Version, Color"
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
                setEditing(null);
                setOpen(true);
              }}
            >
              Add Vehicle Detail
            </Button>
          )}
        </div>
      </div>

      <Card className="shadow-xl rounded-xl">
        <Table
          dataSource={filteredDetails}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Drawer Form */}
      <Drawer
        title={
          <span className="text-xl font-bold text-gray-800">
            {/* Đổi title dựa trên quyền */}
            {!canEdit
              ? "View Detail: "
              : editing
              ? "Edit Vehicle Detail: "
              : "Create Vehicle Detail"}
            <span className="text-blue-600 ml-2">
              {editing?.detailCode || ""}
            </span>
          </span>
        }
        width={720}
        open={open}
        onClose={handleCloseDrawer}
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
                {editing ? "Save Changes" : "Create Detail"}
              </Button>
            )}
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={!canEdit} // 🆕 6. Disable form nếu View Only
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Detail Code"
                name="detailCode"
                rules={[
                  { required: true, message: "Please enter detail code" },
                ]}
              >
                <Input placeholder="e.g. D001" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Model"
                name="modelId"
                rules={[{ required: true, message: "Please select model" }]}
              >
                <Select
                  placeholder="Select model"
                  onChange={handleModelChange}
                  options={(models.data || models).map((m) => ({
                    value: m.id,
                    label: m.modelName,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Version"
                name="versionId"
                rules={[{ required: true, message: "Please select version" }]}
              >
                <Select
                  placeholder="Select version"
                  options={filteredVersions.map((v) => ({
                    value: v.id,
                    label: v.versionName,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Color"
                name="colorId"
                rules={[{ required: true, message: "Please select color" }]}
              >
                <Select
                  placeholder="Select color"
                  options={(colors.data || colors).map((c) => ({
                    value: c.id,
                    label: c.colorName,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Final Price"
                name="finalPrice"
                rules={[
                  { required: true, message: "Please enter final price" },
                ]}
              >
                <InputNumber
                  {...positiveNumberProps}
                  placeholder="Enter price"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select
              placeholder="Select status"
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Image"
            name="imgURL"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
            rules={[
              {
                required: !editing,
                message: "Please upload an image",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    editing &&
                    getFieldValue("imgURL") &&
                    getFieldValue("imgURL").length > 0
                  ) {
                    return Promise.resolve();
                  }
                  if (
                    !editing &&
                    getFieldValue("imgURL") &&
                    getFieldValue("imgURL").length > 0
                  ) {
                    return Promise.resolve();
                  }
                  if (
                    editing &&
                    getFieldValue("imgURL") &&
                    getFieldValue("imgURL").length === 0
                  ) {
                    return Promise.resolve();
                  }
                  if (!editing) {
                    return Promise.reject(
                      new Error("Please upload an image!")
                    );
                  }
                  return Promise.reject(new Error("Please upload an image!"));
                },
              }),
            ]}
          >
            <Upload
              listType="picture"
              beforeUpload={() => false}
              maxCount={1}
              disabled={!canEdit} // Disable upload nếu View Only
            >
              <Button icon={<UploadOutlined />} disabled={!canEdit}>
                Click to Upload
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default VehicleDetailManager;