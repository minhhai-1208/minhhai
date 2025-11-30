import api from "../config/axios";

const API = "/distribution";

// 📦 Lấy tất cả bản ghi (có hỗ trợ phân trang)
export const fetchVehicleDistributions = async (params) => {
  return await api.get(API, { params });
};

// 🔍 Lấy theo orderId
export const fetchDistributionByOrderId = async (orderId) => {
  return await api.get(`${API}/order/${orderId}`);
};

// ➕ Tạo mới bản ghi
export const postVehicleDistribution = async (data) => {
  return await api.post(API, data);
};

// ✏️ Cập nhật thông tin phân phối
export const putVehicleDistribution = async (data) => {
  const { id, ...payload } = data;
  return await api.put(`${API}/${id}`, payload);
};

// 🗑️ Xóa bản ghi
export const removeVehicleDistribution = async (id) => {
  return await api.delete(`${API}/${id}`);
};

// 🔄 Cập nhật trạng thái (status)
export const updateDistributionStatus = async (id, status) => {
  return await api.put(`${API}/${id}/status?status=${status}`);
};

// ✅ Hoàn thành giao xe
export const completeVehicleDistribution = async (id) => {
  return await api.put(`${API}/${id}/complete`);
};

// 🚚 Bắt đầu giao xe (theo orderId)
export const startDeliverVehicle = async (orderId) => {
  return await api.post(`${API}/deliver/${orderId}`);
};
