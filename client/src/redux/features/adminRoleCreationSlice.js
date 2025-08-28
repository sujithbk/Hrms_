import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async thunk to call role creation API
export const createRole = createAsyncThunk(
  "admin/createRole",
  async ({ role_name, description }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return rejectWithValue("No authentication token found");
      const response = await axios.post(
        "http://localhost:5000/api/auth/admin/roleCreation",
        { role_name, description },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create role");
    }
  }
);

const adminRoleCreationSlice = createSlice({
  name: "admin",
  initialState: {
    loading: false,
    success: false,
    error: null,
  },
  reducers: {
    resetState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRole.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createRole.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error creating role";
      });
  },
});

export const { resetState } = adminRoleCreationSlice.actions;
export default adminRoleCreationSlice.reducer;
