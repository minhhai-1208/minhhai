import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { Provider } from "react-redux";
import { store } from "./redux/store";

// B1: tìm tới thẻ có id="root" trong index.html
// B2: render App bọc bởi Provider để toàn bộ app có thể dùng Redux store
createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <App />
  </Provider>
);

// Chương trình sẽ chạy từ file index.js (hoặc main.js tuỳ cấu hình Vite/CRA)
