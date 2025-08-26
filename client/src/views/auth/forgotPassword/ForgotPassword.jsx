import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Link,
  IconButton,
  InputAdornment,
  Modal,
  Grid,
  Alert,
  Snackbar,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { AuthButton } from "../../../components/Button";
import { useDispatch, useSelector } from "react-redux";
import {
  forgotPassword,
  verifyOtpForNewPassword,
  resendForgotPasswordOtp, // NEW: Import the resend function
  resetErrors,
  resetAll,
  clearMessages
} from '../../../redux/features/forgotPasswordSlice';
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const {
    loading,
    error,
    successMessage,
    otpSent,
    otpLoading,
    otpError,
    passwordResetSuccess,
    resendLoading, // NEW: Get resend loading state
  } = useSelector((state) => state.forgotPassword);
 
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState("error");
  const [alertMessage, setAlertMessage] = useState("");

  const handleTogglePassword = () => setShowPassword((prev) => !prev);
  const navigate = useNavigate();
  const handleSubmit = () => {
    if (!email || !password) {
      setAlertMessage("Please fill all fields properly");
      setAlertSeverity("error");
      setAlertOpen(true);
      return;
    }
    
    dispatch(forgotPassword({ email, password })).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        setTimeLeft(60); // Reset timer when OTP is sent
        setOtp(""); // Clear previous OTP
      }
    });
  };

  // OTP Countdown
  useEffect(() => {
    if (otpSent) {
      setTimeLeft(60);
    }
  }, [otpSent]);

  useEffect(() => {
    if (otpSent && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [otpSent, timeLeft]);

  const handleOtpSubmit = () => {
    if (!otp) {
      setAlertMessage("OTP is required");
      setAlertSeverity("error");
      setAlertOpen(true);
      return;
    }
    dispatch(verifyOtpForNewPassword({ otp })).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        setOtp("");
        setTimeLeft(0);
      }
    });
  };

  // ENHANCED: Resend OTP function
  const handleResendOtp = () => {
    if (!email || !password) {
      setAlertMessage("Email and password are required to resend OTP");
      setAlertSeverity("error");
      setAlertOpen(true);
      return;
    }

    dispatch(resendForgotPasswordOtp({ email, password })).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        setOtp("");
        setTimeLeft(60);
        setAlertMessage("OTP resent successfully. Please check your email.");
        setAlertSeverity("info");
        setAlertOpen(true);
      }
    });
  };

  const handleAlertClose = () => {
    setAlertOpen(false);
    dispatch(clearMessages());
    if (passwordResetSuccess) {
      dispatch(resetAll());
      setEmail("");
      setPassword("");
      setOtp("");
    }
  };

  // Show errors or success from redux slices in the alert
  useEffect(() => {
    if (error) {
      setAlertMessage(error);
      setAlertSeverity("error");
      setAlertOpen(true);
    } else if (otpError) {
      setAlertMessage(otpError);
      setAlertSeverity("error");
      setAlertOpen(true);
    } else if (successMessage) {
      setAlertMessage(successMessage);
      setAlertSeverity("success");
      setAlertOpen(true);
    }
  }, [error, otpError, successMessage]);

  // Validation function
  const isFormValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email && 
           password && 
           emailRegex.test(email) && 
           password.length >= 6;
  };

  return (
    <Box
      minHeight="100vh"
      width="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="#f4f6f8"
    >
      <Paper
        elevation={3}
        sx={{ display: "flex", maxWidth: 1100, width: "100%", mt: 7, mb: 7 }}
      >
        {/* Left Side */}
        <Box
          sx={{
            flex: 1,
            px: 6,
            py: 6,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            position: "relative",
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              position: "absolute",
              top: 32,
              left: 32,
            }}
          >
            <Box
              component="img"
              src="https://www.intervaledu.com/static/web/images/logo/logo-dark.png"
              alt="Logo"
              sx={{ width: 150 }}
            />
          </Box>

          <Box sx={{ height: 32 }} />

          <Typography variant="h5" fontWeight={700} mb={3} mt={0}>
            Reset Password
          </Typography>

          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            size="small"
            margin="dense"
            sx={{ mb: 2 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || otpSent}
            error={email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
            helperText={
              email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) 
                ? "Please enter a valid email" 
                : ""
            }
          />

          <TextField
            label="New Password"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            fullWidth
            size="small"
            margin="dense"
            sx={{ mb: 3 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || otpSent}
            error={password && password.length < 6}
            helperText={
              password && password.length < 6 
                ? "Password must be at least 6 characters" 
                : ""
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePassword}
                    edge="end"
                    aria-label="toggle password visibility"
                    disabled={loading || otpSent}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <AuthButton
            variant="contained"
            color="primary"
            size="large"
            sx={{ mb: 2, mt: 1 }}
            fullWidth
            onClick={handleSubmit}
            disabled={loading || otpSent || !isFormValid()}
          >
            {loading ? "Sending OTP..." : "Send Reset OTP"}
          </AuthButton>

          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Typography variant="body2">
              Remember your password?{" "}
              <Link href="/login" underline="hover" onClick={() => navigate("/auth/login")}>
                Back to Login
              </Link>
            </Typography>
          </Box>
        </Box>

        {/* Right Side Placeholder */}
        <Box sx={{ flex: 1, minHeight: "100%" }} />
      </Paper>

      {/* OTP Modal */}
      <Modal
        open={otpSent}
        onClose={() => {}}
        aria-labelledby="otp-modal-title"
        aria-describedby="otp-modal-description"
        keepMounted
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 400 },
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            minWidth: 300,
            zIndex: 1301,
          }}
        >
          <Grid container spacing={2} direction="column">
            <Grid item>
              <Typography
                id="otp-modal-title"
                variant="h6"
                fontWeight={600}
                textAlign="center"
              >
                Verify Reset OTP
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {timeLeft > 0 
                  ? `Enter the OTP sent to ${email}` 
                  : "OTP has expired"
                }
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Enter OTP"
                variant="outlined"
                size="small"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={timeLeft === 0 || otpLoading}
                inputProps={{ 
                  maxLength: 6,
                  style: { textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.2em' }
                }}
              />
            </Grid>
            <Grid item>
              <Typography
                variant="body2"
                color={timeLeft > 0 ? "error" : "text.secondary"}
                textAlign="center"
              >
                {timeLeft > 0
                  ? `Time remaining: ${Math.floor(timeLeft / 60)}:${
                      timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60
                    }`
                  : "You can now resend the OTP"
                }
              </Typography>
            </Grid>

            <Grid container spacing={2} item>
              <Grid item xs={6}>
                <AuthButton
                  fullWidth
                  size="large"
                  onClick={handleOtpSubmit}
                  disabled={otpLoading || timeLeft === 0 || !otp}
                >
                  {otpLoading ? "Verifying..." : "Verify OTP"}
                </AuthButton>
              </Grid>
              <Grid item xs={6}>
                <AuthButton
                  fullWidth
                  size="large"
                  variant="outlined"
                  onClick={handleResendOtp}
                  disabled={resendLoading || timeLeft > 0} // NEW: Use resendLoading
                >
                  {resendLoading ? "Resending..." : "Resend OTP"}
                </AuthButton>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Modal>

      {/* Snackbar Alerts */}
      <Snackbar
        open={alertOpen}
        autoHideDuration={4000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleAlertClose}
          severity={alertSeverity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ForgotPassword;