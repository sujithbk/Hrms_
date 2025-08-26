// // const dotenv = require('dotenv');
// // dotenv.config();

// // const express = require('express');
// // const cors = require('cors');
// // const session = require('express-session');
// // const authRoutes = require('./routes/authRoutes');
// // const prisma = require('./config/prisma');

// // const app = express();

// // app.use(cors());
// // app.use(express.json());
// // app.use(session({
// //   secret: process.env.SESSION_SECRET || 'your-secret-key',
// //   resave: false,
// //   saveUninitialized: false,
// //   cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
// // }));

// // // Mount auth routes at /api/auth
// // app.use('/api/auth', authRoutes);

// // const PORT = process.env.PORT || 5000;

// // app.listen(PORT, () => {
// //   console.log(`Server running on port ${PORT}`);
// // });

// // // Test DB connection on startup
// // async function dataBaseConnection() {
// //   try {
// //     await prisma.user.findMany();
// //     console.log('Database connected successfully');
// //   } catch (err) {
// //     console.error('Error connecting to DB:', err);
// //     process.exit(1);
// //   }
// // }
// // dataBaseConnection();




// const dotenv = require('dotenv');
// dotenv.config();

// const express = require('express');
// const cors = require('cors');
// const session = require('express-session');
// const authRoutes = require('./routes/authRoutes');
// const prisma = require('./config/prisma');

// const app = express();

// app.use(cors({
//   origin: 'http://localhost:5173', 
//   credentials: true
// }));

// app.use(express.json());
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'your-secret-key',
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     secure: true, // set true if HTTPS
//     maxAge: 24 * 60 * 60 * 1000
//   }
// }));

// app.use('/api/auth', authRoutes);

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// (async () => {
//   try {
//     await prisma.user.findMany();
//     console.log('Database connected successfully');
//   } catch (err) {
//     console.error('Database connection failed:', err);
//     process.exit(1);
//   }
// })();


























const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const prisma = require('./config/prisma');

const app = express();

// CORS configuration with credentials
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true // This allows cookies/sessions to be sent
}));

app.use(express.json());

// FIXED SESSION CONFIGURATION
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,        // ✅ FIXED: Set to false for HTTP (localhost)
    httpOnly: true,       // ✅ ADDED: Prevents XSS attacks
    maxAge: 15 * 60 * 1000, // ✅ REDUCED: 15 minutes (more appropriate for OTP flow)
    sameSite: 'lax'       // ✅ ADDED: CSRF protection
  },
  name: 'sessionId'       // ✅ ADDED: Custom session name
}));

// Optional: Debug session middleware (remove in production)
app.use((req, res, next) => {
  console.log('🔍 Session Debug:');
  console.log('  Session ID:', req.sessionID);
  console.log('  Has Pending User:', !!req.session.pendingUser);
  if (req.session.pendingUser) {
    console.log('  Pending Email:', req.session.pendingUser.email);
  }
  console.log('  Route:', req.method, req.path);
  console.log('---');
  next();
});

// Mount auth routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Frontend URL: http://localhost:5173`);
  console.log(`🔧 API Base URL: http://localhost:${PORT}/api/auth`);
});

// Database connection test
(async () => {
  try {
    await prisma.user.findMany();
    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
})();
