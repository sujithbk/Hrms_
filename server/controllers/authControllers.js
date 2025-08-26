
const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const JWT = require('jsonwebtoken')
const transporter = require('../config/mailer');
const { generateOtp } = require('../utils/otp');
require('dotenv').config();


exports.register = async (req, res) => {
  try {
    console.log('Register endpoint hit with body:', req.body);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, Email and Password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email id" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least six characters long" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userCount = await prisma.user.count();

    // Upsert role as admin if first user, else user role
    let roleRecord;
    if (userCount === 0) {
      roleRecord = await prisma.role.upsert({
        where: { role_name: 'admin' },
        update: {},
        create: { role_name: 'admin', description: 'Administrator role' }
      });
    } else {
      roleRecord = await prisma.role.upsert({
        where: { role_name: 'user' },
        update: {},
        create: { role_name: 'user', description: 'Regular user role' }
      });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 1 * 60 * 1000);

    await prisma.otp.deleteMany({ where: { email } });
    await prisma.otp.create({ data: { email, otp, expiresAt } });

    req.session.pendingUser = {
      name,
      email,
      password_hash: hashedPassword,
      role_id: roleRecord.id
    };

    console.log('Session stored:', req.session.pendingUser);

           // email sending
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Email Verification OTP",
                html: `<h2>Email Verification</h2>
                        <p>Your OTP is:</p>
                        <h1>${otp}</h1>
                        <p>This OTP expires in 10 minutes.</p>`
            });

            res.status(200).json({ 
                success: true,
                message: "OTP sent to your email. Please verify."
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                success: false,
                message: "There is an error while sending the email"
            });
        }

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: "Registration error" });
  }
};


exports.otpVerification = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP is required" });
    }

    if (!req.session.pendingUser || !req.session.pendingUser.email) {
      return res.status(400).json({ success: false, message: "Session expired. Please register again." });
    }

    const email = req.session.pendingUser.email;

    // Find OTP record by email and otp
    const otpRecord = await prisma.otp.findFirst({
      where: {
        email,
        otp,
        expiresAt: { gt: new Date() }
      }
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Create the user in DB with data from session
    const { name, password_hash, role_id } = req.session.pendingUser;

    const newUser = await prisma.user.create({
      data: { name, email, password_hash, role_id, is_active: true },
      include: { role: true }
    });

    // Clean up session and OTP
    await prisma.otp.deleteMany({ where: { email } });
    delete req.session.pendingUser;
    
    // FIXED: JWT token generation with correct variable name
    const token = JWT.sign(
      {
        userId: newUser.id,           // ✅ Fixed: was 'user.id'
        email: newUser.email,         // ✅ Fixed: was 'user.email'
        role: newUser.role?.role_name // ✅ Fixed: was 'user.role?.role_name'
      },
      process.env.JWT_TOKEN,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      success: true,
      message: "Registration completed successfully!",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role?.role_name
      },
      token
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: "OTP verification error" });
  }
};


exports.generatingOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Check your email",
      success: false
    });
  }

  try {
    // CRITICAL FIX: Validate session exists and matches the email
    if (!req.session.pendingUser || !req.session.pendingUser.email) {
      return res.status(400).json({
        success: false,
        message: "Session expired. Please register again."
      });
    }

    if (req.session.pendingUser.email !== email) {
      return res.status(400).json({
        success: false,
        message: "Email mismatch with registration session."
      });
    }

    // Check if there's an existing OTP for this email
    const existingOtp = await prisma.otp.findFirst({
      where: { email }
    });

    // If OTP exists and hasn't expired, don't generate a new one
    if (existingOtp) {
      const now = new Date();
      const isExpired = now > existingOtp.expiresAt;
      
      if (!isExpired) {
        // Calculate remaining time in seconds
        const remainingTime = Math.ceil((existingOtp.expiresAt.getTime() - now.getTime()) / 1000);
        
        return res.status(409).json({
          success: false,
          message: "OTP already sent and still valid. Please check your email.",
          remainingTime: remainingTime,
          expiresAt: existingOtp.expiresAt
        });
      } else {
        // OTP exists but has expired, remove it
        await prisma.otp.deleteMany({ where: { email } });
        console.log(`Expired OTP removed for email: ${email}`);
      }
    }

    // Generate new OTP only if no valid OTP exists
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 minute

    // Create the new OTP record
    await prisma.otp.create({
      data: { email, otp, expiresAt }
    });

    // Send OTP email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification OTP - Resend",
      html: `
        <h2>Email Verification</h2>
        <p>Your new OTP is: <b>${otp}</b></p>
        <p>This OTP expires in 1 minute.</p>
        <p><small>This is a resent OTP for your pending registration.</small></p>
      `
    });

    console.log(`New OTP ${otp} generated for ${email}, expires at ${expiresAt}`);

    return res.status(200).json({
      success: true,
      message: "New OTP sent to your email. Please verify.",
      expiresAt: expiresAt,
      expiresIn: 60 // seconds
    });

  } catch (error) {
    console.error("Error generating OTP:", error);
    return res.status(500).json({
      success: false,
      message: "There was an error while sending the OTP"
    });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    // Find user and include role relation
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email is not registered."
      });
    }

    // Compare password hashes
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password."
      });
    }

    // Generate a 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 minutes

    // Save OTP record in database
    await prisma.otp.create({
      data: {
        email: user.email,
        otp,
        expiresAt: otpExpiresAt
      }
    });

    // Store email, hashed password, and OTP expiration timestamp in session.pendingUser
    req.session.pendingUser = {
      email: user.email,
      passwordHash: user.password_hash,
      otpExpiresAt: otpExpiresAt.getTime() // storing timestamp for session check if needed
    };

    // Send OTP email using transporter
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Email Verification OTP",
        html: `<h2>Email Verification</h2>
               <p>Your OTP is:</p>
               <h1>${otp}</h1>
               <p>This OTP expires in 10 minutes.</p>`
      });

      res.status(200).json({
        success: true,
        message: "OTP sent to your email. Please verify."
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "There is an error while sending the email"
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: "Login error occurred."
    });
  }
};


// exports.loginOtp = async (req, res) => {
//   try {
//     const { otp } = req.body;

//     if (!otp) {
//       return res.status(400).json({ success: false, message: "OTP is required" });
//     }

//     if (!req.session.pendingUser || !req.session.pendingUser.email) {
//       return res.status(400).json({ success: false, message: "Session expired. Please login again." });
//     }

//     const email = req.session.pendingUser.email;

//     // Find OTP record by email and otp that has not expired
//     const otpRecord = await prisma.otp.findFirst({
//       where: {
//         email,
//         otp,
//         expiresAt: { gt: new Date() }
//       }
//     });

//     if (!otpRecord) {
//       return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
//     }

//     // Fetch user details
//     const user = await prisma.user.findUnique({
//       where: { email },
//       include: { role: true }
//     });

//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     // Generate JWT token
//     const token = JWT.sign(
//       {
//         userId: user.id,
//         email: user.email,
//         role: user.role?.role_name
//       },
//       process.env.JWT_TOKEN,
//       { expiresIn: '1h' }
//     );

//     // Cleanup: delete OTP record(s) for this email after successful login
//     await prisma.otp.deleteMany({ where: { email } });

//     // Clear pendingUser from session to mark login completion
//     delete req.session.pendingUser;

//     res.status(200).json({
//       success: true,
//       message: "Login successful.",
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         role: user.role?.role_name
//       },
//       token
//     });

//   } catch (error) {
//     console.error('Login OTP verification error:', error);
//     res.status(500).json({ success: false, message: "OTP verification error occurred." });
//   }
// };

exports.loginOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }

    if (!req.session.pendingUser || !req.session.pendingUser.email) {
      return res.status(400).json({ success: false, message: 'Session expired. Please login again.' });
    }

    const email = req.session.pendingUser.email;

    // Verify the OTP exists and is not expired
    const otpRecord = await prisma.otp.findFirst({
      where: {
        email,
        otp,
        expiresAt: { gt: new Date() }
      }
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Normalize role if role object
    const userRole = user.role ? user.role.role_name : null;

    const token = JWT.sign(
      {
        userId: user.id,
        email: user.email,
        role: userRole
      },
      process.env.JWT_TOKEN,
      { expiresIn: '1h' }
    );

    await prisma.otp.deleteMany({ where: { email } });

    delete req.session.pendingUser;

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole
      },
      token
    });
  } catch (error) {
    console.error('Login OTP verification error:', error);
    return res.status(500).json({ success: false, message: 'OTP verification error occurred.' });
  }
};


exports.forgotpassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email presence and format
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // Validate password presence and minimum length
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
    }

    // Check if user exists
    const realUser = await prisma.user.findUnique({ where: { email } });
    if (!realUser) {
      return res.status(404).json({ success: false, message: "Email is not registered" });
    }

    // Generate OTP and set expiry
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 minute expiry

    // Delete any previous OTP for this email
    await prisma.otp.deleteMany({ where: { email } });

    // Save new OTP to DB
    await prisma.otp.create({ data: { email, otp, expiresAt } });

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store email and hashed new password in session for use during OTP verification
    req.session.pendingUser = {
      email,
      newPasswordHash: hashedPassword
    };

    // Send OTP email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset OTP",
        html: `<h2>Password Reset Verification</h2>
               <p>Your OTP is:</p>
               <h1>${otp}</h1>
               <p>This OTP expires in 1 minute.</p>`
      });

      return res.status(200).json({
        success: true,
        message: "OTP sent to your email. Please verify."
      });
    } catch (emailErr) {
      console.error('Error sending email:', emailErr);
      return res.status(500).json({
        success: false,
        message: "There was an error sending the email."
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: "Forgot password error occurred."
    });
  }
};


exports.veryNewPasswordOtp = async (req, res) => {
  try {
    console.log('Forgot password OTP verification endpoint hit with body:', req.body);
    console.log('Session data:', req.session.pendingUser);

    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP is required" });
    }

    if (!req.session.pendingUser || !req.session.pendingUser.email || !req.session.pendingUser.newPasswordHash) {
      return res.status(400).json({ success: false, message: "Session expired or missing data. Please restart the forgot password process." });
    }

    const email = req.session.pendingUser.email;

    // Find the OTP record by email and otp which is not expired
    const otpRecord = await prisma.otp.findFirst({
      where: {
        email,
        otp,
        expiresAt: { gt: new Date() }
      }
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Update the user's password with the new hashed password stored in session
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        password_hash: req.session.pendingUser.newPasswordHash
      }
    });

    // Clean up: delete OTP records and clear pendingUser session
    await prisma.otp.deleteMany({ where: { email } });
    delete req.session.pendingUser;

    res.status(200).json({
      success: true,
      message: "Password reset successful! You can now login with your new password.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email
      }
    });

  } catch (error) {
    console.error('Forgot password OTP verification error:', error);
    res.status(500).json({ success: false, message: "An error occurred during OTP verification." });
  }
};




exports.logout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ success: false, message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ success: true, message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Logout error occurred" });
  }
};

// In your authControllers.js file, replace your getAllUsers function with this:
exports.getAllUsers = async (req, res) => {
  try {
    console.log('getAllUsers endpoint hit');
    console.log('User from middleware:', req.user);

    // Only check authentication, no admin role check
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    // Fetch only name and email as requested
    const users = await prisma.user.findMany({
      select: {
        name: true,
        email: true
      }
    });

    console.log(`Found ${users.length} users`);

    return res.json({ 
      success: true, 
      users: users,
      count: users.length 
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

