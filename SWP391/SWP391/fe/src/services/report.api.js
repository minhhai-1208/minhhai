import api from "../config/axios";

const API = "/reports";

/**
 * Lấy báo cáo doanh số theo khu vực
 * GET /api/reports/regional-sales
 * @param {number} year - Năm cần báo cáo
 */
export const fetchRegionalSales = async (year) => {
    // SỬA: Thêm Query Parameter year
    return await api.get(`${API}/regional-sales`, { params: { year } });
};

/**
 * Lấy báo cáo tồn kho và tiêu thụ
 * GET /api/reports/inventory-consumption
 * @param {number} year - Năm cần báo cáo
 */
export const fetchInventoryConsumption = async (year) => {
    // SỬA: Thêm Query Parameter year
    return await api.get(`${API}/inventory-consumption`, { params: { year } });
};

/**
 * Lấy báo cáo công nợ của đại lý đối với hãng xe
 * GET /api/reports/dealer-debt-report/{dealerId}
 * @param {number} dealerId - ID của đại lý
 */
export const fetchDealerDebtReport = async (dealerId) => {
    // SỬA: Truyền dealerId qua Path Variable
    return await api.get(`${API}/dealer-debt-report/${dealerId}`);
};

/**
 * Lấy báo cáo công nợ của hãng xe (phải thu từ tất cả đại lý)
 * GET /api/reports/company-debt-report
 */
export const fetchCompanyDebtReport = async () => {
    return await api.get(`${API}/company-debt-report`);
};


// -------------------------------------------------------------
// * Các API cũ (Đã được giữ lại hoặc cập nhật tên cho rõ ràng hơn)
// -------------------------------------------------------------

/**
 * Lấy báo cáo doanh số của nhân viên (Hãng xe - EVM Staff)
 * GET /api/reports/employee
 * * Lưu ý: Giả định API này là /api/reports/dealer/staff-revenue, 
 * nếu cần, hãy đổi tên và URL cho đúng với BE
 */
export const fetchEmployeeReport = async () => {
    // URL này có thể cần được chỉnh lại nếu BE dùng /api/reports/dealer/staff-revenue
    return await api.get(`${API}/employee`);
};

/**
 * Lấy báo cáo doanh số theo từng đại lý
 * GET /api/reports/dealer/monthly-revenue
 * * Lưu ý: Giả định API này dùng cho báo cáo doanh thu hàng tháng của đại lý
 */
export const fetchDealerMonthlyRevenue = async (dealerId) => {
    // URL này có thể cần được chỉnh lại nếu BE dùng /api/reports/dealer/monthly-revenue
    return await api.get(`${API}/dealer/monthly-revenue/${dealerId}`);
};

// API Lấy số liệu thống kê tổng quan (Dashboard)
export const fetchDashboardStats = async () => {
    return await api.get(`${API}/dashboard-stats`);
};