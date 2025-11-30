import api from "../config/axios";

const API = "/order";

// 📌 Lấy danh sách tất cả đơn hàng (GET /api/order)
export const fetchOrders = async () => {
  return await api.get(API);
};

// 📌 Lấy chi tiết đơn hàng theo id (GET /api/order/{id})
export const getOrderById = async (id) => {
  return await api.get(`${API}/${id}`);
};

// 📌 Thêm đơn hàng mới (POST /api/order)
export const postOrder = async (order) => {
  return await api.post(API, order);
};

// 📌 Cập nhật đơn hàng theo id (PUT /api/order/{id})
export const putOrder = async (order) => {
  // Đảm bảo payload chứa ID để PUT đúng endpoint
  return await api.put(`${API}/${order.id}`, order);
};

// 📌 Xóa đơn hàng theo id (DELETE /api/order/{id})
export const removeOrder = async (id) => {
  return await api.delete(`${API}/${id}`);
};

// 📌 Thêm chi tiết đơn hàng (POST /api/order/{orderId}/details)
export const postOrderDetails = async ({ orderId, details }) => {
  return await api.post(`${API}/${orderId}/details`, details);
};
// ✅ API MỚI: Lấy danh sách xe cần phân phối cho đơn hàng
export const fetchVehiclesToDistribute = async (orderId) => {
    return await api.get(`${API}/${orderId}/vehicles-to-distribute`);
};
export const autoCreateDistributionRequest = async (orderId) => {
    return await api.post(`/order/${orderId}/create-distribution-requests`);
};