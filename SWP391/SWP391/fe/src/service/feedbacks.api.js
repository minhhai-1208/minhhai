import api from "../config/axios";

const API = "/feedbacks";

// 📌 Lấy danh sách phản hồi
export const fetchFeedbacks = async () => {
  return await api.get(API);
};

// 📌 Thêm phản hồi mới
export const postFeedback = async (feedback) => {
  return await api.post(API, feedback);
};

// 📌 Cập nhật phản hồi (dựa vào feedback.id)
export const putFeedback = async (feedback) => {
  return await api.put(`${API}/${feedback.id}`, feedback);
};

// 📌 Xóa phản hồi theo id
export const removeFeedback = async (id) => {
  return await api.delete(`${API}/${id}`);
};

// 📌 Lấy chi tiết phản hồi theo id
export const getFeedbackById = async (id) => {
  return await api.get(`${API}/${id}`);
};
