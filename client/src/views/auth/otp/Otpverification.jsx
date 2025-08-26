import React, { useState, useEffect } from 'react';
import { Paper, Box, Typography, TextField, Button, Stack } from '@mui/material';

const OtpVerification = () => {
  const [timer, setTimer] = useState(30); // e.g., 30-second countdown
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (timer === 0) {
      setIsExpired(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Format timer MM:SS
  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        maxWidth: 450,
        margin: 'auto',
        mt: 6,
        borderRadius: 2,
      }}
    >
      {/* Top section: two images on the left, heading centered */}
      <Box display="flex" alignItems="center" mb={4}>
        <Stack direction="row" spacing={2} flex="0 0 auto">
          <Box
            component="img"
             src="https://www.intervaledu.com/static/web/images/logo/logo-dark.png"
            alt="left image 1"
            sx={{ width: 150 }}
          />
          <Box
            component="img"
            src="https://portal.teaminterval.net/static/media/map.7dd1ec7c87cddefd09e4.gif"
            alt="left image 2"
            sx={{width: "47px",
               mt: "-18px",
                ml: "-19px"}}
          />
        </Stack>
        
      </Box>

      {/* Input field */}
      <TextField
        fullWidth
        label="Enter OTP"
        variant="outlined"
        inputProps={{ inputMode: 'numeric', maxLength: 6 }}
        sx={{ mb: 2 }}
      />

      {/* Timer text and button side by side */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        {!isExpired ? (
          <Typography variant="body2" color="textSecondary">
            Time remaining: {formatTimer(timer)}
          </Typography>
        ) : (
          <Typography variant="body2" color="error">
            Time expired
          </Typography>
        )}

        <Button
          variant="text"
          disabled={!isExpired}
          onClick={() => {
            setTimer(30);
            setIsExpired(false);
          }}
        >
          {isExpired ? 'Resend' : 'Waiting...'}
        </Button>
      </Box>
    </Paper>
  );
};

export default OtpVerification;
