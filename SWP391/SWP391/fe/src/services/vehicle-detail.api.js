// src/services/vehicle-detail.api.js
import api from "../config/axios";

const API = "/vehicle-details";

// 📌 Lấy danh sách chi tiết xe
export const fetchVehicleDetails = async () => {
return await api.get(API);
};

// 📌 Thêm chi tiết xe mới
export const postVehicleDetail = async (detail) => {
return await api.post(API, detail);
};

// 📌 Cập nhật chi tiết xe theo id
export const putVehicleDetail = async (detail) => {
return await api.put(`${API}/${detail.id}`, detail);
};

// 📌 Xóa chi tiết xe theo id
export const removeVehicleDetail = async (id) => {
return await api.delete(`${API}/${id}`);
};

// 📌 Lấy chi tiết xe theo id
export const getVehicleDetailById = async (id) => {
return await api.get(`${API}/${id}`);
};