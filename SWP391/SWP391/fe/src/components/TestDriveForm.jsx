// src/components/TestDriveForm.jsx

import React, { useEffect } from "react";
import { Form, Input, DatePicker, InputNumber, Select, Modal } from "antd";
import dayjs from "dayjs";

const { Option } = Select;
const DURATION_OPTIONS = [30, 60, 90];

const TestDriveForm = ({
  open,
  onCancel,
  initialValues,
  onSave,
  staffOptions = [],
  customerOptions = [],
  vehicleOptions = [],
}) => {
  const [form] = Form.useForm();

  // Load existing data
  useEffect(() => {
    if (initialValues) {
      // When editing, fill IDs into the new Form.Item fields (customerId, staffId, inventoryId)
      form.setFieldsValue({
        ...initialValues,
        // Assume backend returns ID on GET:
        customerId: initialValues.customerId || initialValues.customerName, // Fallback if backend returns Name
        staffId: initialValues.staffId || initialValues.staffName,
        inventoryId: initialValues.inventoryId,

        appointmentDate: initialValues.appointmentDate
          ? dayjs(initialValues.appointmentDate)
          : null,
        actualDate: initialValues.actualDate
          ? dayjs(initialValues.actualDate)
          : null,
      });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      const dataToSend = {
        ...values,
        appointmentDate: values.appointmentDate
          ? values.appointmentDate.toISOString()
          : null,
        actualDate: values.actualDate ? values.actualDate.toISOString() : null,
        ...(initialValues && { id: initialValues.id }),
      };
      onSave(dataToSend);
      form.resetFields();
    });
  };

  return (
    <Modal
      open={open}
      title={initialValues ? "Update Test Drive" : "Add New Test Drive"}
      okText="Save"
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={handleOk}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        name="test_drive_form"
        initialValues={{ status: "Scheduled", durationMinutes: 30 }}
      >
        <div className="grid grid-cols-2 gap-4">
          {/* FIELD 1: Select Customer (using customerId) */}
          <Form.Item
            name="customerId"
            label="Customer"
            rules={[{ required: true, message: "Please select a customer!" }]}
          >
            <Select
              placeholder="Select a dealership customer"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {customerOptions.map((c) => (
                <Option key={c.id} value={c.id}>
                  {`${c.fullName}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* FIELD 2: Select Vehicle (using inventoryId) */}
          <Form.Item
            name="inventoryId"
            label="Vehicle"
            rules={[{ required: true, message: "Please select a vehicle!" }]}
          >
            <Select
              placeholder="Select an available vehicle"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {vehicleOptions.map((v) => (
                // Send the vehicle detail ID (assuming it's inventoryId)
                <Option key={v.id} value={v.id}>
                  {`${v.modelName} - ${v.versionName} (${v.colorName})`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* FIELD 3: Select Staff (using staffId) */}
          <Form.Item
            name="staffId"
            label="Assigned Staff"
            rules={[
              { required: true, message: "Please select a staff member!" },
            ]}
          >
            <Select placeholder="Select a dealership staff member">
              {staffOptions.map((staff) => (
                <Option key={staff.id} value={staff.id}>
                  {`${staff.fullName}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* FIELD 4: Duration */}
          <Form.Item
            name="durationMinutes"
            label="Duration (Minutes)"
            rules={[{ required: true, message: "Please select a duration!" }]}
          >
            <Select>
              {DURATION_OPTIONS.map((duration) => (
                <Option key={duration} value={duration}>
                  {duration} minutes
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="appointmentDate"
            label="Appointment Date"
            rules={[
              { required: true, message: "Please select an appointment date!" },
            ]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" className="w-full" />
          </Form.Item>

          <Form.Item name="actualDate" label="Actual Date (If any)">
            <DatePicker showTime format="YYYY-MM-DD HH:mm" className="w-full" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select a status!" }]}
          >
            <Select>
              <Option value="Scheduled">Scheduled</Option>
              <Option value="Completed">Completed</Option>
              <Option value="Cancelled">Cancelled</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item name="customerFeedback" label="Customer Feedback">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Form.Item name="staffNotes" label="Staff Notes">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TestDriveForm;
