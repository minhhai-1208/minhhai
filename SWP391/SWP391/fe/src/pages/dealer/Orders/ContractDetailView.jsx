import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Spin,
  Descriptions,
  Tag,
  Typography,
  Button,
  message,
  Divider,
  Space,
  Alert,
  Form, 
  Input, 
  Popconfirm,
  Select, 
} from "antd";
import { FileTextOutlined, ArrowLeftOutlined, EditOutlined, SaveOutlined, CheckCircleOutlined } from "@ant-design/icons";

// API Imports
import { getContractById, putContract, signContract } from "../../../service/contracts.api"; 

const { Title, Text } = Typography;
const { Option } = Select;

// --- DỮ LIỆU CHUẨN HÓA ---
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
  draft: { color: "blue", text: "Draft" },
  pending_sign: { color: "gold", text: "Pending Signature" },
  signed: { color: "green", text: "Signed" },
  cancelled: { color: "red", text: "Cancelled" },
};

export default function ContractDetailView() {
  const { contractId } = useParams(); 
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState(null);
  const [isEditing, setIsEditing] = useState(false); 
  const [error, setError] = useState(null);

  // Điều kiện để được phép chỉnh sửa
  const canEdit = contract?.status === 'draft' || contract?.status === 'pending_sign';

  // Hàm tìm gói Select dựa trên nội dung chi tiết
  const findPackageValueByDetail = (options, detailContent) => {
      const found = options.find(opt => opt.detail === detailContent);
      return found ? found.value : null;
  };

  // Hàm xử lý thay đổi Select
  const findDetail = (options, value) => {
    return options.find(opt => opt.value === value)?.detail || '';
  };

  const handleSelectChange = (options, detailFieldName, value) => {
    const detail = findDetail(options, value);
    form.setFieldsValue({
        [detailFieldName]: detail,
    });
  };

  // --- 1. Load Contract Details ---
  const fetchContractDetails = async () => {
      if (!contractId) return;

      setLoading(true);
      try {
        setError(null);
        const response = await getContractById(contractId);
        setContract(response);
        
        // Đặt giá trị form sau khi tải
        form.setFieldsValue({
            termsConditions: response.termsConditions,
            warrantyInfo: response.warrantyInfo,
            insuranceInfo: response.insuranceInfo,
            
            // Gán giá trị cho Select 
            termsPackage: findPackageValueByDetail(TERMS_OPTIONS, response.termsConditions),
            warrantyPackage: findPackageValueByDetail(WARRANTY_OPTIONS, response.warrantyInfo),
            insurancePackage: findPackageValueByDetail(INSURANCE_OPTIONS, response.insuranceInfo),
        });
        
      } catch (err) {
        message.error("Failed to load contract details.");
        setError(err.response?.data?.message || "Failed to fetch contract data.");
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchContractDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  // HÀM CHUYỂN SANG CHẾ ĐỘ EDIT
  const handleEdit = () => {
      if (canEdit) {
          setIsEditing(true);
          message.info("Chế độ chỉnh sửa đã được kích hoạt.");
      } else {
          message.warning("Hợp đồng đã ký hoặc bị hủy, không thể chỉnh sửa.");
      }
  };
  
  // HÀM LƯU CHỈNH SỬA
  const handleSave = async (values) => {
    try {
      setLoading(true);
      
      // Lấy các giá trị mới nhất từ form, bao gồm cả các trường chi tiết
      const formValues = form.getFieldsValue();
      
      const updatedData = {
        ...contract, 
        // Chỉ gửi các trường nội dung chi tiết (termsConditions, warrantyInfo, insuranceInfo)
        termsConditions: formValues.termsConditions,
        warrantyInfo: formValues.warrantyInfo,
        insuranceInfo: formValues.insuranceInfo,
        
        id: contractId,
      };
      
      const response = await putContract(contractId, updatedData);
      message.success("Cập nhật hợp đồng thành công!");
      setContract(response); 
      setIsEditing(false); // Tắt chế độ chỉnh sửa
      
    } catch (error) {
      message.error("Lưu hợp đồng thất bại.");
      console.error("Error saving contract:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // HÀM KÝ HỢP ĐỒNG
  const handleSignContract = async () => {
    try {
      setLoading(true);
      if (!canEdit) {
          message.warning("Hợp đồng không ở trạng thái có thể ký.");
          return;
      }
      
      await signContract(contractId);
      message.success("Ký hợp đồng thành công! Đang cập nhật trạng thái...");
      
      await fetchContractDetails(); 
      setIsEditing(false); 
      
    } catch (error) {
      message.error("Ký hợp đồng thất bại.");
      console.error("Error signing contract:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Navigation Handlers ---
  const handleGoBack = () => {
    navigate('/dealer/orderManagement');
  };

  // --- Render UI ---
  if (loading && !contract) {
    return (
      <Spin tip="Loading contract details...">
        <div style={{ height: "400px" }} />
      </Spin>
    );
  }

  if (error || !contract) {
    return (
      <Card title={<Title level={3}>Contract Details</Title>}>
        <Alert message="Error" description={error || "Contract not found."} type="error" showIcon />
        <Button onClick={handleGoBack} icon={<ArrowLeftOutlined />} className="mt-4">Go Back</Button>
      </Card>
    );
  }

  const statusMap = CONTRACT_STATUS_MAP[contract.status] || { color: 'default', text: contract.status };
  // inputDisabled không còn cần thiết

  // --- Hàm Render Nội dung (Không bị làm mờ) ---
  const renderContentField = (fieldName) => {
      const content = form.getFieldValue(fieldName);
      
      if (isEditing) {
          // Trả về TextArea cho chế độ chỉnh sửa
          return <Input.TextArea rows={8} autoSize={{ minRows: 4, maxRows: 12 }} />;
      } else {
          // Trả về Text block cho chế độ xem (không bị làm mờ)
          // Sử dụng style whiteSpace: pre-wrap để giữ format xuống dòng
          return (
              <Text style={{ whiteSpace: 'pre-wrap', display: 'block', padding: '8px 0', color: 'black' }}>
                  {content || "Nội dung đang trống."}
              </Text>
          );
      }
  };

  return (
    <Card
      title={<Title level={3}><FileTextOutlined /> Contract #{contract.id}</Title>}
      extra={
          <Space>
            {/* Nút HỦY (khi đang sửa) */}
            {isEditing && (
                <Button onClick={() => { setIsEditing(false); form.resetFields(); }} disabled={loading}>
                    Cancel Edit
                </Button>
            )}
            
            {/* Nút LƯU (khi đang sửa) */}
            {isEditing && (
                <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} loading={loading}>
                    Save Changes
                </Button>
            )}

            {/* Nút KÝ (khi không sửa và được phép) */}
            {!isEditing && canEdit && (
                <Popconfirm
                    title="Xác nhận ký hợp đồng này? Hợp đồng sau khi ký không thể chỉnh sửa."
                    onConfirm={handleSignContract}
                    okText="Xác nhận Ký"
                    cancelText="Hủy"
                >
                    <Button type="primary" icon={<CheckCircleOutlined />} loading={loading}>
                        Sign Contract
                    </Button>
                </Popconfirm>
            )}
            
            {/* Nút EDIT (Chỉ khi không sửa và được phép) */}
            {!isEditing && canEdit && (
                <Button 
                    type="default" 
                    icon={<EditOutlined />} 
                    onClick={handleEdit}
                    disabled={loading}
                >
                    Edit Contract
                </Button>
            )}

            {/* Nút Quay lại */}
            <Button onClick={handleGoBack} icon={<ArrowLeftOutlined />}>
                Go Back
            </Button>
          </Space>
      }
    >
        <Spin spinning={loading}>
            <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="middle">
                <Descriptions.Item label="Order No.">
                    {contract.orderNumber || contract.orderId}
                </Descriptions.Item>
                <Descriptions.Item label="Customer">
                    {contract.customerName || contract.customerId}
                </Descriptions.Item>
                <Descriptions.Item label="Date Created">
                    {new Date(contract.contractDate).toLocaleDateString()}
                </Descriptions.Item>
                <Descriptions.Item label="Status" span={3}>
                    <Tag color={statusMap.color}>{statusMap.text}</Tag>
                </Descriptions.Item>
            </Descriptions>
            
            <Divider orientation="left">Contract Terms</Divider>

            {/* FORM ĐỂ CHỈNH SỬA NỘI DUNG */}
            <Form form={form} layout="vertical" onFinish={handleSave}>
                
                {/* --- 1. TERMS & CONDITIONS --- */}
                <Form.Item
                    name="termsPackage"
                    label="Chọn Gói Điều Khoản"
                    rules={[{ required: isEditing, message: 'Vui lòng chọn gói điều khoản.' }]}
                    style={{ display: isEditing ? 'block' : 'none' }}
                >
                    <Select 
                        placeholder="Chọn gói điều khoản"
                        onChange={(value) => handleSelectChange(TERMS_OPTIONS, 'termsConditions', value)}
                    >
                        {TERMS_OPTIONS.map(opt => (
                            <Option key={opt.value} value={opt.value}>
                                {opt.label}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="termsConditions" // Trường lưu nội dung chi tiết
                    label={isEditing ? "Nội dung Điều khoản Chi tiết" : "Terms & Conditions"}
                    rules={[{ required: isEditing, message: 'Nội dung chi tiết không được trống.' }]}
                >
                    {renderContentField('termsConditions')}
                </Form.Item>
                
                <Divider dashed />

                {/* --- 2. WARRANTY INFORMATION --- */}
                <Form.Item
                    name="warrantyPackage"
                    label="Chọn Gói Bảo Hành"
                    rules={[{ required: isEditing, message: 'Vui lòng chọn gói bảo hành.' }]}
                    style={{ display: isEditing ? 'block' : 'none' }}
                >
                    <Select 
                        placeholder="Chọn gói bảo hành"
                        onChange={(value) => handleSelectChange(WARRANTY_OPTIONS, 'warrantyInfo', value)}
                    >
                        {WARRANTY_OPTIONS.map(opt => (
                            <Option key={opt.value} value={opt.value}>
                                {opt.label}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                
                <Form.Item
                    name="warrantyInfo" // Trường lưu nội dung chi tiết gửi lên BE
                    label={isEditing ? "Nội dung Bảo hành Chi tiết" : "Warranty Information"}
                >
                    {renderContentField('warrantyInfo')}
                </Form.Item>

                <Divider dashed />

                {/* --- 3. INSURANCE INFORMATION --- */}
                <Form.Item
                    name="insurancePackage"
                    label="Chọn Gói Bảo Hiểm"
                    rules={[{ required: isEditing, message: 'Vui lòng chọn gói bảo hiểm.' }]}
                    style={{ display: isEditing ? 'block' : 'none' }}
                >
                    <Select 
                        placeholder="Chọn gói bảo hiểm"
                        onChange={(value) => handleSelectChange(INSURANCE_OPTIONS, 'insuranceInfo', value)}
                    >
                        {INSURANCE_OPTIONS.map(opt => (
                            <Option key={opt.value} value={opt.value}>
                                {opt.label}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="insuranceInfo" // Trường lưu nội dung chi tiết gửi lên BE
                    label={isEditing ? "Nội dung Bảo hiểm Chi tiết" : "Insurance Information"}
                >
                    {renderContentField('insuranceInfo')}
                </Form.Item>
                
            </Form>
            {/* --------------------- */}

            {contract.status === 'signed' && (
                <Alert 
                    message="Hợp đồng này đã được ký kết hợp pháp và không thể sửa đổi." 
                    type="success" 
                    showIcon 
                    className="mt-4"
                />          
            )}
        </Spin>
    </Card>
  );
}