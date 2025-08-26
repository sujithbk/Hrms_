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
  Checkbox,
  FormControlLabel,
  Modal,
  Grid,
  Alert,
  Snackbar,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { AuthButton, ButtonIcon } from "../../../components/Button";
import { useDispatch, useSelector } from "react-redux";
import { fetchLogin, verifyOtp, resetErrors } from "../../../redux/features/loginSlice";
import { useNavigate } from "react-router-dom";



const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const auth = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState("error");
  const [alertMessage, setAlertMessage] = useState("");

  // Timer for OTP expiration
  useEffect(() => {
    if (auth.otpSent) {
      setTimeLeft(60);
    }
  }, [auth.otpSent]);

  useEffect(() => {
    if (auth.otpSent && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [auth.otpSent, timeLeft]);

  // Alert messages
  useEffect(() => {
    if (auth.error) {
      setAlertMessage(auth.error);
      setAlertSeverity("error");
      setAlertOpen(true);
      dispatch(resetErrors());
    } else if (auth.otpError) {
      setAlertMessage(auth.otpError);
      setAlertSeverity("error");
      setAlertOpen(true);
      dispatch(resetErrors());
    } else if (auth.successMessage) {
      setAlertMessage(auth.successMessage);
      setAlertSeverity("success");
      setAlertOpen(true);
      dispatch(resetErrors());
    }
  }, [auth.error, auth.otpError, auth.successMessage, dispatch]);

  // // Role-based redirect after login
  // useEffect(() => {
  //   if (auth.isLoggedIn && auth.user?.role) {
  //     if (auth.user.role === "admin") {
  //       navigate("/admin/dashboard");
  //     } else if (auth.user.role === "user") {
  //       navigate("/user/dashboard");
  //     }
  //   }
  // }, [auth.isLoggedIn, auth.user, navigate]);

  useEffect(() => {
  if (auth.isLoggedIn && auth.user?.role) {
    if (auth.user.role === "admin") {
      navigate("/admin/dashboard");
    } else if (auth.user.role === "user") {
      navigate("/user/dashboard");
    }
  }
}, [auth.isLoggedIn, auth.user, navigate]);


  const handleTogglePassword = () => setShowPassword((prev) => !prev);
  const handleRememberMeChange = (e) => setRememberMe(e.target.checked);

  const handleLoginClick = () => {
    dispatch(fetchLogin({ email, password }));
  };

  const handleOtpSubmit = () => {
    if (!otp) {
      setAlertMessage("OTP is required");
      setAlertSeverity("error");
      setAlertOpen(true);
      return;
    }
    dispatch(verifyOtp({ otp }));
  };

  const handleResendOtp = () => {
    dispatch(fetchLogin({ email, password }));
  };

  const handleAlertClose = () => setAlertOpen(false);

  return (
    <Box minHeight="100vh" width="100%" display="flex" alignItems="center" justifyContent="center" bgcolor="#f4f6f8">
      <Paper elevation={3} sx={{ display: "flex", maxWidth: 1100, width: "100%", mt: 7, mb: 7 }}>
        <Box sx={{ flex: 1, px: 6, py: 6, display: "flex", flexDirection: "column", alignItems: "stretch", position: "relative" }}>
          <Box sx={{ position: "absolute", top: 32, left: 32 }}>
            <img src="https://www.intervaledu.com/static/web/images/logo/logo-dark.png" alt="Logo" width={150} />
          </Box>

          <Typography variant="h5" fontWeight={700} mb={3} mt={0}>
            Get Started
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
            disabled={auth.loading || auth.otpSent}
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
            disabled={auth.loading || auth.otpSent}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleTogglePassword} edge="end" aria-label="toggle password visibility" disabled={auth.loading || auth.otpSent}>
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
            onClick={handleLoginClick}
            disabled={auth.loading || auth.otpSent}
          >
            {auth.loading ? "Logging in..." : "Login"}
          </AuthButton>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <FormControlLabel
              control={<Checkbox checked={rememberMe} onChange={handleRememberMeChange} color="primary" disabled={auth.loading || auth.otpSent} />}
              label="Remember me"
              sx={{ m: 0 }}
            />
            <Link href="#" underline="none" variant="body2" onClick={() => navigate("/auth/forgotpassword")}>
              Forgot password?
            </Link>
          </Box>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              or
            </Typography>
          </Divider>

          <ButtonIcon disabled={auth.loading || auth.otpSent}>Login with Google</ButtonIcon>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 1 }}>
            <Typography variant="body2">Don't have an account?</Typography>
            <Link href="#" underline="none" variant="body2" fontWeight="bold" onClick={() => navigate("/auth/signup")} >
           
              Sign
            </Link>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minHeight: "100%" }} />

        <Modal open={auth.otpSent} aria-labelledby="otp-modal-title" aria-describedby="otp-modal-description" keepMounted onClose={() => {}}>
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
                <Typography id="otp-modal-title" variant="h6" fontWeight={600} textAlign="center">
                  OTP Verification
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant="body2" color="text.secondary" textAlign="center">
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
                  disabled={timeLeft === 0 || auth.otpLoading}
                />
              </Grid>
              <Grid item>
                <Typography variant="body2" color={timeLeft > 0 ? "error" : "primary"} textAlign="center">
                  {timeLeft > 0
                    ? `Time left: ${Math.floor(timeLeft / 60)}:${timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60}`
                    : ""}
                </Typography>
              </Grid>

              <Grid container spacing={2} item>
                <Grid item xs={6}>
                  <AuthButton fullWidth size="large" onClick={handleOtpSubmit} disabled={auth.otpLoading || timeLeft === 0}>
                    {auth.otpLoading ? "Submitting..." : "Submit"}
                  </AuthButton>
                </Grid>
                <Grid item xs={6}>
                  <AuthButton fullWidth size="large" onClick={handleResendOtp} disabled={auth.otpLoading || timeLeft > 0}>
                    {auth.otpLoading ? "Processing..." : "Resend"}
                  </AuthButton>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </Modal>

        <Snackbar open={alertOpen} autoHideDuration={4000} onClose={handleAlertClose} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
          <Alert onClose={handleAlertClose} severity={alertSeverity} sx={{ width: "100%" }} variant="filled">
            {alertMessage}
          </Alert>
        </Snackbar>
      </Paper>
    </Box>
  );
};

export default Login;
