import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/logout'); // Adjust API URL
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message || "Logout failed");
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: !!localStorage.getItem('token'),
    user: null,
    loading: false,
    error: null
  },
  reducers: {
    clearAuthState(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('token');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        localStorage.removeItem('token');
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearAuthState } = authSlice.actions;
export default authSlice.reducer;