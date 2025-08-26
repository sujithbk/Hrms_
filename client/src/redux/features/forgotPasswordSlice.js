import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

axios.defaults.withCredentials = true;

const API_BASE = "http://localhost:5000/api/auth";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email, password }, { rejectWithValue }) => {
    if (!email || !password) {
      return rejectWithValue("Please fill all fields properly");
    }
    if (!emailRegex.test(email)) {
      return rejectWithValue("Please enter a valid email");
    }
    if (password.length < 6) {
      return rejectWithValue("Password must be at least 6 characters long");
    }

    try {
      const response = await axios.post(`${API_BASE}/forgotpassword`, {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      let message =
        error.response?.data?.message || error.message || "Forgot password failed";
      return rejectWithValue(message);
    }
  }
);

export const verifyOtpForNewPassword = createAsyncThunk(
  "auth/verifyOtpForNewPassword",
  async ({ otp }, { rejectWithValue }) => {
    if (!otp) {
      return rejectWithValue("OTP is required");
    }
    try {
      const response = await axios.post(`${API_BASE}/otpforgot`, { otp });
      return response.data;
    } catch (error) {
      let message =
        error.response?.data?.message || error.message || "OTP verification failed";
      return rejectWithValue(message);
    }
  }
);

// NEW: Resend OTP for forgot password
export const resendForgotPasswordOtp = createAsyncThunk(
  "auth/resendForgotPasswordOtp",
  async ({ email, password }, { rejectWithValue }) => {
    if (!email || !password) {
      return rejectWithValue("Email and password are required to resend OTP");
    }
    
    try {
      // Check if there's an existing valid OTP first
      const response = await axios.post(`${API_BASE}/forgotpassword`, {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      let message = error.response?.data?.message || error.message || "Failed to resend OTP";
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  loading: false,
  successMessage: null,
  error: null,
  otpSent: false,
  otpLoading: false,
  otpError: null,
  passwordResetSuccess: false,
  resendLoading: false, // NEW: For resend OTP loading state
};

const forgotPasswordSlice = createSlice({
  name: "forgotPassword",
  initialState,
  reducers: {
    resetErrors(state) {
      state.error = null;
      state.otpError = null;
      state.successMessage = null;
    },
    resetAll(state) {
      state.loading = false;
      state.successMessage = null;
      state.error = null;
      state.otpSent = false;
      state.otpLoading = false;
      state.otpError = null;
      state.passwordResetSuccess = false;
      state.resendLoading = false;
    },
    clearMessages(state) {
      state.successMessage = null;
      state.error = null;
      state.otpError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // forgotPassword
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
        state.otpSent = false;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.otpSent = true;
          state.successMessage = action.payload.message;
        } else {
          state.error = action.payload.message || "Request failed";
        }
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Request failed";
      })

      // verifyOtpForNewPassword
      .addCase(verifyOtpForNewPassword.pending, (state) => {
        state.otpLoading = true;
        state.otpError = null;
        state.successMessage = null;
      })
      .addCase(verifyOtpForNewPassword.fulfilled, (state, action) => {
        state.otpLoading = false;
        if (action.payload.success) {
          state.passwordResetSuccess = true;
          state.successMessage = action.payload.message || "Password reset successful.";
          state.otpSent = false;
        } else {
          state.otpError = action.payload.message || "Invalid OTP";
        }
      })
      .addCase(verifyOtpForNewPassword.rejected, (state, action) => {
        state.otpLoading = false;
        state.otpError = action.payload || "OTP verification failed";
      })

      // NEW: resendForgotPasswordOtp
      .addCase(resendForgotPasswordOtp.pending, (state) => {
        state.resendLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(resendForgotPasswordOtp.fulfilled, (state, action) => {
        state.resendLoading = false;
        if (action.payload.success) {
          state.successMessage = action.payload.message || "OTP resent successfully";
        } else {
          state.error = action.payload.message || "Failed to resend OTP";
        }
      })
      .addCase(resendForgotPasswordOtp.rejected, (state, action) => {
        state.resendLoading = false;
        state.error = action.payload || "Failed to resend OTP";
      });
  },
});

export const { resetErrors, resetAll, clearMessages } = forgotPasswordSlice.actions;
export default forgotPasswordSlice.reducer;