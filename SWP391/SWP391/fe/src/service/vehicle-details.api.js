import api from "../config/axios";

const API = "/vehicle-details";

// 📌 Lấy danh sách xe
export const fetchVehicleDetails = async () => {
  return await api.get(API);
};

// 📌 Thêm xe mới
export const postVehicleDetails = async (vehicle) => {
  return await api.post(API, vehicle);
};

// 📌 Cập nhật xe (dựa vào vehicle.id)
export const putVehicleDetails = async (vehicle) => {
  return await api.put(`${API}/${vehicle.id}`, vehicle);
};

// 📌 Xóa xe theo id
export const removeVehicleDetails = async (id) => {
  return await api.delete(`${API}/${id}`);
};

// 📌 Lấy chi tiết xe theo id
export const getVehicleDetailById = async (id) => {
  return await api.get(`${API}/${id}`);
};
