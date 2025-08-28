
const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const JWT = require('jsonwebtoken')
const transporter = require('../config/mailer');
const { generateOtp } = require('../utils/otp');
const { getDayBounds, getCurrentSessionStart, calculateTodayRuntime } = require('../utils/timeUtils')
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


exports.roleCreation = async(req,res)=>{

  try {
     
    if(!req.user){
      res.status(404).json({
        message:"Authentication required",
        success: false
      })
    }
    
    const {role_name ,description} = req.body

    if(!role_name || !description){
      res.status(404).json({
        message:"Fill the inputfield properly",
        success: false
      })
    }

    const alreadyrole = await prisma.role.findUnique({
      where:{
        role_name
      }
    })

    if(alreadyrole == role_name){
      res.status(404).json({
        message:"This role is already in our db",
        successa:false
      })
    }

    const createRole = await prisma.role.create({
        data:{role_name ,description}
        
    })

    res.status(201).json({
      message:"Role created sucessfully",
      success:true,
      role:{
        role_name,
        description
      }
    })
    

    
  } catch (error) {
    console.error('Failed to create a role',error),
    res.status(400).json({
      message:"failed to create a role",
      success:false
    })
  }
}

exports.getRole = async(req,res) =>{
 try {
  

  const {user} = req.body

  if(!user){
    res.status(401).json({
      message:"User is not defiend",
      success:false
    })
  }
 
  const getRoles = await prisma.role.findMany({
    select:{
      role_name : true,
      description : true
    }
  })
  console.log(``);
  
  return


 } catch (error) {
  
 }
}






//  Check-In
exports.checkin = async (req, res) => {
  try {
      console.log("req.user object in checkin:", req.user);
    const userId = req.user?.id; // Get from JWT token
  

console.log("userId:", userId);

    
    if (!userId) {
      console.log(userId);
      
      return res.status(400).json({ success: false, message: "User ID is required" });
      
       
    }

    // Check if user is already checked in
    const currentSessionStart = await getCurrentSessionStart(userId);
    
    if (currentSessionStart) {
      return res.status(400).json({ 
        success: false, 
        message: "Already checked in",
        currentSessionStart: currentSessionStart
      });
    }

    // Create check-in record
    const checkinRecord = await prisma.checkInOut.create({
      data: {
        userId: userId,
        timestamp: new Date(),
        checkType: 1, // Check-in
        difference: null // No difference for check-in records
      }
    });

    // Get current total runtime for today
    const todayRuntime = await calculateTodayRuntime(userId);

    res.status(201).json({ 
      success: true, 
      message: "Check-in successful", 
      data: {
        record: checkinRecord,
        isCheckedIn: true,
        todayRuntime: todayRuntime,
        currentSessionStart: checkinRecord.timestamp
      }
    });

  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//  Check-Out
exports.checkout = async (req, res) => {
  try {
    const userId = req.user.id; // Get from JWT token

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Find current session start time
    const currentSessionStart = await getCurrentSessionStart(userId);
    
    if (!currentSessionStart) {
      return res.status(400).json({ 
        success: false, 
        message: "No active check-in found for today" 
      });
    }

    // Calculate session time in minutes
    const checkoutTime = new Date();
    const sessionMinutes = Math.floor((checkoutTime - new Date(currentSessionStart)) / (1000 * 60));

    // Create checkout record with time difference
    const checkoutRecord = await prisma.checkInOut.create({
      data: {
        userId: userId,
        timestamp: checkoutTime,
        checkType: 2, // Check-out
        difference: sessionMinutes
      }
    });

    // Get updated total runtime for today
    const todayRuntime = await calculateTodayRuntime(userId);

    res.status(200).json({ 
      success: true, 
      message: "Check-out successful", 
      data: {
        record: checkoutRecord,
        isCheckedIn: false,
        sessionMinutes: sessionMinutes,
        todayRuntime: todayRuntime
      }
    });

  } catch (error) {
    console.error("Check-out error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//  Status - Returns current status and runtime info
exports.status = async (req, res) => {
  try {
    const userId = req.user.id; // Get from JWT token

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Check if currently checked in
    const currentSessionStart = await getCurrentSessionStart(userId);
    const isCheckedIn = currentSessionStart !== null;

    // Calculate today's total runtime
    const todayRuntime = await calculateTodayRuntime(userId);

    // Calculate current session time if checked in
    let currentSessionMinutes = 0;
    if (isCheckedIn) {
      currentSessionMinutes = Math.floor((new Date() - new Date(currentSessionStart)) / (1000 * 60));
    }

    // Calculate total runtime including current session
    const totalRuntimeWithCurrentSession = todayRuntime + currentSessionMinutes;

    res.status(200).json({ 
      success: true, 
      data: {
        isCheckedIn: isCheckedIn,
        currentSessionStart: currentSessionStart,
        currentSessionMinutes: currentSessionMinutes,
        todayCompletedRuntime: todayRuntime, // Only completed sessions
        todayTotalRuntime: totalRuntimeWithCurrentSession, // Including current session
        todayRuntimeFormatted: `${Math.floor(totalRuntimeWithCurrentSession / 60)}h ${totalRuntimeWithCurrentSession % 60}m`,
        date: new Date().toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error("Status error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//History - Get historical records with daily summaries
exports.history = async (req, res) => {
  try {
    const userId = req.user.id; // Get from JWT token
    const { limit = 30, offset = 0, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Build where clause
    let whereClause = { userId: userId };
    
    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) {
        whereClause.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereClause.timestamp.lte = endDateTime;
      }
    }

    // Get all records
    const records = await prisma.checkInOut.findMany({
      where: whereClause,
      orderBy: { timestamp: "desc" },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Group records by date and calculate daily totals
    const dailySummary = {};
    
    records.forEach(record => {
      const date = record.timestamp.toISOString().split('T')[0];
      
      if (!dailySummary[date]) {
        dailySummary[date] = {
          date: date,
          totalMinutes: 0,
          sessions: [],
          checkins: [],
          checkouts: []
        };
      }
      
      if (record.checkType === 1) {
        dailySummary[date].checkins.push(record);
      } else if (record.checkType === 2) {
        dailySummary[date].checkouts.push(record);
        dailySummary[date].totalMinutes += record.difference || 0;
      }
      
      dailySummary[date].sessions.push(record);
    });

    // Format daily summaries
    const formattedDailySummary = Object.values(dailySummary).map(day => ({
      ...day,
      totalHours: Math.floor(day.totalMinutes / 60),
      remainingMinutes: day.totalMinutes % 60,
      formattedTime: `${Math.floor(day.totalMinutes / 60)}h ${day.totalMinutes % 60}m`,
      sessionCount: Math.floor(day.sessions.length / 2) // Each session has checkin + checkout
    }));

    // Get total count for pagination
    const totalRecords = await prisma.checkInOut.count({
      where: whereClause
    });

    res.status(200).json({ 
      success: true, 
      message: "History fetched successfully", 
      data: {
        records: records,
        dailySummary: formattedDailySummary,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: totalRecords,
          hasMore: (parseInt(offset) + parseInt(limit)) < totalRecords
        }
      }
    });

  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get Today's Sessions - Detailed view of today's check-ins and check-outs
exports.todaySessions = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const { startOfDay, endOfDay } = getDayBounds();

    const todayRecords = await prisma.checkInOut.findMany({
      where: {
        userId: userId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    // Group into sessions (checkin-checkout pairs)
    const sessions = [];
    let currentSession = null;

    todayRecords.forEach(record => {
      if (record.checkType === 1) { // Check-in
        if (currentSession) {
          // Previous session wasn't closed properly, close it
          sessions.push(currentSession);
        }
        currentSession = {
          checkin: record,
          checkout: null,
          duration: 0
        };
      } else if (record.checkType === 2 && currentSession) { // Check-out
        currentSession.checkout = record;
        currentSession.duration = record.difference || 0;
        sessions.push(currentSession);
        currentSession = null;
      }
    });

    // If there's an active session, add it
    if (currentSession) {
      const now = new Date();
      currentSession.duration = Math.floor((now - new Date(currentSession.checkin.timestamp)) / (1000 * 60));
      currentSession.isActive = true;
      sessions.push(currentSession);
    }

    const totalMinutes = sessions.reduce((total, session) => total + session.duration, 0);

    res.status(200).json({
      success: true,
      data: {
        date: new Date().toISOString().split('T')[0],
        sessions: sessions,
        totalMinutes: totalMinutes,
        totalFormatted: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
        sessionCount: sessions.length,
        isCurrentlyCheckedIn: currentSession !== null
      }
    });

  } catch (error) {
    console.error("Today's sessions error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};





