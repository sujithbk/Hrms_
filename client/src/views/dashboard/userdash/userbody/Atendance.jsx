// src/components/Attendance.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Typography, Box } from '@mui/material';
import { fetchStatus, checkin, checkout } from '../../../../redux/features/attendanceSlice';

const formatMinutes = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

const Attendance = () => {
  const dispatch = useDispatch();
  const {
    isCheckedIn,
    currentSessionStart,
    todayCompletedRuntime,
    todayTotalRuntime,
    error,
  } = useSelector((state) => state.attendance);

  const [timerMinutes, setTimerMinutes] = useState(todayTotalRuntime || 0);
  const timerRef = useRef(null);

  // Fetch status on component mount
  useEffect(() => {
    dispatch(fetchStatus());
  }, [dispatch]);

  // Timer management
  useEffect(() => {
    if (isCheckedIn && currentSessionStart) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(currentSessionStart)) / 60000);
        setTimerMinutes(todayCompletedRuntime + elapsed);
      }, 1000);
    } else {
      setTimerMinutes(todayCompletedRuntime);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCheckedIn, currentSessionStart, todayCompletedRuntime]);

  const handleCheckin = () => {
    dispatch(checkin());
  };

  const handleCheckout = () => {
    dispatch(checkout());
  };

  return (
    <Box sx={{ p: 3, maxWidth: 450, mx: 'auto', mt: 5, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Attendance Timer
      </Typography>
      <Typography variant="h2" color={isCheckedIn ? 'success.main' : 'text.primary'}>
        {formatMinutes(timerMinutes)}
      </Typography>
      <Typography variant="subtitle1" sx={{ my: 2 }}>
        {isCheckedIn
          ? `Checked in since: ${new Date(currentSessionStart).toLocaleTimeString()}`
          : "You're checked out"}
      </Typography>
      {error && (
        <Typography variant="body2" color="error" gutterBottom>
          {error}
        </Typography>
      )}
      <Button
        variant="contained"
        color={isCheckedIn ? 'secondary' : 'primary'}
        onClick={isCheckedIn ? handleCheckout : handleCheckin}
        sx={{ minWidth: 200, fontSize: '1.2rem' }}
      >
        {isCheckedIn ? 'Check Out' : 'Check In'}
      </Button>
    </Box>
  );
};

export default Attendance;
