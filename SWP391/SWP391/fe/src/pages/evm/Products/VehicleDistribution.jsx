import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Popconfirm,
  Tag,
  Drawer,
  Tooltip,
  Row,
  Col,
  InputNumber,
  Space,
} from "antd";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SendOutlined,
  FieldTimeOutlined,
  TruckOutlined,
  DollarOutlined,
  CarOutlined,
} from "@ant-design/icons";
import {
  fetchVehicleDistributions,
  postVehicleDistribution,
  putVehicleDistribution,
  removeVehicleDistribution,
  updateDistributionStatus,
  completeVehicleDistribution,
} from "../../../services/vehicle-distribution.api";
import { fetchDealers } from "../../../services/dealer.api";
import { fetchVehicleInventories } from "../../../services/vehicle-inventories.api";
//import { fetchVehiclesToDistribute } from "../../../services/order.api";

// --- Hàm hỗ trợ format (Giữ nguyên) ---
const formatDateValue = (value) =>
  value ? dayjs(value).format("YYYY-MM-DD") : null;
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "0 VND";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

const VehicleDistribution = () => {
  // --- STATE MANAGEMENT ---
  const [distributions, setDistributions] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedDealerId, setSelectedDealerId] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [statusForm] = Form.useForm();
  const [form] = Form.useForm();

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

  // --- LOGIC & DATA LOADING ---
  const loadDistributions = async (
    page = currentPage,
    limit = pageSize,
    dealerId = selectedDealerId
  ) => {
    setLoading(true);
    try {
      const params = {};
      if (dealerId !== null && dealerId !== undefined) {
        params.dealerId = dealerId;
      }

      const res = await fetchVehicleDistributions(params);
      const listData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.content || [];
      let filteredData = listData;
      let total = listData.length;

      if (dealerId !== null && dealerId !== undefined) {
        filteredData = listData.filter((item) => item.toDealerId === dealerId);
        total = filteredData.length;
      }

      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedData = filteredData.slice(start, end);

      setDistributions(paginatedData);
      setTotalRecords(total);
      setCurrentPage(page);
    } catch (err) {
      console.error(
        "Error fetching vehicle distributions:",
        err.response?.data || err
      );
      toast.error("Error fetching vehicle distributions!");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const dealersRes = await fetchDealers();
      const inventoryRes = await fetchVehicleInventories();

      const dealerOptions = (dealersRes.data || []).map((d) => ({
        value: d.id,
        label: d.dealerName,
      }));

      // Lọc Inventory chỉ lấy xe Kho Trung tâm
      const availableCentralInventories = (inventoryRes.data || [])
        .filter(
          (i) =>
            (i.status === "in_stock" || i.status === "available") &&
            (i.dealerId === null || i.dealerId === undefined)
        )
        .map((i) => {
          const modelName = i.vehicleDetail?.model?.modelName;
          const vin = i.vinNumber || `ID: ${i.id}`;
          const location = "Kho trung tâm";

          let label = `VIN: ${vin} (${location})`;
          if (modelName) {
            label = `${modelName} - ${label}`;
          }

          return {
            value: i.id,
            label: label,
          };
        });

      setDealers(dealerOptions);
      setInventories(availableCentralInventories);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDistributions(currentPage, pageSize, selectedDealerId);
    if (dealers.length === 0) loadData();
  }, [currentPage, pageSize, selectedDealerId]);

  const handleTableChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleDealerFilterChange = (value) => {
    setCurrentPage(1);
    setSelectedDealerId(value === undefined ? null : value);
  };

  const getDealerLabel = (dealerId) => {
    const dealer = dealers.find((d) => d.value === dealerId);
    return dealer ? dealer.label : `D-ID ${dealerId}`;
  };

  // --- LOGIC TRẠNG THÁI ---

  const getValidNextStatuses = (currentStatus) => {
    if (!currentStatus) return [];
    switch (currentStatus) {
      case "pending":
      case "confirmed":
      case "active":
        return [
          { value: "in_transit", label: "In Transit" },
          { value: "delayed", label: "Delayed" },
          { value: "cancelled", label: "Cancelled" },
        ];
      case "in_transit":
        return [
          { value: "delayed", label: "Delayed" },
          { value: "cancelled", label: "Cancelled" },
        ];
      case "delayed":
        return [
          { value: "in_transit", label: "In Transit" },
          { value: "cancelled", label: "Cancelled" },
        ];
      case "delivered":
      case "completed":
      case "cancelled":
        return []; // Trạng thái cuối/hoàn tất
      default:
        return [];
    }
  };

  const openStatusModal = (record) => {
    if (record.status === "delivered" || record.status === "completed") {
      toast.info(
        `Trạng thái ${record.status.toUpperCase()} là trạng thái cuối cùng.`
      );
      return;
    }

    if (getValidNextStatuses(record.status).length === 0) {
      toast.info(`Status ${record.status.toUpperCase()} cannot be changed.`);
      return;
    }
    setSelectedRecord(record);
    setStatusModalOpen(true);
    statusForm.setFieldsValue({
      id: record.id,
      currentStatus: record.status,
      newStatus: undefined,
    });
  };

  const handleStatusSubmit = async (values) => {
    try {
      await updateDistributionStatus(values.id, values.newStatus);
      toast.success(`Status updated to ${values.newStatus.toUpperCase()}!`);
      setStatusModalOpen(false);  
      setSelectedRecord(null);
      statusForm.resetFields();
      loadDistributions(currentPage, pageSize, selectedDealerId);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to change status. Check transition rules.";
      toast.error(`Error: ${errorMessage}`);
    }
  };

  // const handleAction = async (id, newStatus) => {
  //   try {
  //     await updateDistributionStatus(id, newStatus);
  //     toast.success(
  //       `Distribution status updated to ${newStatus.toUpperCase()}!`
  //     );
  //     loadDistributions(currentPage, pageSize, selectedDealerId);
  //   } catch (err) {
  //     const errorMessage =
  //       err.response?.data?.message ||
  //       `Failed to change status to ${newStatus}.`;
  //     toast.error(`Error: ${errorMessage}`);
  //   }
  // };

  // const handleApprove = (record) => {
  //   handleAction(record.id, "confirmed");
  // };

  // const handleReject = (record) => {
  //   handleAction(record.id, "cancelled");
  // };

  const handleSubmit = async (values) => {
    try {
      const id = editingRecord?.id;// lấy id nếu đang sửa
      const originalRecord = editingRecord;// lưu bản ghi cũ

      // format ngày tháng
      const distributionDateStr = formatDateValue(values.distributionDate);
      const expectedArrivalStr = formatDateValue(values.expectedArrival);
      const actualArrivalStr = formatDateValue(values.actualArrival);

      //kiểm tra bắt buộc nhập ngày 
      if (!distributionDateStr || !expectedArrivalStr) {
        toast.error("Please fill in required date fields!");
        return;
      }

      const inventoryIdsArray = Array.isArray(values.inventoryIds)
        ? values.inventoryIds.map(Number).filter((n) => !isNaN(n))// Nếu là mảng -> Chuyển thành số hết -> Lọc bỏ cái nào không phải số 
        : values.inventoryIds
        ? [Number(values.inventoryIds)].filter((n) => !isNaN(n))// Nếu là 1 số lẻ -> Nhét vào mảng
        : [];//Nếu rỗng -> Trả về mảng rỗng

      const requiredFields = {
        fromLocation:
          values.fromLocation?.trim() || originalRecord?.fromLocation?.trim(),
        inventoryIds:
          inventoryIdsArray.length > 0
            ? inventoryIdsArray
            : originalRecord?.inventoryIds || [],
        cost: Number(values.cost) || Number(originalRecord?.cost) || 0,
        distributionDate:
          distributionDateStr || originalRecord?.distributionDate,
        expectedArrival: expectedArrivalStr || originalRecord?.expectedArrival,
      };

      if (!id && requiredFields.inventoryIds.length === 0) {
        toast.error("Vui lòng chọn ít nhất một xe để phân phối.");
        return;
      }

      //Gửi đi
      const payload = {
        id: id ? Number(id) : undefined, // Nếu sửa thì gửi ID, thêm mới thì không cần
        toDealerId: Number(values.toDealerId),
        actualArrival: actualArrivalStr || null,
        transportCompany: values.transportCompany?.trim() || null,
        trackingNumber: values.trackingNumber?.trim() || null,
        status: id ? originalRecord.status : "pending",// nếu có id (đang sửa), bắt buộc giữ nguyên trạng thái cũ, nếu không có mặc định là 'pending'
        notes: values.notes?.trim() || null,
        movementType:
          values.movementType ||
          originalRecord?.movementType ||
          "SUPPLIER_TO_DEALER",

        // Nó lấy toàn bộ 5 dòng trong biến `requiredFields` ở phần 1 (fromLocation, inventoryIds, cost, date...) và đổ vào đây.
        ...requiredFields,

        // Lấy Order ID nhập thủ công nếu không phải editing
        inventoryId: inventoryIdsArray.length === 1 ? inventoryIdsArray[0] : null,
        orderId: originalRecord?.orderId || values.orderId || null,
        paymentId: originalRecord?.paymentId || values.paymentId || null,
      };

      if (id) {
        await putVehicleDistribution(payload);
        toast.success("Distribution updated successfully!");
      } else {
        await postVehicleDistribution(payload);
        toast.success("Distribution added successfully!");
      }

      handleCloseDrawer();
      loadDistributions(currentPage, pageSize, selectedDealerId);
    } catch (err) {
      console.error("POST/PUT Distribution ERROR:", err.response?.data || err);
      if (err.response?.status === 400) {
        toast.error(
          "Validation Error: Please ensure all required fields are submitted."
        );
      } else {
        toast.error("Error saving distribution! Check your data.");
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await removeVehicleDistribution(id);
      toast.success("Distribution deleted!");
      loadDistributions(currentPage, pageSize, selectedDealerId);
    } catch (err) {
      console.error(err);
      toast.error("Error deleting distribution!");
    }
  };

  /**
   * ✅ THAY THẾ: Gọi API PUT /api/distribution/{id}/complete (để chuyển sang Delivered)
   */
  const handleCompleteDelivery = async (record) => {
    // Đảm bảo loading là TRUE (nếu bạn có state loading)
    // setLoading(true); 
    
    try {
        // 1. GỌI API PUT /COMPLETE (Nơi lỗi 500 xảy ra)
        await completeVehicleDistribution(record.id);
        
        // Nếu API trả về 200/204 thành công:
        toast.success("Delivery completed successfully! (Status: DELIVERED)");
        loadDistributions(currentPage, pageSize, selectedDealerId);

    } catch (err) {
        // 2. KHỐI CATCH: Xử lý lỗi 500/lỗi mạng
        console.error("Error on complete delivery API:", err);
        
        // Tải lại dữ liệu ngay lập tức để lấy trạng thái đã được lưu trong DB
        loadDistributions(currentPage, pageSize, selectedDealerId); 

        // 3. THÊM BƯỚC XÁC NHẬN SAU 1 GIÂY (nếu cần)
        setTimeout(() => {
             // Chỉ tải lại lần nữa để đảm bảo cập nhật
             // Sau khi tải lại, trạng thái trên màn hình sẽ là Delivered
             
             // Nếu muốn toast báo "Thành công" sau khi tải lại:
             toast.success("Trạng thái đã được cập nhật thành DELIVERED thành công.");
             
             // Bạn có thể xóa dòng này nếu không muốn toast thành công lặp lại
             
        }, 1000); 
    } 
    // finally { setLoading(false); }
};

  const handleCloseDrawer = () => {
    setOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleEdit = (record) => {
    setEditingRecord(record);

    const initialInventoryIds = Array.isArray(record.inventoryIds)
      ? record.inventoryIds// nếu là mảng thì lấy luôn
      : record.inventoryId// nếu là số thì
      ? [record.inventoryId]// bọc thành mảng
      : [];

    form.setFieldsValue({
      ...record,
      fromLocation: record.fromLocation || null,
      cost: record.cost || 0,
      inventoryIds: initialInventoryIds,

      orderId: record.orderId || null,
      paymentId: record.paymentId || null,

      // Server trả về YYYY-MM-DD -> Ant phải nhận được object dayjs tương ứng
      distributionDate: record.distributionDate
        ? dayjs(record.distributionDate)// Có ngày -> Convert sang dayjs
        : null,
      expectedArrival: record.expectedArrival
        ? dayjs(record.expectedArrival)
        : null,
      actualArrival: record.actualArrival ? dayjs(record.actualArrival) : null,
    });
    setOpen(true);
  };

  // 🧱 Cột bảng (Giữ nguyên)
  const columns = [
    {
      title: "Distribution ID / Vehicle",
      key: "shipment_vehicle",
      width: 200,
      render: (_, record) => (
        <div className="flex flex-col text-sm">
          <Tooltip title={`From Location: ${record.fromLocation}`}>
            <span className="font-semibold text-gray-800 flex items-center cursor-help">
              <SendOutlined className="mr-1 text-blue-600" />
              Distribution ID: {record.id}
            </span>
          </Tooltip>

          <span className="text-xs text-blue-600 mt-1 cursor-pointer hover:text-blue-800 flex items-center">
            <CarOutlined className="mr-1" />
            Inv Count: {record.inventoryIds?.length || 0}
          </span>
          <span className="text-xs text-gray-500">
            Type: {record.movementType || "SUPPLIER_TO_DEALER"}
          </span>
        </div>
      ),
    },
    {
      title: "Destination / Dealer",
      key: "destination_dealer",
      width: 180,
      render: (_, record) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium text-gray-800">
            {getDealerLabel(record.toDealerId)}{/* trả về tên đại lý*/}
          </span>
          <span className="text-xs text-gray-500">
            Dealer ID: {record.toDealerId}
          </span>
        </div>
      ),
    },
    {
      title: "Transport / Cost",
      key: "transport_cost",
      width: 180,
      render: (_, record) => (
        <div className="flex flex-col text-sm">
          <Tooltip title={`Tracking Number: ${record.trackingNumber || "N/A"}`}>
            <span className="font-medium text-gray-800 flex items-center cursor-help">
              <TruckOutlined className="mr-1 text-gray-500" />
              {record.transportCompany || "N/A"}
            </span>
          </Tooltip>
          <Tooltip title="Distribution Cost">
            <span className="text-sm text-orange-600 font-medium flex items-center cursor-help">
              <DollarOutlined className="mr-1" />
              {formatCurrency(record.cost)}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Dates (Sent/Exp/Actual)",
      key: "dates",
      width: 250,
      render: (_, record) => (
        <div className="flex flex-col text-xs">
          <Tooltip
            title={`Distribution Date (Sent): ${record.distributionDate}`}
          >
            <span className="text-gray-800 cursor-help">
              Sent: {record.distributionDate}
            </span>
          </Tooltip>
          <Tooltip title={`Expected Arrival: ${record.expectedArrival}`}>
            <span className="text-red-500 cursor-help">
              Exp: {record.expectedArrival}
            </span>
          </Tooltip>
          {record.actualArrival && (
            <Tooltip title={`Actual Arrival: ${record.actualArrival}`}>
              <Tag color="green" size="small" className="mt-1">
                ARRIVED
              </Tag>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        let color = "orange";
        if (status === "delivered" || status === "completed") color = "green";
        else if (status === "in_transit") color = "blue";
        else if (status === "delayed") color = "red";
        else if (status === "cancelled") color = "red";
        return (
          <Tag color={color} className="font-medium">
            {status.toUpperCase().replace("_", " ")}{/*Thay thế dấu _ thành khoảng trắng, và biến chữ thường thành HOA*/}
          </Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: 180,
      render: (_, record) => (
        <div className="flex gap-1 justify-center">
          {/* 1. XỬ LÝ PHIẾU YÊU CẦU MỚI (status == 'pending')
          {record.status === "pending" && (
            <>
              <Popconfirm
                title="Phê duyệt yêu cầu?"
                description={`Xác nhận và chuyển yêu cầu ID ${record.id} sang Confirmed.`}
                onConfirm={() => handleApprove(record)}
              >
                <Tooltip title="Approve & Confirm Shipment">
                  <Button
                    type="text"
                    icon={
                      <TruckOutlined className="text-green-600 hover:text-green-800" />
                    }
                  />
                </Tooltip>
              </Popconfirm>

              <Popconfirm
                title="Từ chối yêu cầu?"
                description={`Hủy yêu cầu phân phối ID ${record.id}.`}
                onConfirm={() => handleReject(record)}
              >
                <Tooltip title="Reject Request">
                  <Button
                    type="text"
                    icon={
                      <DeleteOutlined className="text-red-500 hover:text-red-700" />
                    }
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )} */}

          {/* 2. CHUYỂN TRẠNG THÁI CHUNG (cho confirmed, delayed, active) */}
          { 
            record.status !== "in_transit" &&
            record.status !== "delivered" &&
            record.status !== "cancelled" && (
              <Tooltip title="Change Status">
                <Button
                  type="text"
                  icon={
                    <FieldTimeOutlined className="text-orange-500 hover:text-orange-700" />
                  }
                  onClick={() => openStatusModal(record)}
                />
              </Tooltip>
            )}

          {/* 3. HOÀN TẤT GIAO HÀNG (chỉ cho in_transit) */}
          {record.status === "in_transit" && (
            <Popconfirm
              title="Hoàn tất giao xe?"
              description="Xác nhận xe đã đến nơi và chuyển trạng thái thành DELIVERED."
              onConfirm={() => handleCompleteDelivery(record)}
            >
              <Tooltip title="Complete Delivery (DELIVERED)">
                <Button
                  type="text"
                  icon={
                    <SendOutlined className="text-green-600 hover:text-green-800" />
                  }
                />
              </Tooltip>
            </Popconfirm>
          )}

          {/* 4. CHỈNH SỬA VÀ XÓA */}
          <Tooltip title="Edit Info">
            <Button
              type="text"
              icon={
                <EditOutlined className="text-blue-500 hover:text-blue-700" />
              }
              onClick={() => handleEdit(record)}
            />
          </Tooltip>

          <Popconfirm
            title="Are you sure delete this record?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Tooltip title="Delete">
              <Button
                danger
                type="text"
                icon={<DeleteOutlined className="hover:text-red-700" />}
              />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <SendOutlined className="mr-3 text-blue-600" />
          Vehicle Distribution Management
        </h1>
        <Space>
          <Select
            placeholder="Filter by Dealer"
            allowClear
            style={{ width: 250 }}
            options={dealers}
            onChange={handleDealerFilterChange}
            value={selectedDealerId}
            size="large"
            optionFilterProp="label"
            showSearch
          />
          <Button
            type="primary"
            size="large"
            className="bg-blue-600 hover:bg-blue-700 font-semibold flex items-center gap-1 shadow-md"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setEditingRecord(null);
              setOpen(true);
            }}
          >
            Add Distribution
          </Button>
        </Space>
      </div>

      <Card className="shadow-xl rounded-xl" loading={loading}>
        <Table
          columns={columns}
          dataSource={distributions}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalRecords,
            onChange: handleTableChange,
          }}
        />
      </Card>

      {/* Drawer/Modal */}
      <Drawer
        title={
          <span className="text-xl font-bold text-gray-800">
            {editingRecord ? "Edit Distribution: " : "Create New Distribution"}
            <span className="text-blue-600 ml-2">
              ID: {editingRecord?.id || "N/A"}
            </span>
          </span>
        }
        open={open}
        onClose={handleCloseDrawer} // Không cho bấm ra ngoài để tắt (bắt buộc bấm nút Cancel)
        maskClosable={false}
        width={720}
        destroyOnClose={true}// QUAN TRỌNG: Đóng ngăn kéo là hủy luôn HTML bên trong -> Để reset form sạch sẽ cho lần sau
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseDrawer} size="large">
              Cancel
            </Button>
            <Button
              onClick={form.submit}
              type="primary"
              size="large"
              className="bg-blue-600 font-semibold"
            >
              {editingRecord ? "Update Info" : "Create Distribution"}
            </Button>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="p-4 bg-white rounded-lg"
          initialValues={{
            movementType: "SUPPLIER_TO_DEALER",
            status: "pending",
          }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
                Core Shipment Details
              </h3>
            </Col>

            {/* ✅ TRƯỜNG ORDER ID BỔ SUNG
            <Col span={24}>
              <Form.Item name="orderId" label="Order ID">
                <InputNumber
                {...positiveNumberProps}
                  min={1}
                  placeholder="Link to existing Order ID"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col> */}

            {editingRecord && (
              <>
                <Form.Item name="id" hidden>
                  <Input type="hidden" />
                </Form.Item>

                {/* ✅ BỔ SUNG: TRƯỜNG ID ẨN CHO DỮ LIỆU GỐC */}
                <Form.Item name="paymentId" hidden>
                  <Input type="hidden" />
                </Form.Item>
              </>
            )}

            <Form.Item name="movementType" hidden>
              <Input type="hidden" />
            </Form.Item>

            <Col span={12}>
              <Form.Item
                label="From Location"
                name="fromLocation"
                rules={[{ required: true, message: "Enter from location" }]}
              >
                <Input placeholder="e.g. Hanoi Central Warehouse" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="To Dealer"
                name="toDealerId"
                rules={[{ required: true, message: "Select dealer" }]}
              >
                <Select
                  placeholder="Select dealer"
                  options={dealers}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Inventory (Vehicle VIN)"
                name="inventoryIds"
                rules={[
                  { required: !editingRecord, message: "Select inventory" },
                ]}
              >
                <Select
                  placeholder="Select inventory"
                  options={inventories}
                  mode="multiple"
                  showSearch
                  optionFilterProp="label"
                  disabled={!!editingRecord}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Transport Company" name="transportCompany">
                <Input placeholder="e.g. ABC Logistics" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Distribution Date"
                name="distributionDate"
                rules={[
                  { required: true, message: "Select distribution date" },
                ]}
              >
                <DatePicker className="w-full" format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Expected Arrival"
                name="expectedArrival"
                rules={[{ required: true, message: "Select expected date" }]}
              >
                <DatePicker className="w-full" format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Actual Arrival"
                name="actualArrival"
                hidden={!editingRecord}
              >
                <DatePicker className="w-full" format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mt-6 mb-4">
            Tracking & Finance
          </h3>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Tracking Number" name="trackingNumber">
                <Input placeholder="Tracking number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Cost" name="cost">
                <InputNumber
                {...positiveNumberProps}
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="Cost (optional)"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              {/* ẨN TRƯỜNG STATUS KHI TẠO MỚI */}
              <Form.Item label="Status" name="status" hidden={true}>
                <Input type="hidden" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} placeholder="Additional notes" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Modal Chuyển trạng thái cho Manager (Giữ nguyên) */}
      <Modal
        title={`Change Status for Distribution ID: ${selectedRecord?.id}`}
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        onOk={() => statusForm.submit()}
        okText="Update Status"
        // Vô hiệu hóa nút OK nếu không có trạng thái mới hợp lệ
        okButtonProps={{
          disabled: getValidNextStatuses(selectedRecord?.status).length === 0,
        }}
      >
        <Form form={statusForm} layout="vertical" onFinish={handleStatusSubmit}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="Current Status">
            <Tag color="orange" style={{ fontSize: "14px" }}>
              {selectedRecord?.status.toUpperCase()}
            </Tag>
          </Form.Item>

          {getValidNextStatuses(selectedRecord?.status).length > 0 ? (
            <Form.Item
              label="New Status"
              name="newStatus"
              rules={[
                { required: true, message: "Please select a new status" },
              ]}
            >
              <Select placeholder="Select valid transition status">
                {/* Dùng hàm getValidNextStatuses để render option */}
                {getValidNextStatuses(selectedRecord?.status).map((status) => (
                  <Select.Option key={status.value} value={status.value}>
                    {status.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <p className="text-red-600 font-semibold mt-4">
              🚫 Status **{selectedRecord?.status.toUpperCase()}** cannot be
              changed further.
            </p>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default VehicleDistribution;
