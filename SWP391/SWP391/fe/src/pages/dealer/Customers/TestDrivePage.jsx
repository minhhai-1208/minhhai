import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Button,
  Popconfirm,
  message,
  Tag,
  Space,
  Card,
  Spin,
  Input,
  Select,
  DatePicker,
} from "antd";
import { PlusCircle, Edit, Trash2, Search as SearchIcon } from "lucide-react";
import dayjs from "dayjs";

// ✅ Import các plugins cần thiết cho dayjs để hỗ trợ isSameOrAfter/isSameOrBefore
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore); 

import { useSelector } from "react-redux";
import TestDriveForm from "../../../components/TestDriveForm";
import {
  fetchTestDrives,
  postTestDrive,
  putTestDrive,
  removeTestDrive,
} from "../../../service/test-drive.api";
import { fetchUsers } from "../../../service/user.api";
import { fetchCustomers } from "../../../service/customers.api";
import { fetchVehicleDetails } from "../../../service/vehicle-details.api";

// --- UTILITY CONFIGURATION ---
const { Search } = Input;
const { RangePicker: AntRangePicker } = DatePicker; // Lấy RangePicker từ DatePicker

const STATUS_OPTIONS = [
  { value: "Scheduled", label: "Scheduled" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

const getStatusColor = (status) => {
  switch (status) {
    case "Scheduled":
      return "blue";
    case "Completed":
      return "green";
    case "Cancelled":
      return "red";
    default:
      return "default";
  }
};

const TestDrivePage = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingData, setEditingData] = useState(null);

  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  // ✅ Filter States
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState(null); // [startDayjs, endDayjs]

  const account = useSelector((state) => state.account);
  const currentDealerId = Number(account?.dealerId);

  // --- HÀM LỌC CHÍNH (KẾT HỢP TÌM KIẾM, TRẠNG THÁI VÀ KHOẢNG NGÀY) ---
  const applyFilters = useCallback(() => {
    let currentData = data;
    const lowerCaseSearch = searchText?.toLowerCase();

    // 1. Lọc theo Search Text (Customer, Staff, Vehicle)
    if (lowerCaseSearch) {
      currentData = currentData.filter((item) => {
        const fullText = `${item.customerName} ${item.staffName} ${item.vehicleModel}`.toLowerCase();
        return fullText.includes(lowerCaseSearch);
      });
    }

    // 2. Lọc theo Status
    if (selectedStatus) {
      currentData = currentData.filter(
        (item) => item.status === selectedStatus
      );
    }

    // 3. ✅ Lọc theo Khoảng Ngày Hẹn (Inclusive)
    if (selectedDateRange && selectedDateRange.length === 2) {
      const [start, end] = selectedDateRange;
      
      // Chuẩn hóa ngày bắt đầu về 00:00:00 và ngày kết thúc về 23:59:59
      const startDate = start.startOf('day');
      const endDate = end.endOf('day');

      currentData = currentData.filter((item) => {
        if (!item.appointmentDate) return false;
        const itemDate = dayjs(item.appointmentDate);
        
        // Kiểm tra xem itemDate có nằm trong khoảng [startDate, endDate]
        return itemDate.isSameOrAfter(startDate) && itemDate.isSameOrBefore(endDate);
      });
    }

    setFilteredData(currentData);
  }, [data, searchText, selectedStatus, selectedDateRange]);

  // --- COMPREHENSIVE DATA LOADING FUNCTION (Giữ nguyên) ---
  const loadData = useCallback(async () => {
    if (!currentDealerId) {
      message.warning("Dealer ID not found.");
      return;
    }

    setLoading(true);
    try {
      const [testDrivesRes, usersRes, customersRes, vehiclesRes] =
        await Promise.all([
          fetchTestDrives(),
          fetchUsers(),
          fetchCustomers(),
          fetchVehicleDetails(),
        ]);

      // Process and Filter supporting data
      const allUsers = usersRes.data || (Array.isArray(usersRes) ? usersRes : []);
      const filteredStaffs = allUsers.filter(
        (user) => Number(user.dealerId) === currentDealerId && user.role !== 'admin'
      );
      setStaffs(filteredStaffs);

      const allCustomers = customersRes.data || [];
      const filteredCustomers = allCustomers.filter(
        (c) => Number(c.dealerId) === currentDealerId
      );
      setCustomers(filteredCustomers);

      const allVehicles = vehiclesRes.data || (Array.isArray(vehiclesRes) ? vehiclesRes : []);
      setVehicles(allVehicles);

      // Process and Filter Test Drives
      const allTestDrives = testDrivesRes.data || [];
      const processedData = Array.isArray(allTestDrives)
        ? allTestDrives
            .filter((item) => Number(item.dealerId) === currentDealerId)
            .map((item) => ({
              ...item,
              key: item.id,
              // MAP NAMES based on fetched supporting data
              customerName:
                filteredCustomers.find((c) => c.id === item.customerId)?.fullName ||
                `ID:${item.customerId}`,
              staffName:
                filteredStaffs.find((s) => s.id === item.staffId)?.fullName ||
                `ID:${item.staffId}`,
              vehicleModel:
                allVehicles.find((v) => v.id === item.vehicleDetailId)?.modelName ||
                `ID:${item.vehicleDetailId}`,
            }))
        : [];
      
      setData(processedData);
      setFilteredData(processedData); 

    } catch (error) {
      message.error(
        "Error loading data: " + (error.message || "Server error")
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentDealerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Kích hoạt lọc mỗi khi các state thay đổi
  useEffect(() => {
    applyFilters();
  }, [data, searchText, selectedStatus, selectedDateRange, applyFilters]);


  // --- Các hàm CRUD và Utility khác (Giữ nguyên) ---
  const cleanDataForApi = (data) => {
    const cleanedData = { ...data };
    delete cleanedData.key;
    delete cleanedData.dealerName;
    delete cleanedData.customerName;
    delete cleanedData.staffName;
    delete cleanedData.vehicleModel;
    delete cleanedData.inventoryId;
    if (cleanedData.actualDate === undefined) {
      cleanedData.actualDate = null;
    }
    return cleanedData;
  };

  const handleSave = async (values) => {
    try {
      const { customerId, staffId, inventoryId } = values;

      const dataToSend = {
        ...values,
        dealerId: currentDealerId,
        vehicleDetailId: inventoryId,
      };

      delete dataToSend.fullName;

      let finalPayload = cleanDataForApi(dataToSend);

      if (editingData) {
        await putTestDrive({ id: editingData.id, ...finalPayload });
        message.success("Test Drive updated successfully!");
      } else {
        delete finalPayload.id;
        await postTestDrive(finalPayload);
        message.success("New Test Drive added successfully!");
      }
      setModalVisible(false);
      setEditingData(null);
      loadData();
    } catch (error) {
      message.error(
        "Operation failed: Server Error (500). Details: " +
          (error.response?.data?.message || "Connection error")
      );
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await removeTestDrive(id);
      message.success("Test Drive deleted successfully!");
      loadData();
    } catch (error) {
      message.error(
        "Deletion failed: " +
          (error.response?.data?.message || "Connection error")
      );
    }
  };

  const handleRowClick = (record) => {
    setSelectedDetail(record);
    setDetailVisible(true);
  };


  // --- TABLE COLUMN CONFIGURATION (Giữ nguyên) ---
  const columns = [
    {
        title: "NO.",
        dataIndex: "id",
        key: "no",
        width: 80,
        align: "center",
        render: (text, record, index) => {
            const originalIndex = data.findIndex(d => d.id === record.id);
            return originalIndex !== -1 ? originalIndex + 1 : index + 1;
        },
    },
    { title: "Customer", dataIndex: "customerName", key: "customerName", width: 150 },
    { title: "Vehicle Model", dataIndex: "vehicleModel", key: "vehicleModel", width: 150 },
    { title: "Staff", dataIndex: "staffName", key: "staffName", width: 150 },
    {
      title: "Appointment Date",
      dataIndex: "appointmentDate",
      key: "appointmentDate",
      width: 180,
      render: (text) => (text ? dayjs(text).format("HH:mm DD/MM/YYYY") : "N/A"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: "Action",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<Edit size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              setEditingData(record);
              setModalVisible(true);
            }}
            type="link"
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Confirm Deletion"
            description="Are you sure you want to delete this test drive?"
            onConfirm={(e) => {
              e.stopPropagation();
              handleDelete(record.id);
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button
              icon={<Trash2 size={16} />}
              danger
              type="link"
              size="small"
              onClick={(e) => e.stopPropagation()}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card
        title={`Test Drive Management`}
        extra={
          <Space wrap size="middle"> 
            {/* ✅ Date Range Picker */}
            <AntRangePicker
                style={{ width: 220 }}
                format="DD/MM/YYYY"
                placeholder={["Start Date", "End Date"]}
                value={selectedDateRange}
                onChange={setSelectedDateRange}
            />
            
            {/* Filter by Status */}
            <Select
                placeholder="Filter by Status"
                allowClear
                style={{ width: 150 }}
                onChange={setSelectedStatus}
                value={selectedStatus}
                options={STATUS_OPTIONS}
            />

            {/* Live Search */}
            <Search
              placeholder="Search Customer, Staff or Vehicle"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText} 
              style={{ width: 280 }}
            />

            <Button
              type="primary"
              icon={<PlusCircle size={20} />}
              onClick={() => {
                setEditingData(null);
                setModalVisible(true);
              }}
            >
              Add Test Drive
            </Button>
          </Space>
        }
        className="shadow-lg"
      >
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
            onRow={(record, rowIndex) => {
              return {
                onClick: () => {
                  handleRowClick(record);
                },
              };
            }}
          />
        </Spin>
      </Card>

      {/* Modal for Add/Edit Form */}
      <TestDriveForm
        title={editingData ? "Edit Test Drive" : "Add New Test Drive"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingData(null);
        }}
        initialValues={editingData}
        onSave={handleSave}
        staffOptions={staffs}
        customerOptions={customers}
        vehicleOptions={vehicles}
        isDetailView={false}
      />

      {/* Modal for Detail View (Read-only) */}
      {selectedDetail && (
        <TestDriveForm
          title="Test Drive Details (Read-only)"
          open={detailVisible}
          onCancel={() => {
            setDetailVisible(false);
            setSelectedDetail(null);
          }}
          initialValues={selectedDetail}
          isDetailView={true}
          onSave={() => {
            /* no-op */
          }}
          staffOptions={staffs}
          customerOptions={customers}
          vehicleOptions={vehicles}
        />
      )}
    </div>
  );
};

export default TestDrivePage;