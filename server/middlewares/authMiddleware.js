// // ===== SIMPLIFIED AUTH MIDDLEWARE (Optional Authentication) =====
// const JWT = require('jsonwebtoken');

// const authMiddleware = (req, res, next) => {
//   try {
//     console.log('Auth middleware hit');
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       console.log('No bearer token found');
//       return res.status(401).json({ 
//         success: false, 
//         message: 'No token provided. Authorization header required.' 
//       });
//     }

//     const token = authHeader.split(' ')[1];
//     const decoded = JWT.verify(token, process.env.JWT_TOKEN);
    
//     console.log('Decoded token:', decoded);

//     req.user = {
//       id: decoded.userId,
//       email: decoded.email,
//       role: decoded.role
//     };

//     console.log('Authenticated user:', req.user);
//     next();
//   } catch (error) {
//     console.error('Authentication error:', error);
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({ success: false, message: 'Token has expired.' });
//     }
//     return res.status(401).json({ success: false, message: 'Authentication failed.' });
//   }
// };

// module.exports = authMiddleware;


// middlewares/authMiddleware.js
const JWT = require("jsonwebtoken");
require('dotenv').config();

// First middleware
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false, 
        message: "No token provided. Authorization header required." 
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = JWT.verify(token, process.env.JWT_TOKEN);

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token has expired." });
    }
    return res.status(401).json({ success: false, message: "Authentication failed." });
  }
};



const authCheckMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = JWT.verify(token, process.env.JWT_TOKEN);

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    console.log("Middleware set req.user:", req.user);
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};



module.exports = {
  authMiddleware,
 
  authCheckMiddleware
};




