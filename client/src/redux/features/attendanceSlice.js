// src/redux/attendanceSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/auth'; // Replace with your base API URL

// Async Thunks to call backend API
export const fetchStatus = createAsyncThunk('attendance/fetchStatus', async (_, { rejectWithValue }) => {
  try {
    const { data } = await axios.get(`${API_BASE}/status`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: 'Cannot fetch status' });
  }
});

export const checkin = createAsyncThunk('attendance/checkin', async (_, { rejectWithValue }) => {
  try {
    const { data } = await axios.post(`${API_BASE}/checkin`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: 'Checkin failed' });
  }
});

export const checkout = createAsyncThunk('attendance/checkout', async (_, { rejectWithValue }) => {
  try {
    const { data } = await axios.post(`${API_BASE}/checkout`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: 'Checkout failed' });
  }
});

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    isCheckedIn: false,
    currentSessionStart: null,
    todayCompletedRuntime: 0,
    todayTotalRuntime: 0,
    status: 'idle',
    error: null,
  },
  reducers: {
    resetAttendance: (state) => {
      state.isCheckedIn = false;
      state.currentSessionStart = null;
      state.todayCompletedRuntime = 0;
      state.todayTotalRuntime = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatus.fulfilled, (state, action) => {
        state.isCheckedIn = action.payload.isCheckedIn;
        state.currentSessionStart = action.payload.currentSessionStart;
        state.todayCompletedRuntime = action.payload.todayCompletedRuntime;
        state.todayTotalRuntime = action.payload.todayTotalRuntime;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(fetchStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to fetch status';
      })
      .addCase(checkin.fulfilled, (state, action) => {
        state.isCheckedIn = true;
        state.currentSessionStart = action.payload.currentSessionStart;
        state.todayCompletedRuntime = action.payload.todayRuntime;
        state.todayTotalRuntime = action.payload.todayRuntime;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(checkin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message;
      })
      .addCase(checkout.fulfilled, (state, action) => {
        state.isCheckedIn = false;
        state.currentSessionStart = null;
        state.todayCompletedRuntime = action.payload.todayRuntime;
        state.todayTotalRuntime = action.payload.todayRuntime;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(checkout.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message;
      });
  },
});

export const { resetAttendance } = attendanceSlice.actions;
export default attendanceSlice.reducer;
