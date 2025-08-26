import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/auth';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Configure axios to always send cookies/credentials
axios.defaults.withCredentials = true;

// Registration async thunk
export const fetchRegistration = createAsyncThunk(
  'registration/fetchRegistration',
  async ({ name, email, password }, { rejectWithValue }) => {
    // Client-side validation
    if (!name || !email || !password) {
      return rejectWithValue('Please fill all fields properly.');
    }
    if (!emailRegex.test(email)) {
      return rejectWithValue('Please enter a valid email.');
    }
    if (password.length < 6) {
      return rejectWithValue('Password must be at least six characters long.');
    }
    try {
      const response = await axios.post(
        `${API_BASE}/register`,
        { name, email, password },
        { withCredentials: true } // Sends session cookies
      );
      return response.data;
    } catch (error) {
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue(error.message);
    }
  }
);

// OTP verification thunk
export const verifyOtp = createAsyncThunk(
  'registration/verifyOtp',
  async ({ otp }, { rejectWithValue }) => {
    if (!otp) {
      return rejectWithValue('OTP is required.');
    }
    try {
      const response = await axios.post(
        `${API_BASE}/otp-verification`,
        { otp },
        { withCredentials: true } // Sends session cookies
      );
      return response.data;
    } catch (error) {
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue(error.message);
    }
  }
);

// OTP resend thunk
export const generateOtp = createAsyncThunk(
  'registration/generateOtp',
  async (email, { rejectWithValue }) => {
    if (!email) {
      return rejectWithValue('Email is required to resend OTP.');
    }
    try {
      const response = await axios.post(
        `${API_BASE}/generate-otp`,
        { email },
        { withCredentials: true } // Sends session cookies
      );
      return response.data;
    } catch (error) {
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue(error.message);
    }
  }
);

const registrationSlice = createSlice({
  name: 'registration',
  initialState: {
    loading: false,
    error: null,
    otpSent: false,
    pendingUser: null,
    registeredUser: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
    reset(state) {
      state.loading = false;
      state.error = null;
      state.otpSent = false;
      state.pendingUser = null;
      state.registeredUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Registration
      .addCase(fetchRegistration.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.otpSent = false;
      })
      .addCase(fetchRegistration.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.pendingUser = action.meta.arg; // Input user data
      })
      .addCase(fetchRegistration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // OTP Verification
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = false;
        state.registeredUser = action.payload.user;
        state.pendingUser = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Resend OTP
      .addCase(generateOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(generateOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearError, reset } = registrationSlice.actions;
export default registrationSlice.reducer;
