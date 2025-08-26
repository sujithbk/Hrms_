import React, { useState, useEffect } from "react";
import {
              Box,
              Paper,
              Typography,
              TextField,
              Divider,
              Link,
              IconButton,
              InputAdornment,
              Modal,
              Grid,
              Snackbar,
              Alert
                            } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { AuthButton, ButtonIcon } from "../../../components/Button";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRegistration,
  verifyOtp,
  generateOtp,
  clearError,
  reset
} from '../../../redux/features/registrationSlice'

const Signup = () => {
  const dispatch = useDispatch();

  // Form fields state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP modal timer in local state
  const [timeLeft, setTimeLeft] = useState(60);

  // Redux state selectors
  const {
    loading,
    error,
    otpSent,
    registeredUser
  } = useSelector((state) => state.registration);

  // Snackbar alert state
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("error");

  // Effect for showing errors in alerts
  useEffect(() => {
    if (error) {
      setAlertMessage(error);
      setAlertSeverity("error");
      setOpenAlert(true);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // OTP Timer countdown effect
  useEffect(() => {
    if (!otpSent) return;
    if (timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [otpSent, timeLeft]);

  const handleTogglePassword = () => setShowPassword((prev) => !prev);

  const validateForm = () => {
    if (!name || !email || !password) {
      setAlertMessage("Please fill the form properly.");
      setAlertSeverity("error");
      setOpenAlert(true);
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAlertMessage("Please enter a valid email.");
      setAlertSeverity("error");
      setOpenAlert(true);
      return false;
    }
    if (password.length < 6) {
      setAlertMessage("Password must be at least six characters long.");
      setAlertSeverity("error");
      setOpenAlert(true);
      return false;
    }
    return true;
  };

  const handleSignup = () => {
    if (!validateForm()) return;
    dispatch(fetchRegistration({ name, email, password })).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        setTimeLeft(60);
        setOtp("");
      }
    });
  };

  const handleOtpSignup = () => {
    if (!otp) {
      setAlertMessage("Please enter the OTP.");
      setAlertSeverity("error");
      setOpenAlert(true);
      return;
    }
    dispatch(verifyOtp({ otp })).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        setAlertMessage("Registration completed successfully!");
        setAlertSeverity("success");
        setOpenAlert(true);
        setOtp("");
        setTimeLeft(0);
        dispatch(reset());
        // Optionally do redirect or login flow here
      }
    });
  };

  const handleResendOtp = () => {
    dispatch(generateOtp(email)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        setTimeLeft(60);
        setOtp("");
        setAlertMessage("OTP resent. Please check your email.");
        setAlertSeverity("info");
        setOpenAlert(true);
      }
    });
  };

  const handleAlertClose = (event, reason) => {
    if (reason === "clickaway") return;
    setOpenAlert(false);
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
        sx={{
          display: "flex",
          maxWidth: 1100,
          width: "100%",
          mt: 7,
          mb: 7,
        }}
      >
        {/* Left Section */}
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

          {/* Signup Form */}
          <Typography variant="h5" fontWeight={700} mb={3} mt={0}>
            Get Started
          </Typography>

          <TextField
            label="Name"
            variant="outlined"
            fullWidth
            size="small"
            margin="dense"
            sx={{ mb: 2 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading || otpSent}
          />
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
          />
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            fullWidth
            size="small"
            margin="dense"
            sx={{ mb: 3 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || otpSent}
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

          {/* Signup Button */}
          <AuthButton
            size="large"
            sx={{ mb: 2, mt: 1 }}
            onClick={handleSignup}
            disabled={loading || otpSent}
          >
            {loading ? "Signing Up..." : "Signup"}
          </AuthButton>

          {/* Already have account */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 0 }}>
            <Typography variant="body2">
              Already have an account?{" "}
              <Link href="/auth/login" underline="hover">
                Login
              </Link>
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              or
            </Typography>
          </Divider>

          {/* Google Button */}
          <ButtonIcon disabled={loading || otpSent}>
            Sign in with Google
          </ButtonIcon>
        </Box>

        {/* Right Section Placeholder */}
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
                OTP Verification
              </Typography>
            </Grid>
            <Grid item>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                {timeLeft > 0 ? "Enter the OTP" : "OTP expired"}
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
                disabled={timeLeft === 0 || loading}
              />
            </Grid>
            <Grid item>
              <Typography
                variant="body2"
                color={timeLeft > 0 ? "error" : "primary"}
                textAlign="center"
              >
                {timeLeft > 0
                  ? `Time left: ${Math.floor(timeLeft / 60)}:${
                      timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60
                    }`
                  : ""}
              </Typography>
            </Grid>

            <Grid container spacing={2} item>
              <Grid item xs={6}>
                <AuthButton
                  fullWidth
                  size="large"
                  onClick={handleOtpSignup}
                  disabled={loading || timeLeft === 0}
                >
                  {loading ? "Submitting..." : "Submit"}
                </AuthButton>
              </Grid>
              <Grid item xs={6}>
                <AuthButton
                  fullWidth
                  size="large"
                  onClick={handleResendOtp}
                  disabled={loading || timeLeft > 0}
                >
                  {loading ? "Processing..." : "Resend"}
                </AuthButton>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Modal>

      <Snackbar
        open={openAlert}
        autoHideDuration={4000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleAlertClose}
          severity={alertSeverity}
          sx={{ width: "100%" }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Signup;
