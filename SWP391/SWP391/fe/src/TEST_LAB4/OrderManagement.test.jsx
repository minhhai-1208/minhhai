// OrderManagement.test.jsx
import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { message } from "antd";

/* global jest expect describe afterEach */

// --- MOCK API (ĐÃ SỬA ĐƯỜNG DẪN) ---
import {
  fetchOrders,
  getOrderById,
  putOrder,
  removeOrder,
} from "../service/order.api";
import { postVNPayDeposit, postVNPayFinal } from "../service/payment.api";
import { getContractByOrderId } from "../service/contracts.api";
import OrderManagement from "../pages/dealer/Orders/OrderManagement";

// Giả lập tất cả các hàm API
jest.mock("../service/order.api", () => ({
  fetchOrders: jest.fn(),
  getOrderById: jest.fn(),
  putOrder: jest.fn(),
  removeOrder: jest.fn(),
}));
jest.mock("../service/payment.api", () => ({
  postVNPayDeposit: jest.fn(),
  postVNPayFinal: jest.fn(),
}));
jest.mock("../service/contracts.api", () => ({
  getContractByOrderId: jest.fn(),
}));

// --- MOCK ROUTER ---
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// --- MOCK ANT D MESSAGE (Giả định đã có trong jest.setup.js) ---
// Nếu không, cần mock trực tiếp tại đây.
// Nếu bạn sử dụng spyOn global, KHÔNG cần mock lại ở đây.

// --- DỮ LIỆU MOCK ---
const MOCK_DEALER_ID = 1;
const MOCK_ORDERS = [
  {
    id: 1,
    orderNumber: "ORD001",
    customerName: "Alice",
    staffName: "Staff A",
    dealerId: MOCK_DEALER_ID,
    totalAmount: 50000000,
    depositAmount: 5000000,
    status: "deposited",
    orderDetails: [
      {
        quantity: 1,
        vehicleDetail: {
          modelName: "Model X",
          versionName: "Base",
          colorName: "Red",
        },
      },
    ],
  },
  {
    id: 2,
    orderNumber: "ORD002",
    customerName: "Bob",
    staffName: "Staff B",
    dealerId: 999,
    totalAmount: 80000000,
    depositAmount: 0,
    status: "draft_quotation",
    orderDetails: [
      {
        quantity: 1,
        vehicleDetail: {
          modelName: "Model Y",
          versionName: "Plus",
          colorName: "Blue",
        },
      },
    ],
  },
];
const MOCK_CONTRACTS = [{ id: 10, orderId: 1, contractNumber: "C001" }];

// Giả lập localStorage (cho dealerId)
const mockLocalStorage = (dealerId) => {
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: jest.fn((key) => {
        if (key === "account") return JSON.stringify({ dealerId });
        return null;
      }),
    },
    writable: true,
  });
};

// Hàm Setup Tối ưu: Đảm bảo Promises được giải quyết bằng ACT
const setup = async (orders = MOCK_ORDERS, contractData = []) => {
  mockLocalStorage(MOCK_DEALER_ID);

  const dealerOrders = orders.filter((o) => o.dealerId === MOCK_DEALER_ID);

  // 1. Mock API trả về Promises
  const orderPromise = Promise.resolve(dealerOrders);
  fetchOrders.mockReturnValue(orderPromise);

  getContractByOrderId.mockImplementation((orderId) => {
    const contracts = contractData.filter((c) => c.orderId === orderId);
    return Promise.resolve(contracts);
  });

  // 2. Render Component
  let renderResult;
  act(() => {
    renderResult = render(<OrderManagement />);
  });

  // 3. QUAN TRỌNG: Dùng await act để buộc Jest giải quyết Promises API
  await act(async () => {
    await orderPromise; // Chờ Promise fetchOrders hoàn tất
  });

  return renderResult;
};

describe("OrderManagement Component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------
  // 1. UI Rendering & Data Loading (PASS Mọi test)
  // -----------------------------------------------------------

  test("1.1. UI/State: loads and displays data filtered by Dealer ID", async () => {
    await setup();

    // Kiểm tra API đã được gọi
    expect(fetchOrders).toHaveBeenCalled();

    // Kiểm tra dữ liệu được hiển thị và đã lọc
    expect(screen.getByText(/alice/i)).toBeInTheDocument(); // Alice (dealerId 1)
    expect(screen.queryByText(/bob/i)).not.toBeInTheDocument(); // Bob (dealerId 999) không được hiển thị

    // Kiểm tra các cột bảng cơ bản
    expect(screen.getByText("Customer Name")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  // -----------------------------------------------------------
  // 2. Logic Điều Kiện và Sự Kiện (Contract & Navigation)
  // -----------------------------------------------------------

  test('2.1. Logic: displays "Create Contract" button when status allows', async () => {
    // Đơn hàng Alice có status: 'deposited' (cho phép tạo hợp đồng)
    await setup();

    const createButton = screen.getByRole("button", {
      name: /create contract/i,
    });
    expect(createButton).toBeInTheDocument();
  });

  test('2.2. Logic: displays "View Contract" button if contract already exists', async () => {
    // ContractData: Hợp đồng ID 10 cho Order ID 1
    const contractData = [{ id: 10, orderId: 1, contractNumber: "C001" }];
    await setup(MOCK_ORDERS, contractData);

    // Kiểm tra nút View Contract
    const viewContractButton = screen.getByRole("button", {
      name: /view contract/i,
    });
    expect(viewContractButton).toBeInTheDocument();

    // Sự kiện Navigation
    await userEvent.click(viewContractButton);
    expect(mockNavigate).toHaveBeenCalledWith("/dealer/contracts/10");
  });

  test("2.3. Event: navigating to create new quotation page", async () => {
    await setup();

    // Bấm nút "Create New Quotation" ở extra
    await userEvent.click(
      screen.getByRole("button", { name: /create new quotation/i })
    );

    // Kiểm tra điều hướng
    expect(mockNavigate).toHaveBeenCalledWith("/dealer/quotation");
  });

  // -----------------------------------------------------------
  // 3. API Call (Delete Flow)
  // -----------------------------------------------------------

  test("3.1. API Call: handles successful order deletion", async () => {
    await setup();
    removeOrder.mockResolvedValue({});

    // Spy message.success (đã được mock global)
    const successMessageSpy = message.success;

    // Tìm nút Delete của Alice (ID 1)
    // TRONG test '3.1. API Call: handles successful order deletion'

    // Tên title chính xác là: "Delete Order (Draft only)"
    const deleteButton = screen.getByRole("button", {
      name: /delete order \(draft only\)/i,
    });

    // ... (logic click tiếp theo)
    await userEvent.click(deleteButton);

    // Bấm Confirm trong Popconfirm
    await userEvent.click(screen.getByText("Yes"));

    await waitFor(() => {
      // 1. API DELETE đã được gọi
      expect(removeOrder).toHaveBeenCalledWith(1);
      // 2. Thông báo thành công
      expect(successMessageSpy).toHaveBeenCalledWith(
        "Order deleted successfully!"
      );
      // 3. Data reload
      expect(fetchOrders).toHaveBeenCalledTimes(2);
    });
  });
});
