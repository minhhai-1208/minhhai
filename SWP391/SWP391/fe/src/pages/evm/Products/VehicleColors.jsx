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
  Drawer,
  Row,
  Col,
  Tooltip,
} from "antd";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux"; // 🆕 1. Import useSelector
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FontSizeOutlined,
  BgColorsOutlined,
  EyeOutlined, // 🆕 Import icon View
} from "@ant-design/icons";
import {
  fetchVehicleColors,
  postVehicleColors,
  putVehicleColors,
  removeVehicleColors,
} from "../../../services/vehicle-colors.api";

const VehicleColors = () => {
  const [colors, setColors] = useState([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [editingColor, setEditingColor] = useState(null);

  // 🆕 2. Lấy Role từ Redux
  const { role } = useSelector((state) => state.account);
  // Chỉ Admin mới được Sửa/Xóa
  const canEdit = ["admin"].includes(role?.toLowerCase());

  // --- Load dữ liệu ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first!");
      navigate("/login");
      return;
    }
    loadColors();
  }, [navigate]);

  const loadColors = async () => {
    try {
      const res = await fetchVehicleColors();
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setColors(list);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching colors!");
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingColor) await putVehicleColors(values);
      else await postVehicleColors(values);
      
      toast.success("Saved successfully!");
      setOpen(false);
      setEditingColor(null);
      form.resetFields();
      loadColors();
    } catch (err) {
      console.error(err);
      toast.error("Error saving color!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await removeVehicleColors(id);
      toast.success("Deleted successfully!");
      loadColors();
    } catch (err) {
      console.error(err);
      toast.error("Error deleting color!");
    }
  };
  
  const handleEdit = (record) => {
    setEditingColor(record);
    form.setFieldsValue(record);
    setOpen(true);
  };
  
  const handleCloseDrawer = () => {
    setOpen(false);
    setEditingColor(null);
    form.resetFields();
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Color Name", dataIndex: "colorName", key: "colorName" },
    { title: "Color Code", dataIndex: "colorCode", key: "colorCode" },
    { 
      title: "Hex Color", 
      dataIndex: "hexColor", 
      key: "hexColor", 
      width: 150,
      render: (hex) => (
        <div className="flex items-center gap-3">
          <div 
            style={{ backgroundColor: hex || '#fff', width: 60, height: 25, borderRadius: 4, border: "1px solid #ccc" }} 
            className="shadow-sm"
          />
          <span className="font-mono text-gray-600 uppercase text-sm">{hex}</span>
        </div>
      ) 
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"} className="font-medium">
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
                  icon={<EditOutlined className="text-blue-500 hover:text-blue-700" />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
              <Popconfirm title="Delete this color?" onConfirm={() => handleDelete(record.id)}>
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
            // Nếu không có quyền -> Chỉ hiện View
            <Tooltip title="View Details">
               <Button 
                  type="text" 
                  icon={<EyeOutlined className="text-gray-500 hover:text-blue-500" />} 
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <BgColorsOutlined className="mr-3 text-blue-600" />
          Vehicle Color Management
        </h1>
        
        {/* 🆕 4. Ẩn nút Add nếu không có quyền */}
        {canEdit && (
          <Button
            type="primary"
            size="large"
            className="bg-blue-600 hover:bg-blue-700 font-semibold flex items-center gap-1 shadow-md"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setEditingColor(null);
              setOpen(true);
            }}
          >
            Add New Color
          </Button>
        )}
      </div>
      
      <Card className="shadow-xl rounded-xl">
        <Table 
          dataSource={colors} 
          columns={columns} 
          rowKey="id" 
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Drawer */}
      <Drawer
        title={
          <span className="text-xl font-bold text-gray-800">
            {/* Đổi title dựa trên quyền */}
            {!canEdit ? "View Details: " : (editingColor ? "Edit Color: " : "Add New Color")}
            <span className="text-blue-600 ml-2">{editingColor?.colorName || ''}</span>
          </span>
        }
        width={400}
        open={open}
        onClose={handleCloseDrawer}
        maskClosable={false}
        destroyOnClose={true}
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
                {editingColor ? 'Save Changes' : 'Create Color'}
              </Button>
            )}
          </div>
        }
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleSubmit}
          className="p-4 bg-white rounded-lg"
          disabled={!canEdit} // 🆕 6. Disable form nếu View Only
        >
          <Form.Item name="id" hidden><Input /></Form.Item>
          
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Color Details</h3>

          <Form.Item 
            label="Color Name" 
            name="colorName" 
            rules={[{ required: true, message: "Please enter color name" }]}
          >
            <Input placeholder="e.g. White Pearl" prefix={<FontSizeOutlined />} />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Color Code" 
                name="colorCode" 
                rules={[{ required: true, message: "Please enter color code" }]}
              >
                <Input placeholder="e.g. C001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Hex Color" 
                name="hexColor" 
                rules={[{ required: true, message: "Please enter hex color" }]}
              >
                <Input type="color" className="p-1 h-10" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            label="Status" 
            name="status" 
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select options={[
              { value: "active", label: "Active" }, 
              { value: "inactive", label: "Inactive" }
            ]} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default VehicleColors;