// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// // Axios config to send cookies
// axios.defaults.withCredentials = true;

// const API_BASE = "http://localhost:5000/api/auth";

// const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// // Async thunk for login API (first step)
// export const fetchLogin = createAsyncThunk(
//   "auth/fetchLogin",
//   async ({ email, password }, { rejectWithValue }) => {
//     // Frontend validation for inputs
//     if (!email || !password) {
//       return rejectWithValue("Please fill all fields properly");
//     }
//     if (!emailRegex.test(email)) {
//       return rejectWithValue("Please enter a valid email");
//     }
//     if (password.length < 6) {
//       return rejectWithValue("Password must be at least six characters long");
//     }

//     try {
//       const response = await axios.post(`${API_BASE}/login`, { email, password });
//       return response.data; // expects { success, message }
//     } catch (error) {
//       // Extract meaningful error message from backend or fallback
//       let message =
//         error.response?.data?.message || error.message || "Login failed";
//       return rejectWithValue(message);
//     }
//   }
// );

// // Async thunk for OTP verification API (second step)
// export const verifyOtp = createAsyncThunk(
//   "auth/verifyOtp",
//   async ({ otp }, { getState, rejectWithValue }) => {
//     if (!otp) {
//       return rejectWithValue("OTP is required");
//     }

//     try {
//       const response = await axios.post(`${API_BASE}/otplogin`, { otp });
//       return response.data; // expects { success, message, user, token }
//     } catch (error) {
//       let message =
//         error.response?.data?.message || error.message || "OTP verification failed";
//       return rejectWithValue(message);
//     }
//   }
// );

// // Initial state of auth slice
// const initialState = {
//   loading: false,
//   isLoggedIn: false,
//   user: null,
//   token: null,
//   otpSent: false,
//   otpLoading: false,
//   error: null,
//   otpError: null,
//   successMessage: null,
// };

// // Auth slice
// const authSlice = createSlice({
//   name: "auth",
//   initialState,
//   reducers: {
//     resetErrors(state) {
//       state.error = null;
//       state.otpError = null;
//       state.successMessage = null;
//     },
//     logout(state) {
//       state.isLoggedIn = false;
//       state.user = null;
//       state.token = null;
//       state.otpSent = false;
//       state.error = null;
//       state.otpError = null;
//       state.successMessage = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // fetchLogin
//       .addCase(fetchLogin.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         state.successMessage = null;
//         state.otpSent = false;
//       })
//       .addCase(fetchLogin.fulfilled, (state, action) => {
//         state.loading = false;
//         if (action.payload.success) {
//           state.otpSent = true; // OTP modal open
//           state.successMessage = action.payload.message;
//         } else {
//           state.error = action.payload.message || "Login failed";
//         }
//       })
//       .addCase(fetchLogin.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || "Login failed";
//       })

//       // verifyOtp
//       .addCase(verifyOtp.pending, (state) => {
//         state.otpLoading = true;
//         state.otpError = null;
//         state.successMessage = null;
//       })
//       .addCase(verifyOtp.fulfilled, (state, action) => {
//         state.otpLoading = false;
//         if (action.payload.success) {
//           state.isLoggedIn = true;
//           state.user = action.payload.user;
//           state.token = action.payload.token;
//           state.otpSent = false;
//           state.successMessage = "Login successful.";
//         } else {
//           state.otpError = action.payload.message || "Invalid OTP";
//         }
//       })
//       .addCase(verifyOtp.rejected, (state, action) => {
//         state.otpLoading = false;
//         state.otpError = action.payload || "OTP verification failed";
//       });
//   },
// });

// export const { resetErrors, logout } = authSlice.actions;

// export default authSlice.reducer;

// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// axios.defaults.withCredentials = true;

// const API_BASE = "http://localhost:5000/api/auth";

// const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// export const fetchLogin = createAsyncThunk(
//   "auth/fetchLogin",
//   async ({ email, password }, { rejectWithValue }) => {
//     if (!email || !password) {
//       return rejectWithValue("Please fill all fields properly");
//     }
//     if (!emailRegex.test(email)) {
//       return rejectWithValue("Please enter a valid email");
//     }
//     if (password.length < 6) {
//       return rejectWithValue("Password must be at least six characters long");
//     }
//     try {
//       const response = await axios.post(`${API_BASE}/login`, { email, password });
//       return response.data;
//     } catch (error) {
//       let message = error.response?.data?.message || error.message || "Login failed";
//       return rejectWithValue(message);
//     }
//   }
// );

// export const verifyOtp = createAsyncThunk(
//   "auth/verifyOtp",
//   async ({ otp }, { rejectWithValue }) => {
//     if (!otp) {
//       return rejectWithValue("OTP is required");
//     }
//     try {
//       const response = await axios.post(`${API_BASE}/otplogin`, { otp });
//       return response.data;
//     } catch (error) {
//       let message = error.response?.data?.message || error.message || "OTP verification failed";
//       return rejectWithValue(message);
//     }
//   }
// );

// // Check if user is already logged in from localStorage
// const getInitialAuthState = () => {
//   try {
//     const token = localStorage.getItem("token");
//     const userStr = localStorage.getItem("user");
    
//     if (token && userStr) {
//       const user = JSON.parse(userStr);
//       return {
//         isLoggedIn: true,
//         user,
//         token,
//       };
//     }
//   } catch (error) {
//     // If parsing fails, clear localStorage
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//   }
  
//   return {
//     isLoggedIn: false,
//     user: null,
//     token: null,
//   };
// };

// const initialAuthState = getInitialAuthState();

// const initialState = {
//   loading: false,
//   ...initialAuthState,
//   otpSent: false,
//   otpLoading: false,
//   error: null,
//   otpError: null,
//   successMessage: null,
// };

// const authSlice = createSlice({
//   name: "auth",
//   initialState,
//   reducers: {
//     resetErrors(state) {
//       state.error = null;
//       state.otpError = null;
//       state.successMessage = null;
//     },
//     logout(state) {
//       state.isLoggedIn = false;
//       state.user = null;
//       state.token = null;
//       state.otpSent = false;
//       state.error = null;
//       state.otpError = null;
//       state.successMessage = null;
      
//       // Clear localStorage
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchLogin.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         state.successMessage = null;
//         state.otpSent = false;
//       })
//       .addCase(fetchLogin.fulfilled, (state, action) => {
//         state.loading = false;
//         if (action.payload.success) {
//           state.otpSent = true;
//           state.successMessage = action.payload.message;
//         } else {
//           state.error = action.payload.message || "Login failed";
//         }
//       })
//       .addCase(fetchLogin.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload || "Login failed";
//       })

//       .addCase(verifyOtp.pending, (state) => {
//         state.otpLoading = true;
//         state.otpError = null;
//         state.successMessage = null;
//       })
//       .addCase(verifyOtp.fulfilled, (state, action) => {
//         state.otpLoading = false;
//         if (action.payload.success) {
//           state.isLoggedIn = true;
//           // Normalize role string from nested role object
//           const roleName = action.payload.user.role?.role_name || action.payload.user.role || "user";
//           const user = { ...action.payload.user, role: roleName };
          
//           state.user = user;
//           state.token = action.payload.token;
//           state.otpSent = false;
//           state.successMessage = "Login successful.";
          
//           // Persist to localStorage
//           localStorage.setItem("token", action.payload.token);
//           localStorage.setItem("user", JSON.stringify(user));
//         } else {
//           state.otpError = action.payload.message || "Invalid OTP";
//         }
//       })
//       .addCase(verifyOtp.rejected, (state, action) => {
//         state.otpLoading = false;
//         state.otpError = action.payload || "OTP verification failed";
//       });
//   },
// });

// export const { resetErrors, logout } = authSlice.actions;
// export default authSlice.reducer;




import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

axios.defaults.withCredentials = true;

const API_BASE = "http://localhost:5000/api/auth";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const fetchLogin = createAsyncThunk(
  "auth/fetchLogin",
  async ({ email, password }, { rejectWithValue }) => {
    if (!email || !password) {
      return rejectWithValue("Please fill all fields properly");
    }
    if (!emailRegex.test(email)) {
      return rejectWithValue("Please enter a valid email");
    }
    if (password.length < 6) {
      return rejectWithValue("Password must be at least six characters long");
    }
    try {
      const response = await axios.post(`${API_BASE}/login`, { email, password });
      return response.data;
    } catch (error) {
      let message = error.response?.data?.message || error.message || "Login failed";
      return rejectWithValue(message);
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ otp }, { rejectWithValue }) => {
    if (!otp) {
      return rejectWithValue("OTP is required");
    }
    try {
      const response = await axios.post(`${API_BASE}/otplogin`, { otp });
      return response.data;
    } catch (error) {
      let message = error.response?.data?.message || error.message || "OTP verification failed";
      return rejectWithValue(message);
    }
  }
);

// Add token validation action
export const validateToken = createAsyncThunk(
  "auth/validateToken",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("token");
    if (!token) {
      return rejectWithValue("No token found");
    }
    
    try {
      // Add Authorization header
      const response = await axios.get(`${API_BASE}/validate-token`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      // Token is invalid or expired
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      let message = error.response?.data?.message || "Token validation failed";
      return rejectWithValue(message);
    }
  }
);

// Check if user is already logged in from localStorage
const getInitialAuthState = () => {
  try {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (token && userStr) {
      const user = JSON.parse(userStr);
      return {
        isLoggedIn: true,
        user,
        token,
      };
    }
  } catch (error) {
    // If parsing fails, clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
  
  return {
    isLoggedIn: false,
    user: null,
    token: null,
  };
};

const initialAuthState = getInitialAuthState();

const initialState = {
  loading: false,
  ...initialAuthState,
  otpSent: false,
  otpLoading: false,
  validating: false,
  error: null,
  otpError: null,
  successMessage: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetErrors(state) {
      state.error = null;
      state.otpError = null;
      state.successMessage = null;
    },
    logout(state) {
      state.isLoggedIn = false;
      state.user = null;
      state.token = null;
      state.otpSent = false;
      state.error = null;
      state.otpError = null;
      state.successMessage = null;
      
      // Clear localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
        state.otpSent = false;
      })
      .addCase(fetchLogin.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.otpSent = true;
          state.successMessage = action.payload.message;
        } else {
          state.error = action.payload.message || "Login failed";
        }
      })
      .addCase(fetchLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      })

      .addCase(verifyOtp.pending, (state) => {
        state.otpLoading = true;
        state.otpError = null;
        state.successMessage = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.otpLoading = false;
        if (action.payload.success) {
          state.isLoggedIn = true;
          // Normalize role string from nested role object
          const roleName = action.payload.user.role?.role_name || action.payload.user.role || "user";
          const user = { ...action.payload.user, role: roleName };
          
          state.user = user;
          state.token = action.payload.token;
          state.otpSent = false;
          state.successMessage = "Login successful.";
          
          // Persist to localStorage
          localStorage.setItem("token", action.payload.token);
          localStorage.setItem("user", JSON.stringify(user));
        } else {
          state.otpError = action.payload.message || "Invalid OTP";
        }
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.otpLoading = false;
        state.otpError = action.payload || "OTP verification failed";
      })

      // Token validation cases
      .addCase(validateToken.pending, (state) => {
        state.validating = true;
      })
      .addCase(validateToken.fulfilled, (state, action) => {
        state.validating = false;
        // Token is valid, user remains logged in
        if (action.payload.success && action.payload.user) {
          const roleName = action.payload.user.role?.role_name || action.payload.user.role || "user";
          state.user = { ...action.payload.user, role: roleName };
          state.isLoggedIn = true;
        }
      })
      .addCase(validateToken.rejected, (state) => {
        state.validating = false;
        // Token is invalid, log out user
        state.isLoggedIn = false;
        state.user = null;
        state.token = null;
        state.error = null;
        state.otpError = null;
        state.successMessage = null;
      });
  },
});

export const { resetErrors, logout } = authSlice.actions;
export default authSlice.reducer;