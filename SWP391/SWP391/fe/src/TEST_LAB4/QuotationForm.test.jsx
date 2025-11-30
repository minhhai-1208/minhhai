import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { message } from "antd";

// --- MOCK API ---
import { fetchVehicleDetails } from "../service/vehicle-details.api";
import { fetchPromotions } from "../services/promotion.api";
import { fetchCustomers } from "../service/customers.api";
import { postOrderWithVehicleCheck } from "../service/order.api";
import QuotationForm from "../pages/dealer/Orders/QuotationForm";

// Mock API
jest.mock("../service/vehicle-details.api", () => ({ fetchVehicleDetails: jest.fn() }));
jest.mock("../services/promotion.api", () => ({ fetchPromotions: jest.fn() }));
jest.mock("../service/customers.api", () => ({ fetchCustomers: jest.fn() }));
jest.mock("../service/order.api", () => ({ postOrderWithVehicleCheck: jest.fn() }));

// --- MOCK Redux & Router ---
import { useSelector } from "react-redux";
const mockNavigate = jest.fn();
jest.mock("react-redux", () => ({ useSelector: jest.fn() }));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// --- MOCK AntD message ---
jest.mock("antd", () => {
  const antd = jest.requireActual("antd");
  return {
    ...antd,
    message: {
      success: jest.fn(),
      warning: jest.fn(),
      error: jest.fn(),
    },
  };
});

// --- MOCK DATA ---
const MOCK_DEALER_ID = 1;
const mockVehicles = [
  { id: 1, modelName: "Model 1", versionName: "Limited", colorName: "Blue", finalPrice: 10000000 }
];
const mockCustomers = [
  { id: 101, customerCode: "C001", fullName: "Alice", phone: "123", dealerId: MOCK_DEALER_ID }
];
const mockPromotions = [
  { id: 201, promotionName: "Promo 1", discountType: "fixed_amount", discountValue: 300000, dealerId: MOCK_DEALER_ID }
];

// --- SETUP UTILITY ---
const setup = async () => {
  useSelector.mockImplementation((fn) => fn({ account: { dealerId: MOCK_DEALER_ID } }));

  fetchVehicleDetails.mockResolvedValue({ data: mockVehicles });
  fetchCustomers.mockResolvedValue({ data: mockCustomers });
  fetchPromotions.mockResolvedValue({ data: mockPromotions });

  let result;
  await act(async () => {
    result = render(<QuotationForm />);
    // Chờ useEffect load data
    await waitFor(() => expect(fetchVehicleDetails).toHaveBeenCalled());
    await waitFor(() => expect(fetchCustomers).toHaveBeenCalled());
    await waitFor(() => expect(fetchPromotions).toHaveBeenCalled());
  });
  return result;
};

// --- FILL FORM UTILITY ---
const fillFirstItem = async () => {
  // Chọn customer
  const customerSelect = await screen.findByLabelText(/select customer/i);
  await userEvent.click(customerSelect);
  const aliceOption = await screen.findByText((content) => content.includes("Alice"));
  await userEvent.click(aliceOption);

  // Thêm Vehicle Item nếu chưa có
  const addButton = screen.getByRole("button", { name: /add vehicle item/i });
  await userEvent.click(addButton);

  // Chọn vehicle
  const vehicleSelect = await screen.findByPlaceholderText(/choose vehicle/i);
  await userEvent.click(vehicleSelect);
  const vehicleOption = await screen.findByText(/Model 1/i);
  await userEvent.click(vehicleOption);

  // Set quantity = 1
  const quantityInput = screen.getAllByLabelText(/quantity/i)[0];
  await userEvent.clear(quantityInput);
  await userEvent.type(quantityInput, "1");
};

// --- TESTS ---
describe("QuotationForm Component", () => {
  afterEach(() => {
    jest.clearAllMocks();
    message.success.mockClear();
    message.warning.mockClear();
    message.error.mockClear();
  });

  test("1. UI/State: loads data and displays customers", async () => {
    await setup();

    // Chọn customer dropdown
    const customerSelect = await screen.findByLabelText(/select customer/i);
    await userEvent.click(customerSelect);

    // Kiểm tra Alice có trong option
    const aliceOption = await screen.findByText((content) => content.includes("Alice"));
    expect(aliceOption).toBeInTheDocument();
  });

  test("2. API Success: submits form successfully and navigates", async () => {
    await setup();
    await fillFirstItem();

    // Mock postOrder thành công
    postOrderWithVehicleCheck.mockResolvedValue({ data: { orderNumber: "ORD-1234" } });

    // Click submit
    const submitButton = screen.getByRole("button", { name: /create quotation/i });
    await userEvent.click(submitButton);

    // Chờ API, message, navigate
    await waitFor(() => {
      expect(postOrderWithVehicleCheck).toHaveBeenCalled();
      expect(message.success).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/dealer/orderManagement");
    });
  });
});
