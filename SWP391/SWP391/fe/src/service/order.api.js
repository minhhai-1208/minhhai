import api from "../config/axios";

// 📌 Sửa đổi: Đặt API là /order. Vì config/axios đã có /api, URL cuối cùng sẽ là /api/order
const API = "/order";

// --- Các hàm đã có (đã sửa endpoint) ---

// 📌 Lấy danh sách tất cả đơn hàng
export const fetchOrders = async () => {
  // GET /api/order
  const res = await api.get(API); // Gọi đến /order
  return res.data; // ✅ Trả về dữ liệu
};

// 📌 Lấy chi tiết đơn hàng theo id
export const getOrderById = async (id) => {
  // GET /api/order/{id}
  const res = await api.get(`${API}/${id}`);
  return res.data;
};

// 📌 Cập nhật đơn hàng (dựa vào order.id)
export const putOrder = async (order) => {
  // PUT /api/order/{id}
  return await api.put(`${API}/${order.id}`, order);
};

// 📌 Xóa đơn hàng theo id
export const removeOrder = async (id) => {
  // DELETE /api/order/{id}
  return await api.delete(`${API}/${id}`);
};

// --- Các hàm mới (dựa trên endpoint mới) ---

// 📌 Tạo đơn hàng và kiểm tra xe trong kho
export const postOrderWithVehicleCheck = async (orderData) => {
  // POST /api/order/with-vehicle-check
  return await api.post(`${API}/with-vehicle-check`, orderData);
};

// 📌 Xử lý sau khi đặt cọc
export const processAfterDeposit = async (orderId) => {
  // POST /api/order/{orderId}/process-after-deposit
  return await api.post(`${API}/${orderId}/process-after-deposit`);
};

// 📌 Thêm chi tiết xe vào đơn hàng
export const addVehicleDetailsToOrder = async (orderId, vehicleDetails) => {
  // POST /api/order/{orderId}/details
  return await api.post(`${API}/${orderId}/details`, vehicleDetails);
};

// 📌 Kiểm tra xe trong kho cho đơn hàng
export const checkVehicleForOrder = async (orderId) => {
  // GET /api/order/{orderId}/check-vehicle
  return await api.get(`${API}/${orderId}/check-vehicle`);
};