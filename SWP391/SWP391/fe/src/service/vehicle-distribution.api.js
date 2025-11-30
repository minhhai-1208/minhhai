// vehicle-distribution.api.js
import api from "../config/axios";

const API = "/distribution";

// 📌 Lấy danh sách tất cả phân phối
export const fetchVehicleDistributions = async () => {
  return await api.get(API);
};

// 📌 Lấy chi tiết phân phối theo ID
export const getVehicleDistributionById = async (id) => {
  return await api.get(`${API}/${id}`);
};

// 📌 Thêm phân phối mới
export const postVehicleDistribution = async (distribution) => {
  return await api.post(API, distribution);
};

// 📌 Cập nhật phân phối theo ID
export const putVehicleDistribution = async (distribution) => {
  return await api.put(`${API}/${distribution.id}`, distribution);
};

// 📌 Cập nhật trạng thái phân phối theo ID
export const putVehicleDistributionStatus = async (id, status) => {
  return await api.put(`${API}/${id}/status`, { status });
};

// 📌 Đánh dấu phân phối là hoàn tất theo ID
export const putVehicleDistributionComplete = async (id, completeData) => {
  // completeData có thể là { deliveredAt, notes, ... } tuỳ backend
  return await api.put(`${API}/${id}/complete`, completeData);
};

// 📌 Xóa phân phối theo ID
export const removeVehicleDistribution = async (id) => {
  return await api.delete(`${API}/${id}`);
};

// 📌 Giao phân phối cho đơn hàng (Deliver)
export const postDeliverVehicleDistribution = async (orderId, deliverData) => {
  // deliverData có thể là { vehicleIds, notes, ... } tuỳ backend
  return await api.post(`${API}/deliver/${orderId}`, deliverData);
};

// 📌 Lấy phân phối theo orderId
export const fetchDistributionByOrderId = async (orderId) => {
  return await api.get(`${API}/order/${orderId}`);
};
