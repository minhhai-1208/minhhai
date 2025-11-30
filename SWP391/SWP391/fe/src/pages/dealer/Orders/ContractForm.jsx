import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Spin,
  Typography,
  Descriptions,
  Tag,
  Divider,
  Popconfirm,
  Alert,
  Space,
  Select, 
} from "antd";
import { 
  SaveOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined, 
  ArrowLeftOutlined, 
  PlusOutlined 
} from "@ant-design/icons";

// 📌 API Imports (Giữ nguyên vì cần cho logic SAVE, EDIT, SIGN)
import { 
    getContractById, 
    putContract, 
    signContract, 
    postContract 
} from "../../../service/contracts.api"; 
import { getOrderById } from "../../../service/order.api"; 

const { Title } = Typography;
const { Option } = Select;

// --- DỮ LIỆU CHUẨN HÓA (Cần thiết cho Select) ---
const TERMS_OPTIONS = [
  { 
    value: "standard_sale", 
    label: "Hợp đồng mua bán tiêu chuẩn (Standard Sale Contract)",
    detail: "Bao gồm các điều khoản cơ bản về chuyển giao quyền sở hữu, thanh toán và các nghĩa vụ pháp lý thông thường. Khách hàng chịu trách nhiệm đăng ký xe.",
  },
  { 
    value: "full_service_sale", 
    label: "Hợp đồng dịch vụ trọn gói (Full Service Contract)",
    detail: "Bao gồm điều khoản tiêu chuẩn, cộng thêm dịch vụ đăng ký, đăng kiểm, và giao xe tận nơi do Đại lý thực hiện. Phí dịch vụ được tính riêng.",
  },
];

const WARRANTY_OPTIONS = [
  { 
    value: "manufacturer_standard", 
    label: "Bảo hành tiêu chuẩn (3 năm/100,000km)",
    detail: "Bảo hành chính hãng 3 năm hoặc 100,000km (tùy điều kiện nào đến trước). Phạm vi bảo hành theo quy định của Nhà sản xuất.",
  },
  { 
    value: "extended_5_years", 
    label: "Bảo hành mở rộng (5 năm/150,000km)",
    detail: "Bảo hành chính hãng 5 năm hoặc 150,000km (tùy điều kiện nào đến trước). Điều kiện bảo hành mở rộng có giới hạn.",
  },
];

const INSURANCE_OPTIONS = [
  { 
    value: "included_1_year", 
    label: "Bảo hiểm vật chất 1 năm (Miễn phí)",
    detail: "Đại lý tài trợ gói bảo hiểm vật chất 1 năm của đối tác. Hiệu lực ngay khi xe được giao. Giá trị bồi thường tối đa 80% giá xe.",
  },
  { 
    value: "customer_procures", 
    label: "Khách hàng tự mua bảo hiểm",
    detail: "Đại lý không chịu trách nhiệm về bảo hiểm vật chất. Khách hàng cam kết tự mua bảo hiểm trước khi nhận xe.",
  },
];

const CONTRACT_STATUS_MAP = {
  draft: { color: "blue", text: "Bản Nháp" },
  pending_sign: { color: "gold", text: "Chờ Ký" },
  signed: { color: "green", text: "Đã Ký" },
  cancelled: { color: "red", text: "Đã Hủy" },
};

export default function ContractForm() {
  const params = useParams(); 
  const contractId = params.contractId; 238-[ ]
  const orderId = params.id || params.orderId;       
  
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [order, setOrder] = useState(null); 
  
  const isCreationMode = !!orderId && !contractId;
  const isEditable = isCreationMode || contract?.status === 'draft' || contract?.status === 'pending_sign';
  
  // --- Function to find and set detail content ---
  const findDetail = (options, value) => {
    return options.find(opt => opt.value === value)?.detail || "";
  };

  const handleSelectChange = (options, detailFieldName, value) => {
    const detail = findDetail(options, value);
    form.setFieldsValue({
        [detailFieldName]: detail,
    });
  };

  // --- 1. Load Data ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (isCreationMode) {
          const orderResponse = await getOrderById(orderId);
          setOrder(orderResponse);
          
          form.setFieldsValue({
            contractDate: new Date().toISOString().split("T")[0],
            termsPackage: TERMS_OPTIONS[0].value,
            warrantyPackage: WARRANTY_OPTIONS[0].value,
            insurancePackage: INSURANCE_OPTIONS[0].value,
            termsConditions: TERMS_OPTIONS[0].detail,
            warrantyInfo: WARRANTY_OPTIONS[0].detail,
            insuranceInfo: INSURANCE_OPTIONS[0].detail,
          });
        } else if (contractId) {
          const contractResponse = await getContractById(contractId);
          setContract(contractResponse);
          
          form.setFieldsValue({
            contractDate: contractResponse?.contractDate?.split("T")[0] || contractResponse?.contractDate,
            termsConditions: contractResponse?.termsConditions,
            warrantyInfo: contractResponse?.warrantyInfo,
            insuranceInfo: contractResponse?.insuranceInfo,
          });
        }
      } catch (error) {
        message.error("Lỗi khi tải dữ liệu. Vui lòng kiểm tra ID.");
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId, orderId]);

  // --- 2. Handle Save (Create OR Update) ---
  const handleSave = async (values) => {
    if (!isEditable) {
      message.warning("Hợp đồng đã được ký, không thể chỉnh sửa.");
      return;
    }

    try {
      setLoading(true);

      if (isCreationMode) {
        const contractData = {
          dealerId: order.dealerId,
          customerId: order.customerId,
          orderId: order.id,
          contractDate: values.contractDate || new Date().toISOString().split("T")[0],
          ...values,
          // Xóa các trường tạm (Package) trước khi gửi lên BE
          termsPackage: undefined,
          warrantyPackage: undefined,
          insurancePackage: undefined,
        };

        const response = await postContract(contractData);
        const newId = response.id;

        message.success("Tạo hợp đồng thành công! Đang chuyển sang chế độ chỉnh sửa...");
        navigate(`/dealer/contracts/${newId}`, { replace: true });
        
      } else {
        const updatedData = {
          ...contract,
          ...values,
          id: contractId,
          termsPackage: undefined,
          warrantyPackage: undefined,
          insurancePackage: undefined,
        };

        const response = await putContract(contractId, updatedData);
        message.success("Cập nhật hợp đồng thành công!");
        setContract(response);
      }
    } catch (error) {
      message.error(
        isCreationMode ? "Tạo hợp đồng thất bại." : "Lưu hợp đồng thất bại."
      );
      console.error("Error saving contract:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Xử lý Ký Hợp đồng (SIGN API) ---
  const handleSignContract = async () => {
    try {
      setLoading(true);
      if (isCreationMode || (contract.status !== 'draft' && contract.status !== 'pending_sign')) {
          message.warning("Hợp đồng chưa được lưu hoặc không ở trạng thái có thể ký.");
          return;
      }
      
      await signContract(contractId);
      message.success("Ký hợp đồng thành công! Đã cập nhật trạng thái.");
      
      const updatedContract = await getContractById(contractId);
      setContract(updatedContract);
      
    } catch (error) {
      message.error("Ký hợp đồng thất bại.");
      console.error("Error signing contract:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // --- 4. Điều hướng quay lại ---
  const handleBack = () => {
    navigate("/dealer/orderManagement");
  };

  // --- Render Status Check ---
  if (loading || (!contractId && !orderId)) {
    return (
      <Spin tip="Đang tải dữ liệu...">
        <div style={{ height: "400px" }} />
      </Spin>
    );
  }
  
  // Dữ liệu hiển thị thông tin chung
  const displayData = isCreationMode ? order : contract;
  const statusText = isCreationMode ? "CHUẨN BỊ TẠO NHÁP" : CONTRACT_STATUS_MAP[contract?.status]?.text;
  const statusColor = isCreationMode ? "geekblue" : CONTRACT_STATUS_MAP[contract?.status]?.color;
  
  const creationAlert = isCreationMode && (
    <Alert
      message="Chế độ Tạo Mới Hợp Đồng"
      description="Hợp đồng sẽ được tạo (POST API) sau khi bạn điền thông tin và bấm 'LƯU VÀ TẠO HỢP ĐỒNG'."
      type="info"
      showIcon
      className="mb-4"
    />
  );

  // --- Render UI ---
  return (
    <Card
      title={
        <Title level={3}>
          {isCreationMode ? <PlusOutlined /> : <FileTextOutlined />}
          {isCreationMode ? "Tạo Hợp Đồng Từ Đơn Hàng" : "Chỉnh Sửa Hợp Đồng"}
        </Title>
      }
      extra={
        <Space>
          <Button onClick={handleBack} icon={<ArrowLeftOutlined />}>
            Quay lại
          </Button>

          {/* Sign Button */}
          {!isCreationMode &&
            (contract?.status === "draft" ||
              contract?.status === "pending_sign") && (
              <Popconfirm
                title="Xác nhận ký hợp đồng này?"
                onConfirm={handleSignContract}
                okText="Xác nhận Ký"
                cancelText="Hủy"
              >
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={loading}
                  disabled={!isEditable}
                >
                  Ký Hợp Đồng
                </Button>
              </Popconfirm>
            )}

          {/* Save Button */}
          {isEditable && (
            <Button
              type="primary"
              onClick={() => form.submit()}
              icon={<SaveOutlined />}
              loading={loading}
            >
              {isCreationMode ? "LƯU VÀ TẠO HỢP ĐỒNG" : "LƯU CHỈNH SỬA"}
            </Button>
          )}
        </Space>
      }
    >
      <Spin spinning={loading}>
        {creationAlert}

        {/* General Information */}
        <Descriptions bordered size="small" column={2} className="mb-4">
          <Descriptions.Item label="Mã Hợp Đồng">
            {isCreationMode ? "Sẽ tạo mới" : contract?.id}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng Thái">
            <Tag color={statusColor || "default"}>{statusText || "N/A"}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Order ID">
            {displayData?.id} ({displayData?.orderNumber || "N/A"})
          </Descriptions.Item>
          <Descriptions.Item label="Khách Hàng">
            {displayData?.customerName}
          </Descriptions.Item>
        </Descriptions>

        <Divider>Nội Dung Chi Tiết Hợp Đồng</Divider>

        {/* Content Form */}
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="contractDate"
            label="Ngày Lập Hợp Đồng"
            rules={[
              { required: true, message: "Vui lòng nhập ngày lập." },
            ]}
          >
            <Input disabled={!isEditable} placeholder="YYYY-MM-DD" />
          </Form.Item>

          {/* --- 1. TERMS & CONDITIONS --- */}
          <Form.Item
            name="termsPackage"
            label="Chọn Gói Điều Khoản"
            rules={[
              { required: true, message: "Vui lòng chọn gói điều khoản." },
            ]}
          >
            <Select
              placeholder="Chọn gói điều khoản"
              onChange={(value) =>
                handleSelectChange(TERMS_OPTIONS, "termsConditions", value)
              }
              disabled={!isEditable}
            >
              {TERMS_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="termsConditions" // Field to store detailed content for backend
            label="Nội dung Điều khoản Chi tiết"
            rules={[
              {
                required: true,
                message: "Nội dung điều khoản chi tiết không được trống.",
              },
            ]}
          >
            <Input.TextArea
              rows={6}
              disabled={!isEditable}
              placeholder="Nội dung chi tiết của điều khoản..."
            />
          </Form.Item>

          <Divider dashed />

          {/* --- 2. WARRANTY INFORMATION --- */}
          <Form.Item
            name="warrantyPackage"
            label="Chọn Gói Bảo Hành"
            rules={[
              { required: true, message: "Vui lòng chọn gói bảo hành." },
            ]}
          >
            <Select
              placeholder="Chọn gói bảo hành"
              onChange={(value) =>
                handleSelectChange(WARRANTY_OPTIONS, "warrantyInfo", value)
              }
              disabled={!isEditable}
            >
              {WARRANTY_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="warrantyInfo" // Field to store detailed content for backend
            label="Nội dung Bảo hành Chi tiết"
          >
            <Input.TextArea
              rows={4}
              disabled={!isEditable}
              placeholder="Chi tiết bảo hành, thời gian, điều kiện..."
            />
          </Form.Item>

          <Divider dashed />

          {/* --- 3. INSURANCE INFORMATION --- */}
          <Form.Item
            name="insurancePackage"
            label="Chọn Gói Bảo Hiểm"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn gói bảo hiểm.",
              },
            ]}
          >
            <Select
              placeholder="Chọn gói bảo hiểm"
              onChange={(value) =>
                handleSelectChange(INSURANCE_OPTIONS, "insuranceInfo", value)
              }
              disabled={!isEditable}
            >
              {INSURANCE_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="insuranceInfo" // Field to store detailed content for backend
            label="Nội dung Bảo hiểm Chi tiết"
          >
            <Input.TextArea
              rows={4}
              disabled={!isEditable}
              placeholder="Chi tiết bảo hiểm đi kèm..."
            />
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
}