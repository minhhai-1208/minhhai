import{ createSlice } from "@reduxjs/toolkit"

const initialState = JSON.parse(localStorage.getItem("account")) || null;

export const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    login: (state, action) => {
      state = action.payload;
      localStorage.setItem("account", JSON.stringify(state));
      return state;
    },
    logout: () => {
      localStorage.removeItem("account");
      return null;
    },
  },
  
});

// Action creators are generated for each case reducer function
export const { login, logout } = accountSlice.actions;

export default accountSlice.reducer;
