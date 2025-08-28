// import { configureStore } from '@reduxjs/toolkit';
// import registrationReducer from './features/registrationSlice';
// import authReducer from './features/loginSlice'
// import forgotPasswordReducer from './features/forgotPasswordSlice'
// import adminReducer from './features/adminSlice'
// import logoutReducer from './features/authSlice'
// import atendanceReducer from './features/attendanceSlice'

// const store = configureStore({
//   reducer: {
//     registration: registrationReducer,
//      auth: authReducer,
//      forgotPassword: forgotPasswordReducer,
//      admin: adminReducer,
//      logout: logoutReducer,
//      atendance:atendanceReducer
//   },
// });

// export default store;



import { configureStore } from '@reduxjs/toolkit';
import registrationReducer from './features/registrationSlice';
import authReducer from './features/loginSlice';
import forgotPasswordReducer from './features/forgotPasswordSlice';
import adminReducer from './features/adminSlice';
import logoutReducer from './features/authSlice';
import attendanceReducer from './features/attendanceSlice';
import adminRoleCreationReducer from './features/adminRoleCreationSlice'

const store = configureStore({
  reducer: {
    registration: registrationReducer,
    auth: authReducer,
    forgotPassword: forgotPasswordReducer,
    admin: adminReducer,
    logout: logoutReducer,
    attendance: attendanceReducer, 
   adminRoleCreation: adminRoleCreationReducer
  },
});

export default store;
