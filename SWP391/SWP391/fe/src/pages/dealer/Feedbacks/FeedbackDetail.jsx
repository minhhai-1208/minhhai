// src/components/FeedbackDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Spin,
  message,
  Form,
  Input,
  Select,
} from "antd";
import { getFeedbackById, putFeedback } from "../../../service/feedbacks.api";
import {
  ArrowLeftOutlined,
  EditOutlined,
  SaveOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;

const FeedbackDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const response = await getFeedbackById(id);
      setFeedback(response.data);
      form.setFieldsValue(response.data);
    } catch (error) {
      message.error("Feedback not found or failed to load.");
      console.error("Error fetching feedback detail:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchFeedback();
  }, [id]);

  const handleUpdate = async (values) => {
    setLoading(true);
    try {
      await putFeedback({ ...feedback, ...values, id: parseInt(id) });
      message.success("Feedback updated successfully!");
      setIsEditing(false);
      fetchFeedback();
    } catch (error) {
      message.error("Error updating feedback.");
      console.error("Error updating feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === "open") return "blue";
    if (status === "in_progress") return "geekblue";
    if (status === "resolved") return "green";
    if (status === "closed") return "gray";
    return "default";
  };

  const getPriorityColor = (priority) => {
    if (priority === "high") return "red";
    if (priority === "medium") return "orange";
    return "blue";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Spin size="large" tip="Loading feedback details..." />
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="p-8 text-center text-gray-600 bg-white rounded-xl shadow-lg mt-20 mx-auto max-w-lg">
        Feedback information not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 p-8">
      {/* Back Button */}
      <div className="mb-6 flex justify-between items-center">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/dealer/feedbacks")}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white border-none shadow-md hover:shadow-lg transition-all duration-200"
        >
          Back to List
        </Button>

        <Button
          type="primary"
          icon={isEditing ? <SaveOutlined /> : <EditOutlined />}
          onClick={() => (isEditing ? form.submit() : setIsEditing(true))}
          className={`flex items-center gap-2 px-5 py-2 font-medium rounded-md shadow-md transition-all duration-200 ${
            isEditing
              ? "bg-green-600 hover:bg-green-700 border-none"
              : "bg-yellow-500 hover:bg-yellow-600 border-none"
          } text-white`}
        >
          {isEditing ? "Save Changes" : "Edit"}
        </Button>
      </div>

      {/* Feedback Detail Card */}
      <Card
        className="rounded-xl shadow-2xl border-none bg-white/80 backdrop-blur-sm"
        title={
          <h2 className="text-2xl font-semibold text-blue-600">
            Feedback Detail #{id}
          </h2>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
          initialValues={feedback}
          disabled={!isEditing}
        >
          <Descriptions
            bordered
            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
            className="mb-6 rounded-lg overflow-hidden bg-white"
          >
            <Descriptions.Item label="Customer ID">
              {feedback.customerId}
            </Descriptions.Item>
            <Descriptions.Item label="Dealer ID">
              {feedback.dealerId}
            </Descriptions.Item>
            <Descriptions.Item label="Order ID">
              {feedback.orderId}
            </Descriptions.Item>

            <Descriptions.Item label="Feedback Type">
              <Tag
                color={
                  feedback.feedbackType === "complaint" ? "volcano" : "green"
                }
              >
                {feedback.feedbackType === "complaint"
                  ? "Complaint"
                  : "Feedback"}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Subject">
              {feedback.subject}
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {feedback.description}
            </Descriptions.Item>

            {/* Priority */}
            <Descriptions.Item label="Priority">
              {isEditing ? (
                <Form.Item name="priority" noStyle>
                  <Select className="w-32">
                    <Option value="low">Low</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="high">High</Option>
                  </Select>
                </Form.Item>
              ) : (
                <Tag
                  color={getPriorityColor(feedback.priority)}
                  className="font-semibold"
                >
                  {feedback.priority.toUpperCase()}
                </Tag>
              )}
            </Descriptions.Item>

            {/* Status */}
            <Descriptions.Item label="Status">
              {isEditing ? (
                <Form.Item name="status" noStyle>
                  <Select className="w-40">
                    <Option value="open">Open</Option>
                    <Option value="in_progress">In Progress</Option>
                    <Option value="resolved">Resolved</Option>
                    <Option value="closed">Closed</Option>
                  </Select>
                </Form.Item>
              ) : (
                <Tag
                  color={getStatusColor(feedback.status)}
                  className="font-semibold"
                >
                  {feedback.status.toUpperCase().replace("_", " ")}
                </Tag>
              )}
            </Descriptions.Item>

            {/* Assigned Staff */}
            <Descriptions.Item label="Assigned To">
              {isEditing ? (
                <Form.Item name="assignedToId" noStyle>
                  <Input type="number" min={1} className="w-28" />
                </Form.Item>
              ) : (
                <span>
                  {feedback.assignedToId
                    ? `Staff ${feedback.assignedToId}`
                    : "Unassigned"}
                </span>
              )}
            </Descriptions.Item>

            {/* Resolution Notes */}
            <Descriptions.Item label="Resolution Notes" span={2}>
              {isEditing ? (
                <Form.Item name="resolutionNotes" noStyle>
                  <TextArea rows={4} className="rounded-md" />
                </Form.Item>
              ) : (
                <span>{feedback.resolutionNotes || "—"}</span>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Form>
      </Card>
    </div>
  );
};

export default FeedbackDetail;
