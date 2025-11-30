import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import Customers from "../Customers";
import dayjs from "dayjs";

// =========================================================================
// 🛠️ KHẮC PHỤC LỖI JSDOM (MOCK NÀY RẤT QUAN TRỌNG)
// =========================================================================

// 1. Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 2. Mock window.getComputedStyle
if (typeof window !== "undefined" && !window.getComputedStyle) {
  window.getComputedStyle = () => ({
    getPropertyValue: () => "",
  });
}

// 🧩 Mock các API gọi ra ngoài
jest.mock("../../../../service/customers.api", () => ({
  fetchCustomers: jest.fn(),
  postCustomer: jest.fn(),
  putCustomer: jest.fn(),
  removeCustomer: jest.fn(),
}));

jest.mock("../../../../service/order.api", () => ({
  fetchOrders: jest.fn(),
}));

// 🧩 Mock message của Ant Design
jest.mock("antd", () => {
  const antd = jest.requireActual("antd");
  return {
    ...antd,
    message: {
      success: jest.fn(),
      error: jest.fn(),
    },
  };
});

import {
  fetchCustomers,
  postCustomer,
  putCustomer,
  removeCustomer,
} from "../../../../service/customers.api";
import { fetchOrders } from "../../../../service/order.api";
import { message } from "antd";

// Dữ liệu mock cơ bản (ĐÃ THÊM ID NUMBER)
const MOCK_CUSTOMERS = [
  {
    id: 1,
    dealerId: 1,
    fullName: "Nguyen Van A",
    customerCode: "C001",
    idNumber: "123456789",
  },
];

// **********************************************
// HÀM TIỆN ÍCH ĐỂ GIẢI QUYẾT LỖI SUBMIT TRONG MODAL/JSDOM
// **********************************************
const clickSaveButton = async () => {
  const saveButton = screen.getByRole("button", { name: /Save/i });
  // Dùng act để kích hoạt event và chờ đợi microtasks (API/Form) hoàn tất
  await act(async () => {
    fireEvent.click(saveButton);
    // Cần Promise.resolve để flush microtasks, giải quyết lỗi "Received number of calls: 0"
    await Promise.resolve();
  });
};

// 🧪 Bắt đầu test
describe("Customers Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Đảm bảo luôn có dealerId để kích hoạt useEffect
    localStorage.setItem("account", JSON.stringify({ dealerId: 1 }));
  });

  // =========================================================================
  // 🚀 CÁC BÀI TEST ĐÃ FIX LỖI API CALL VÀ TIMING
  // =========================================================================

  // 11: Xử lý lỗi khi Fetch Data (Line 62)
  test("11: shows error message when loading customers/orders fails", async () => {
    fetchCustomers.mockRejectedValueOnce(new Error("Fetch Error"));
    fetchOrders.mockResolvedValueOnce([]);

    render(<Customers />);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith(
        "Failed to load customers or orders!"
      );
    });
  });

  // 12: Xử lý lỗi khi Edit thất bại (Line 105)
  test("12: shows error message when editing existing customer fails", async () => {
    fetchCustomers.mockResolvedValueOnce({ data: MOCK_CUSTOMERS });
    fetchOrders.mockResolvedValueOnce([]);
    putCustomer.mockRejectedValueOnce(new Error("Edit Error"));

    render(<Customers />);

    const editButton = await screen.findByRole("button", { name: /Edit/i });
    fireEvent.click(editButton);

    await waitFor(() => screen.getByText(/Edit Customer/i));

    fireEvent.change(screen.getByLabelText(/Customer Code/i), {
      target: { value: "C001" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "Nguyen Van A" },
    });
    fireEvent.change(screen.getByLabelText(/ID Number/i), {
      target: { value: "123456789" },
    });

    // 💡 FIX: Sử dụng hàm tiện ích
    await clickSaveButton();

    await waitFor(() => {
      expect(putCustomer).toHaveBeenCalled();
      // Sửa expect message để khớp với logic báo lỗi chi tiết trong JSX
      expect(message.error).toHaveBeenCalledWith(
        "Failed to save customer! Error: Edit Error"
      );
    });
  });

  // 13: Xử lý lỗi khi Delete thất bại (Line 123)
  test("13: shows error message when deleting customer fails", async () => {
    fetchCustomers.mockResolvedValueOnce({ data: MOCK_CUSTOMERS });
    fetchOrders.mockResolvedValueOnce([]);
    removeCustomer.mockRejectedValueOnce(new Error("Delete Error"));

    render(<Customers />);

    const deleteButtonInTable = await screen.findByRole("button", {
      name: /Delete/i,
    });
    fireEvent.click(deleteButtonInTable);

    // Confirm trong Popconfirm
    await act(async () => {
      const allDeleteButtons = screen.queryAllByRole("button", {
        name: /Delete/i,
      });
      const confirmButton = allDeleteButtons.pop();

      if (confirmButton) {
        fireEvent.click(confirmButton);
      }
    });

    await waitFor(() => {
      expect(removeCustomer).toHaveBeenCalled();
      expect(message.error).toHaveBeenCalledWith("Failed to delete customer!");
    });
  });

  // 14: Case không có đơn hàng (Line 249-251)
  test('14: shows "no orders yet" message when viewing a customer with no orders', async () => {
    fetchCustomers.mockResolvedValueOnce({
      data: [
        {
          id: 15,
          dealerId: 1,
          fullName: "No Order Customer",
          customerCode: "C008",
          idNumber: "000",
        },
      ],
    });
    // Trả về mảng rỗng cho đơn hàng
    fetchOrders.mockResolvedValueOnce([]);

    render(<Customers />);

    const viewBtn = await screen.findByRole("button", { name: /View Orders/i });
    fireEvent.click(viewBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Orders of No Order Customer/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/This customer has no orders yet/i)
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 🔄 CÁC BÀI TEST CŨ ĐÃ ĐƯỢC CHÈN LẠI VÀ SỬA LỖI ACT/LOGIC
  // =========================================================================

  // 1️⃣ Kiểm tra render UI cơ bản
  test("renders Customer Management and Add button", async () => {
    fetchCustomers.mockResolvedValueOnce({ data: [] });
    fetchOrders.mockResolvedValueOnce([]);

    render(<Customers />);

    await waitFor(() => {
      expect(screen.getByText(/Customer Management/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Add Customer/i })
      ).toBeInTheDocument();
    });
  });

  // 2️⃣ Hiển thị danh sách khách hàng
  // TRONG Test 2
  test("loads and displays customer list", async () => {
    fetchCustomers.mockResolvedValueOnce({
      data: MOCK_CUSTOMERS,
    });
    fetchOrders.mockResolvedValueOnce([]);

    render(<Customers />);

    // 💡 FIX: Kiểm tra ID Number thay vì Customer Code
    await screen.findByText("Nguyen Van A");
    await screen.findByText("123456789"); // ID Number từ MOCK_CUSTOMERS

    expect(screen.getByText("Nguyen Van A")).toBeInTheDocument();
    expect(screen.getByText("123456789")).toBeInTheDocument();
  });

  // 3️⃣ Mở modal Add Customer
  test("opens Add Customer modal when clicking Add button", async () => {
    fetchCustomers.mockResolvedValueOnce({ data: [] });
    fetchOrders.mockResolvedValueOnce([]);

    render(<Customers />);
    const addButton = await screen.findByRole("button", {
      name: /Add Customer/i,
    });

    fireEvent.click(addButton);
    await waitFor(() => {
      expect(screen.getByText(/Add New Customer/i)).toBeInTheDocument();
    });
  });

  // 4️⃣ Validate dữ liệu trống
  test("shows validation errors when form is submitted empty", async () => {
    fetchCustomers.mockResolvedValueOnce({ data: [] });
    fetchOrders.mockResolvedValueOnce([]);

    render(<Customers />);
    const addButton = await screen.findByRole("button", {
      name: /Add Customer/i,
    });
    fireEvent.click(addButton);

    await waitFor(() => screen.getByText(/Add New Customer/i));

    const saveButton = screen.getByRole("button", { name: /Save/i });

    // 💡 FIX: Dùng act để kích hoạt submit
    await clickSaveButton();

    await waitFor(() => {
      expect(
        screen.getByText(/Please enter customer code/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Please enter full name/i)).toBeInTheDocument();
      // Kiểm tra validation mới cho ID Number
      expect(screen.getByText(/Please enter ID Number/i)).toBeInTheDocument();
    });
  });

  // 5️⃣ Submit thêm mới thành công
  test("adds new customer successfully", async () => {
    fetchCustomers.mockResolvedValue({ data: [] });
    fetchOrders.mockResolvedValue([]);
    postCustomer.mockResolvedValueOnce({ success: true });

    render(<Customers />);
    const addButton = await screen.findByRole("button", {
      name: /Add Customer/i,
    });
    fireEvent.click(addButton);

    await waitFor(() => screen.getByText(/Add New Customer/i));

    fireEvent.change(screen.getByLabelText(/Customer Code/i), {
      target: { value: "C002" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "Le Thi B" },
    });
    // Bắt buộc nhập ID Number theo JSX mới
    fireEvent.change(screen.getByLabelText(/ID Number/i), {
      target: { value: "99999" },
    });

    // 💡 FIX: Dùng act để chờ Form submit và API gọi
    await clickSaveButton();

    await waitFor(() => {
      expect(postCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          customerCode: "C002",
          fullName: "Le Thi B",
          idNumber: "99999",
          dateOfBirth: null,
        })
      );
      expect(message.success).toHaveBeenCalledWith(
        "Customer added successfully!"
      );
    });
  });

  // 6️⃣ Lỗi khi gọi API (Add)
  test("shows error message when API fails", async () => {
    fetchCustomers.mockResolvedValueOnce({ data: [] });
    fetchOrders.mockResolvedValueOnce([]);
    postCustomer.mockRejectedValueOnce(new Error("API error"));

    render(<Customers />);
    const addButton = await screen.findByRole("button", {
      name: /Add Customer/i,
    });
    fireEvent.click(addButton);

    await waitFor(() => screen.getByText(/Add New Customer/i));

    fireEvent.change(screen.getByLabelText(/Customer Code/i), {
      target: { value: "C003" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "Tran Van C" },
    });
    // Bắt buộc nhập ID Number theo JSX mới
    fireEvent.change(screen.getByLabelText(/ID Number/i), {
      target: { value: "99999" },
    });

    // 💡 FIX: Sử dụng hàm tiện ích
    await clickSaveButton();

    await waitFor(() => {
      // Sửa expect message để khớp với logic báo lỗi chi tiết trong JSX
      expect(message.error).toHaveBeenCalledWith(
        "Failed to save customer! Error: API error"
      );
    });
  });

  // 7️⃣ Cập nhật (Edit Customer) - Đã thêm await act và test DatePicker branch
  test("edits existing customer successfully including date of birth", async () => {
    fetchCustomers.mockResolvedValueOnce({
      data: [
        {
          id: 5,
          dealerId: 1,
          fullName: "Pham Van D",
          customerCode: "C004",
          dateOfBirth: "2000-01-01",
          idNumber: "12345",
        },
      ],
    });
    fetchOrders.mockResolvedValueOnce([]);
    putCustomer.mockResolvedValueOnce({ success: true });

    render(<Customers />);

    const editButton = await screen.findByRole("button", { name: /Edit/i });
    fireEvent.click(editButton);

    await waitFor(() => screen.getByText(/Edit Customer/i));

    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: "Pham Van D Updated" } });

    // Giả lập giá trị dayjs được set vào form, kích hoạt branch dateOfBirth
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), {
      target: { value: "2000-01-01" },
    });

    // 💡 FIX: Sử dụng hàm tiện ích
    await clickSaveButton();

    await waitFor(() => {
      expect(putCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Pham Van D Updated",
          id: 5,
          idNumber: "12345",
          dateOfBirth: "2000-01-01",
        })
      );
      expect(message.success).toHaveBeenCalledWith(
        "Customer updated successfully!"
      );
    });
  });

  // 8️⃣ Xóa khách hàng
  test("deletes customer successfully", async () => {
    fetchCustomers.mockResolvedValueOnce({
      data: [
        {
          id: 10,
          dealerId: 1,
          fullName: "Delete Test",
          customerCode: "C005",
          idNumber: "111",
        },
      ],
    });
    fetchOrders.mockResolvedValueOnce([]);
    removeCustomer.mockResolvedValueOnce({ success: true });

    render(<Customers />);

    // 🧩 Bước 1: Click vào nút Delete trong bảng để mở Popconfirm
    const deleteButtonInTable = await screen.findByRole("button", {
      name: /Delete/i,
    });
    fireEvent.click(deleteButtonInTable);

    // 🧩 Bước 2: Click vào nút Confirm/Delete trong Popconfirm
    await act(async () => {
      const allDeleteButtons = screen.queryAllByRole("button", {
        name: /Delete/i,
      });
      const confirmButton = allDeleteButtons.pop(); // Nút cuối cùng thường là nút xác nhận

      if (confirmButton) {
        fireEvent.click(confirmButton);
      }
    });

    // 🧩 Bước 3: Kiểm tra API và thông báo thành công được gọi
    await waitFor(() => {
      expect(removeCustomer).toHaveBeenCalledWith(10);
      expect(message.success).toHaveBeenCalledWith(
        "Customer deleted successfully!"
      );
    });
  });

  // 9️⃣ Xem đơn hàng
  test("shows orders when clicking View Orders", async () => {
    fetchCustomers.mockResolvedValueOnce({
      data: [
        {
          id: 11,
          dealerId: 1,
          fullName: "Order Tester",
          customerCode: "C006",
          idNumber: "222",
        },
      ],
    });
    fetchOrders.mockResolvedValueOnce([
      { id: 1, customerId: 11, orderNumber: "O001", totalAmount: 1000 },
    ]);

    render(<Customers />);

    const viewBtn = await screen.findByRole("button", { name: /View Orders/i });
    fireEvent.click(viewBtn);

    await waitFor(() => {
      expect(screen.getByText(/Orders of Order Tester/i)).toBeInTheDocument();
      expect(screen.getByText("O001")).toBeInTheDocument();
    });
  });

  // 🔟 Quay lại danh sách
  test("returns to customer list when clicking Back", async () => {
    fetchCustomers.mockResolvedValueOnce({
      data: [
        {
          id: 12,
          dealerId: 1,
          fullName: "Back Tester",
          customerCode: "C007",
          idNumber: "333",
        },
      ],
    });
    fetchOrders.mockResolvedValueOnce([
      { id: 1, customerId: 12, orderNumber: "O002", totalAmount: 2000 },
    ]);

    render(<Customers />);

    const viewBtn = await screen.findByRole("button", { name: /View Orders/i });
    fireEvent.click(viewBtn);

    await waitFor(() => screen.getByText(/Orders of Back Tester/i));

    const backButton = screen.getByRole("button", {
      name: /Back to Customer List/i,
    });
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.getByText(/Customer Management/i)).toBeInTheDocument();
    });
  });
  // Thêm bài test này vào cuối file Customer.test.js
  // Thêm mock data mới, thiếu city (được dùng cho test 16)
  const MOCK_CUSTOMERS_LOCATION = [
    // ... (Giữ nguyên mock location cũ)
    {
      id: 16,
      dealerId: 1,
      fullName: "No City",
      customerCode: "NC",
      address: "123 Main",
      idNumber: "1",
    },
    {
      id: 17,
      dealerId: 1,
      fullName: "No Address",
      customerCode: "NA",
      city: "Hanoi",
      idNumber: "2",
    },
    {
      id: 18,
      dealerId: 1,
      fullName: "Full Location",
      customerCode: "FL",
      address: "456 Side",
      city: "HCM",
      idNumber: "3",
    },
  ];

  // *****************************************************************
  // CHỈNH SỬA TEST 15 BẰNG CÁCH THÊM KHÁCH HÀNG KHÔNG KHỚP
  // *****************************************************************
  // TRONG TEST 15, SỬA LẠI KHỐI EXPECT ĐẦU TIÊN:
  test("15: filters customer list and resets when search is cleared", async () => {
    fetchCustomers.mockResolvedValue({
      data: MOCK_CUSTOMERS.concat([
        {
          id: 2,
          dealerId: 1,
          fullName: "Test Search",
          customerCode: "C999",
          idNumber: "777",
        },
        {
          id: 3,
          dealerId: 1,
          fullName: "Non Match",
          customerCode: "C000",
          idNumber: "000",
        },
      ]),
    });
    fetchOrders.mockResolvedValue([]);

    render(<Customers />);
    await screen.findByText("Non Match"); // Chờ tất cả 3 khách hàng load xong

    const searchInput = screen.getByPlaceholderText(
      /Search by name, code or phone/i
    );

    // 1. Gõ để lọc (Filter: "Test")
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "Test" } });
    });

    // 🏆 KIỂM TRA LỌC:
    // Cần 2 khách: Test Search (khớp tên) và Nguyen Van A (không khớp, nên bị ẩn)
    await waitFor(() => {
      // Khách hàng KHỚP phải hiển thị
      expect(screen.getByText("Test Search")).toBeInTheDocument();

      // Khách hàng KHÔNG KHỚP (Non Match) phải bị ẩn
      expect(screen.queryByText("Non Match")).not.toBeInTheDocument();

      // Khách hàng ban đầu (Nguyen Van A) cũng không khớp 'Test', nên cũng bị ẩn
      expect(screen.queryByText("Nguyen Van A")).not.toBeInTheDocument();
    });

    // 2. Xóa input (Reset filter)
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "" } });
    });

    // 🏆 KIỂM TRA RESET: Tất cả 3 khách hàng phải hiển thị lại
    await waitFor(() => {
      expect(screen.getByText("Test Search")).toBeInTheDocument();
      expect(screen.getByText("Nguyen Van A")).toBeInTheDocument();
      expect(screen.getByText("Non Match")).toBeInTheDocument();
      expect(screen.getAllByRole("row")).toHaveLength(4); // Header + 3 rows
    });
  });
  test("16: location column renders correctly when fields are partially missing", async () => {
    fetchCustomers.mockResolvedValueOnce({ data: MOCK_CUSTOMERS_LOCATION });
    fetchOrders.mockResolvedValueOnce([]);

    render(<Customers />);

    await screen.findByText("No City");

    // Case 1: Có Address, thiếu City -> chỉ hiển thị Address
    expect(screen.getByText("123 Main", { exact: false })).toBeInTheDocument();
    expect(
      screen.queryByText(", Hano", { exact: false })
    ).not.toBeInTheDocument();

    // Case 2: Thiếu Address, có City -> chỉ hiển thị City
    expect(screen.getByText("Hanoi")).toBeInTheDocument();

    // Case 3: Có cả hai
    expect(screen.getByText("456 Side, HCM")).toBeInTheDocument();
  });
  // Thêm bài test này vào cuối file Customer.test.js
  test("17: shows detailed error message when API returns response data error", async () => {
    fetchCustomers.mockResolvedValueOnce({ data: MOCK_CUSTOMERS });
    fetchOrders.mockResolvedValueOnce([]);

    // Mock lỗi phức tạp hơn
    putCustomer.mockRejectedValueOnce({
      message: "Network failed",
      response: { data: { message: "Customer already exists." } },
    });

    render(<Customers />);

    const editButton = await screen.findByRole("button", { name: /Edit/i });
    fireEvent.click(editButton);

    await waitFor(() => screen.getByText(/Edit Customer/i));

    fireEvent.change(screen.getByLabelText(/Customer Code/i), {
      target: { value: "C001" },
    });
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "Nguyen Van A" },
    });
    fireEvent.change(screen.getByLabelText(/ID Number/i), {
      target: { value: "123456789" },
    });

    await clickSaveButton();

    await waitFor(() => {
      // Kích hoạt nhánh: err.response?.data?.message
      expect(message.error).toHaveBeenCalledWith(
        "Failed to save customer! Error: Customer already exists."
      );
    });
  });
});
