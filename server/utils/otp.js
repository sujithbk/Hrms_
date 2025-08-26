function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { generateOtp };

// const bcrypt = require('bcryptjs');
// const prisma = require('../config/prisma');
// const transporter = require('../config/mailer');
// const { generateOtp } = require('../utils/otp');

// exports.register = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;
//     if (!name || !email || !password) {
//       return res.status(400).json({ success: false, message: "Name, email, and password are required" });
//     }
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({ success: false, message: "Invalid email address" });
//     }
//     if (password.length < 6) {
//       return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
//     }

//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) {
//       return res.status(409).json({ success: false, message: "Email is already registered" });
//     }

//     const userCount = await prisma.user.count();
//     const role = userCount === 0 ? "admin" : "user";
//     const hash = await bcrypt.hash(password, 12);
//     const otp = generateOtp();
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

//     await prisma.otp.deleteMany({ where: { email } });
//     await prisma.otp.create({ data: { email, otp, expiresAt } });

//     req.session.pendingUser = { name, email, password: hash, role };

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Email Verification OTP",
//       html: `<h2>Email Verification</h2>
//              <p>Your OTP is:</p>
//              <h1>${otp}</h1>
//              <p>This OTP expires in 10 minutes.</p>`
//     });

//     res.status(200).json({ success: true, message: "OTP sent to your email. Please verify." });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Registration error" });
//   }
// };

// exports.verifyOtp = async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     if (!req.session.pendingUser || req.session.pendingUser.email !== email) {
//       return res.status(400).json({ success: false, message: "No pending registration for this email" });
//     }

//     const otpRecord = await prisma.otp.findFirst({
//       where: { email, otp, expiresAt: { gt: new Date() } }
//     });

//     if (!otpRecord) {
//       return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
//     }

//     const { name, password, role } = req.session.pendingUser;
//     const newUser = await prisma.user.create({
//       data: { name, email, password, role }
//     });

//     await prisma.otp.deleteMany({ where: { email } });
//     delete req.session.pendingUser;
//     req.session.user = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };

//     res.status(201).json({ success: true, user: req.session.user, message: "Registration successful!" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "OTP verification error" });
//   }
// };

// exports.resendOtp = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!req.session.pendingUser || req.session.pendingUser.email !== email) {
//       return res.status(400).json({ success: false, message: "No pending registration for this email" });
//     }

//     const otp = generateOtp();
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

//     await prisma.otp.deleteMany({ where: { email } });
//     await prisma.otp.create({ data: { email, otp, expiresAt } });

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Resend OTP - Email Verification",
//       html: `<h2>Email Verification</h2>
//              <p>Your new OTP is:</p>
//              <h1>${otp}</h1>
//              <p>This OTP expires in 10 minutes.</p>`
//     });

//     res.status(200).json({ success: true, message: "New OTP sent to your email." });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Could not resend OTP" });
//   }
// };

// exports.logout = (req, res) => {
//   req.session.destroy(err => {
//     if (err) return res.status(500).json({ success: false, message: "Logout error" });
//     res.status(200).json({ success: true, message: "Logged out successfully"});
//   });
// };

// exports.status = (req, res) => {
//   if (req.session.user) {
//     return res.status(200).json({ success: true, authenticated: true, user: req.session.user });
//   }
//   return res.status(401).json({ success: false, authenticated: false });
// };
