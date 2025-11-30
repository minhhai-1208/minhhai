import api from "../config/axios";
import dayjs from "dayjs";

const API = "/reports";

// ==================================================
// 🔹 Hàm tiện ích: Lấy dealerId từ localStorage
// ==================================================
const getDealerId = () => {
  try {
    const account = JSON.parse(localStorage.getItem("account"));
    return account?.dealerId ? Number(account.dealerId) : null;
  } catch (error) {
    console.error("❌ Lỗi khi đọc dealerId từ localStorage:", error);
    return null;
  }
};

// ==================================================
// 📊 1️⃣ Lấy báo cáo nhân viên (GET /api/reports/employee)
// ==================================================
export const fetchEmployeeReport = async () => {
  try {
    const res = await api.get(`${API}/employee`);
    return res.data; 
    /**
     * 📦 Dữ liệu trả về ví dụ:
     * {
     *   "reportDate": "2025-10-23",
     *   "employeeSales": [
     *     {
     *       "employeeId": 15,
     *       "employeeName": "Anh Khoi",
     *       "employeeRole": "staff",
     *       "totalOrders": 20,
     *       "completedOrders": 0
     *     }
     *   ]
     * }
     */
  } catch (error) {
    console.error("❌ Lỗi khi lấy báo cáo nhân viên:", error);
    throw error;
  }
};

// ==================================================
// 📊 2️⃣ Lấy báo cáo theo đại lý (GET /api/reports/dealer/{dealer_id})
// ==================================================
export const fetchDealerReport = async () => {
  const dealerId = getDealerId();

  if (!dealerId) {
    console.error("⚠️ Không tìm thấy Dealer ID trong localStorage.");
    throw new Error("Dealer ID not found in localStorage.");
  }

  try {
    const res = await api.get(`${API}/dealer/${dealerId}`);
    return res.data;
    /**
     * 📦 Dữ liệu trả về ví dụ:
     * {
     *   "dealerId": 2,
     *   "dealerName": "Đại lý 2",
     *   "dealerLocation": "Hồ Chí Minh, Nam",
     *   "totalOrders": 10,
     *   "completedOrders": 1,
     *   "conversionRate": 0
     * }
     */
  } catch (error) {
    console.error("❌ Lỗi khi lấy báo cáo đại lý:", error);
    throw error;
  }
};

// ==================================================
// 📅 3️⃣ Hàm tuỳ chọn: Lấy báo cáo trong khoảng ngày
// (nếu backend có hỗ trợ query theo ngày trong tương lai)
// ==================================================
export const fetchDealerReportByDate = async (startDate, endDate) => {
  const dealerId = getDealerId();

  if (!dealerId) {
    console.error("⚠️ Không tìm thấy Dealer ID trong localStorage.");
    throw new Error("Dealer ID not found in localStorage.");
  }

  const formattedStart = dayjs(startDate).format("YYYY-MM-DD");
  const formattedEnd = dayjs(endDate).format("YYYY-MM-DD");

  try {
    const res = await api.get(`${API}/dealer/${dealerId}`, {
      params: { startDate: formattedStart, endDate: formattedEnd },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy báo cáo đại lý theo ngày:", error);
    throw error;
  }
};
