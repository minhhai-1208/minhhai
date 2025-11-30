// services/promotion.api.js
import api from "../config/axios"; // Sử dụng instance Axios đã cấu hình

const API = "/promotions"; // Endpoint sau baseURL (/api/promotions)

// 📌 Lấy danh sách tất cả khuyến mãi
export const fetchPromotions = async () => {
    // GET /promotions (sẽ là /api/promotions)
    return await  api.get(API);
    // const res = await api.get(API);
    // return res.data;
};

// 📌 Thêm khuyến mãi mới
export const postPromotion = async (promotionData) => {
    // POST /promotions
    return await api.post(API, promotionData);
};

// 📌 Cập nhật khuyến mãi theo id
export const putPromotion = async (promotionData) => {
    // PUT /promotions/{id}
    return await api.put(`${API}/${promotionData.id}`, promotionData);
};

// 📌 Xóa khuyến mãi theo id
export const removePromotion = async (id) => {
    // DELETE /promotions/{id}
    return await api.delete(`${API}/${id}`);
};