import api from "../config/axios";

const API = "/vehicle-versions";

// 📌 Lấy danh sách xe
export const fetchVehicleVersions = async () => {
  return await api.get(API);
};

// 📌 Thêm xe mới
export const postVehicleVersions = async (vehicle) => {
  return await api.post(`${API}?modelId=${vehicle.modelId}`, vehicle);
};

// 📌 Cập nhật xe (dựa vào vehicle.id)
export const putVehicleVersions = async (vehicle) => {
  return await api.put(`${API}/${vehicle.id}?modelId=${vehicle.modelId}`, vehicle);
};


// 📌 Xóa xe theo id
export const removeVehicleVersions = async (id) => {
  return await api.delete(`${API}/${id}`);
};

// 📌 Lấy chi tiết xe theo id
export const getVehicleVersionById = async (id) => {
  return await api.get(`${API}/${id}`);
};
