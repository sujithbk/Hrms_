import React from 'react';
import { Box } from '@mui/material';
import UserNav from './usernav/UserNav';
import Attendance from './userbody/Atendance'; // Fixed import name

function UserDash() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <UserNav />
      <Box sx={{ pt: 2 }}>
        <Attendance />
      </Box>
    </Box>
  );
}

export default UserDash;