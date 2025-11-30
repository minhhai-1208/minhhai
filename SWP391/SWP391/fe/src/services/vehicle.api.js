import api from "../config/axios";

const API = "/vehicles";

// 🔹 Lấy danh sách tất cả vehicle
export const fetchVehicles = async () => {
  return (await api.get(API)).data;
};

// 🔹 Thêm mới vehicle
export const postVehicle = async (vehicle) => {
  return await api.post(API, vehicle);
};

// 🔹 Cập nhật vehicle (phải có id)
export const putVehicle = async (vehicle) => {
  return await api.put(`${API}/${vehicle.id}`, vehicle);
};

// 🔹 Xóa vehicle theo id
export const removeVehicle = async (id) => {
  return await api.delete(`${API}/${id}`);
};
