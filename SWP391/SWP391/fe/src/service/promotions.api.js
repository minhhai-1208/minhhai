import api from "../config/axios";

// 📌 Cập nhật API constant
const API = "/promotions";

// 📌 Lấy danh sách khuyến mãi
// GET /api/promotions
export const fetchPromotions = async () => {
  return await api.get(API);
};

// 📌 Thêm khuyến mãi mới
// POST /api/promotions
export const postPromotion = async (promotion) => {
  return await api.post(API, promotion);
};

// 📌 Cập nhật khuyến mãi (dựa vào promotion.id)
// PUT /api/promotions/{id}
export const putPromotion = async (promotion) => {
  return await api.put(`${API}/${promotion.id}`, promotion);
};

// 📌 Xóa khuyến mãi theo id
// DELETE /api/promotions/{id}
export const removePromotion = async (id) => {
  return await api.delete(`${API}/${id}`);
};
