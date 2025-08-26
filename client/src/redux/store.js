import { configureStore } from '@reduxjs/toolkit';
import registrationReducer from './features/registrationSlice';
import authReducer from './features/loginSlice'
import forgotPasswordReducer from './features/forgotPasswordSlice'
import adminReducer from './features/adminSlice'
import logoutReducer from './features/authSlice'

const store = configureStore({
  reducer: {
    registration: registrationReducer,
     auth: authReducer,
     forgotPassword: forgotPasswordReducer,
     admin: adminReducer,
     logout: logoutReducer
  },
});

export default store;
