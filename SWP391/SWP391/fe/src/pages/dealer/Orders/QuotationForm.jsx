import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Card,
  Form,
  Select,
  InputNumber,
  Button,
  Descriptions,
  message,
  Spin,
  Row,
  Col,
  Table,
} from "antd";

import { useWatch } from "antd/es/form/Form";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

// --- API Imports ---
import { fetchVehicleDetails } from "../../../service/vehicle-details.api";
import { fetchPromotions } from "../../../services/promotion.api";
import { fetchCustomers } from "../../../service/customers.api";
import { postOrderWithVehicleCheck } from "../../../service/order.api";

const { Option } = Select;

// =================================================================
// TÁCH LOGIC TÍNH TOÁN RA KHỎI COMPONENT (Helper Functions)
// =================================================================

const calculatePricePerUnit = (vehicle) => {
  return vehicle ? vehicle.finalPrice || 0 : 0;
};

const calculateOrderDiscount = (baseTotal, allPromotions, promoId) => {
  if (!promoId || baseTotal === 0) return 0;

  const promo = allPromotions.find((p) => p.id === promoId);
  if (!promo) return 0;

  switch (promo.discountType) {
    case "percentage":
      return Math.round((baseTotal * promo.discountValue) / 100);
    case "fixed_amount":
      return Math.min(baseTotal, promo.discountValue);
    default:
      return 0;
  }
};


// =================================================================
// MAIN COMPONENT
// =================================================================

export default function QuotationForm() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [allPromotions, setAllPromotions] = useState([]);
  const [itemDetailsMap, setItemDetailsMap] = useState({});

  // --- REDUX & DEALER ID ---
  const account = useSelector((state) => state.account);
  const currentDealerId = Number(account?.dealerId);

  // =================================================================
  // LỌC DỮ LIỆU BAN ĐẦU (Data Fetching & Loading)
  // =================================================================
  const loadData = async () => {
    try {
      setLoading(true);

      const [vehicleRes, customerRes, promoRes] = await Promise.all([
        fetchVehicleDetails(),
        fetchCustomers(),
        fetchPromotions(),
      ]);

      const vehicleData = Array.isArray(vehicleRes.data) ? vehicleRes.data : vehicleRes.data || [];
      const customerData = Array.isArray(customerRes.data) ? customerRes.data : customerRes.data || [];
      const promoData = Array.isArray(promoRes.data) ? promoRes.data : promoRes.data || [];

      setVehicleDetails(vehicleData);

      // Lọc Customer và Promotion theo Dealer ID
      setCustomers(customerData.filter((c) => Number(c.dealerId) === currentDealerId));
      setAllPromotions(promoData.filter((p) => Number(p.dealerId) === currentDealerId));

      // Khởi tạo Map tra cứu chi tiết xe
      const initialMap = {};
      vehicleData.forEach((v) => {
        initialMap[v.id] = v;
      });
      setItemDetailsMap(initialMap);
    } catch (err) {
      console.error("Error in loadData:", err);
      const errorMessage = err.response?.data?.message || err.message || "Unknown network error.";
      message.error(`Failed to load initial data! Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentDealerId) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDealerId]);

  // =================================================================
  // THEO DÕI & TÍNH TOÁN GIÁ TRỊ THỜI GIAN THỰC (Real-time Calculation)
  // =================================================================
  
  // Watchers từ Form
  const items = useWatch("details", form) || [];
  const orderPromotionId = useWatch("promotionId", form);

  // 1. Tính TỔNG TIỀN GỐC (Base Total)
  const baseTotalPrice = items.reduce((total, item) => {
    if (!item || !item.vehicleDetailId || !item.quantity) return total;
    const vehicle = itemDetailsMap[item.vehicleDetailId];
    if (!vehicle) return total;
    const unitPrice = calculatePricePerUnit(vehicle);
    return total + unitPrice * item.quantity;
  }, 0);

  // 2. Tính TỔNG CHIẾT KHẤU
  const totalDiscount = calculateOrderDiscount(
    baseTotalPrice,
    allPromotions,
    orderPromotionId
  );
  
  // 3. TỔNG TIỀN CUỐI CÙNG SAU CHIẾT KHẤU
  const finalTotalPrice = baseTotalPrice - totalDiscount;

  // 4. TIỀN ĐẶT CỌC (10% của tổng tiền cuối cùng)
  const calculatedDepositAmount = Math.round(finalTotalPrice * 0.1);
  const depositAmountForSummary = useWatch("depositAmount", form) || 0; // Lắng nghe giá trị thực tế

  // =================================================================
  // LOGIC TỰ ĐỘNG CẬP NHẬT FIELD (Deposit Override Logic)
  // =================================================================
  
  // Tự động set giá trị 10% vào input mỗi khi tổng tiền thay đổi (ghi đè)
  useEffect(() => {
    // Chỉ set nếu calculatedDepositAmount là số hợp lệ
    if (!isNaN(calculatedDepositAmount)) {
      form.setFieldsValue({ depositAmount: calculatedDepositAmount });
    }
  }, [calculatedDepositAmount, form]);


  // =================================================================
  // SUBMIT FORM
  // =================================================================

  const handleSubmit = async (values) => {
    try {
      if (!values.customerId || !values.details || values.details.length === 0) {
        message.warning("Please fill all required fields and add at least one vehicle!");
        return;
      }

      const apiDetails = values.details
        .filter((item) => item && item.vehicleDetailId && item.quantity > 0)
        .map((item) => ({
          vehicleDetailId: item.vehicleDetailId,
          quantity: item.quantity,
        }));

      if (apiDetails.length === 0) {
        message.warning("Please ensure all vehicle items have a selected vehicle and quantity > 0.");
        return;
      }

      const orderData = {
        customerId: values.customerId,
        dealerId: currentDealerId,
        depositAmount: values.depositAmount || 0,
        promotionId: values.promotionId || null,
        details: apiDetails,
      };

      setLoading(true);
      const response = await postOrderWithVehicleCheck(orderData);
      const createdOrder = response.data;

      message.success(
        `Order #${createdOrder.orderNumber || "New"} created successfully! Total: ${createdOrder.totalAmount?.toLocaleString() || finalTotalPrice.toLocaleString()} VND`
      );

      form.resetFields();
      setItemDetailsMap({});
      navigate("/dealer/orderManagement");
    } catch (err) {
      console.error(err);
      message.error(
        `Failed to create quotation/order! Error: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // =================================================================
  // CỘT BẢNG TỔNG KẾT
  // =================================================================

  const summaryColumns = [
    {
      title: "Vehicle",
      key: "vehicle",
      render: (text, record) => {
        if (!record || !record.vehicleDetailId) return "N/A";
        const vehicle = itemDetailsMap[record.vehicleDetailId];
        return vehicle ? `${vehicle.modelName} - ${vehicle.colorName}` : "N/A";
      },
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "center",
    },
    {
      title: "Unit Price (Listed)",
      key: "unitPrice",
      render: (text, record) => {
        if (!record || !record.vehicleDetailId) return "N/A";
        const vehicle = itemDetailsMap[record.vehicleDetailId];
        const price = calculatePricePerUnit(vehicle);
        return price.toLocaleString() + " VND";
      },
    },
    {
      title: "Subtotal (Base)",
      key: "subtotal",
      align: "right",
      render: (text, record) => {
        if (!record || !record.vehicleDetailId) return "N/A";
        const vehicle = itemDetailsMap[record.vehicleDetailId];
        const unitPrice = calculatePricePerUnit(vehicle);
        const subtotal = unitPrice * (record.quantity || 0);
        return (
          <span className="font-semibold text-base">
            {subtotal.toLocaleString()} VND
          </span>
        );
      },
    },
  ];

  const selectedPromotion = allPromotions.find(
    (p) => p.id === orderPromotionId
  );

  // =================================================================
  // JSX (Giao Diện)
  // =================================================================

  return (
    <Card title="Create New Quotation / Order" className="shadow-md rounded-lg">
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ details: [{}] }}
        >
          
          {/* --- Customer Selection --- */}
          <Form.Item
            label="Select Customer"
            name="customerId"
            rules={[{ required: true, message: "Please select a customer!" }]}
          >
            <Select
              placeholder="Select customer"
              showSearch
              optionFilterProp="children"
            >
              {customers.map((c) => (
                <Option key={c.id} value={c.id}>
                  {`[${c.customerCode}] ${c.fullName} - ${c.phone}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <h3 className="text-lg font-semibold mt-4 mb-3">Vehicle Items 🛒</h3>

          {/* --- Vehicle List (Form.List) --- */}
          <Form.List name="details">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, fieldKey, ...restField }) => (
                  <Card key={key} size="small" className="mb-3 border border-blue-200">
                    <Row gutter={16} align="middle">
                      <Col span={10}>
                        <Form.Item
                          {...restField}
                          name={[name, "vehicleDetailId"]}
                          fieldKey={[fieldKey, "vehicleDetailId"]}
                          label="Select Vehicle"
                          rules={[{ required: true, message: "Missing vehicle" }]}
                        >
                          <Select
                            placeholder="Choose vehicle"
                            showSearch
                            optionFilterProp="children"
                          >
                            {vehicleDetails.map((v) => (
                              <Option key={v.id} value={v.id}>
                                {`${v.modelName} - ${v.versionName} - ${v.colorName}`}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item
                          {...restField}
                          name={[name, "quantity"]}
                          fieldKey={[fieldKey, "quantity"]}
                          label="Quantity"
                          initialValue={1}
                          rules={[{ required: true, message: "Missing quantity" }]}
                        >
                          <InputNumber min={1} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col span={4} className="text-right">
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                          className="mt-2"
                          size="large"
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add Vehicle Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          {/* --- Promotion Selection --- */}
          <Form.Item label="Select Order Promotion" name="promotionId">
            <Select
              placeholder="Select promotion (optional)"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {allPromotions.map((p) => (
                <Option key={p.id} value={p.id}>
                  {`${p.promotionName} (${p.discountValue}${
                    p.discountType === "percentage" ? "%" : " VND"
                  })`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* --- Deposit Amount --- */}
          <Form.Item
            label={`Deposit Amount (10% Recommended: ${calculatedDepositAmount.toLocaleString()} VND)`}
            name="depositAmount"
            rules={[
              { required: true, message: "Please enter deposit amount!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value > finalTotalPrice) {
                    return Promise.reject(
                      new Error(`Deposit cannot exceed Final Total (${finalTotalPrice.toLocaleString()} VND)!`)
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          {/* --- Price Summary --- */}
          <Card title="Price Summary" className="mb-4">
            {items.filter((i) => i && i.vehicleDetailId).length > 0 ? (
              <>
                <Table
                  dataSource={items.filter((i) => i && i.vehicleDetailId)}
                  columns={summaryColumns}
                  rowKey={(record, index) => index}
                  pagination={false}
                  size="small"
                  className="mb-3"
                />
                <Descriptions bordered column={1} size="middle">
                  <Descriptions.Item label="Base Total (Pre-Discount)">
                    {baseTotalPrice.toLocaleString()} VND
                  </Descriptions.Item>
                  <Descriptions.Item label="Applied Promotion">
                    {selectedPromotion
                      ? `${
                          selectedPromotion.promotionName
                        } (${totalDiscount.toLocaleString()} VND)`
                      : "None"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Discount">
                    <span className="font-semibold text-red-600">
                      {totalDiscount.toLocaleString()} VND
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Deposit Amount">
                    <span className="font-semibold text-green-600">
                      {depositAmountForSummary.toLocaleString()} VND
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Final Total Amount">
                    <span className="font-bold text-xl text-red-600">
                      {finalTotalPrice.toLocaleString()} VND
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Remaining Amount">
                    <span className="font-bold text-lg">
                      {(
                        finalTotalPrice - depositAmountForSummary
                      ).toLocaleString()}{" "}
                      VND
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </>
            ) : (
              <div className="text-center p-4 border border-dashed border-gray-300 rounded-md bg-gray-50">
                <p className="text-gray-500">
                  Please add at least one vehicle item above.
                </p>
              </div>
            )}
          </Card>

          {/* --- Submit Button --- */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={
                items.filter((i) => i && i.vehicleDetailId).length === 0
              }
              className="w-full h-10"
            >
              Create Quotation / Order
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
}