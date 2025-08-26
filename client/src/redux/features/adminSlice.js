
// ===== FIXED REDUX SLICE =====
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      console.log("Making request with token:", token); // Debug log

      const response = await axios.get("http://localhost:5000/api/auth/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response received:", response.data); // Debug log

      if (response.data.success) {
        return response.data.users;
      } else {
        return rejectWithValue(response.data.message || "Failed to load users");
      }
    } catch (err) {
      console.error("Error fetching users:", err); // Debug log
      
      // Handle different error scenarios
      if (err.response?.status === 401) {
        localStorage.removeItem("token"); // Remove invalid token
        return rejectWithValue("Authentication failed. Please login again.");
      }
      
      if (err.response?.status === 403) {
        return rejectWithValue("Access denied. Insufficient permissions.");
      }

      return rejectWithValue(
        err.response?.data?.message || err.message || "Network error occurred"
      );
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    users: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearUsers: (state) => {
      state.users = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearUsers } = adminSlice.actions;
export default adminSlice.reducer;