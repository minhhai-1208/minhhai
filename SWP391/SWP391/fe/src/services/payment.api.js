// src/services/payment.api.js
import api from "../config/axios";

const API = "/payments";

// Lấy danh sách thanh toán
export const fetchPayments = async () => {
 return await api.get(API);
};

// Cập nhật trạng thái thanh toán
export const putPaymentStatus = async (id, statusData) => {
// PUT /api/payments/{id}/status
 return await api.put(`${API}/${id}/status`, statusData);
};

// Lấy chi tiết thanh toán theo id
export const getPaymentById = async (id) => {
 return await api.get(`${API}/${id}`);
};