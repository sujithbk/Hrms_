// const router = require('express').Router()
// const jwt = require('jsonwebtoken')
// const bcrypt = require('bcrypt')
// const prisma = require('../config/prisma')
// const crypto = require('crypto')


// router.post('/registration', async(req,res)=>{
//     try{

   
//         const {name,email,password } = req.body

//         //// checking the username , email and password are in the field
//         if(!name || !email || !password){
//             return res.status(400).json({
//                 message: "Name , Email and Password are require",
//                 success:false
//             })
//         }

//         ///validating email

//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

//         if (!emailRegex.test(email)){
//            return res.status(400).json({
//             message:"Please enter a vaild email id",
//             success:false
//            })
//         }

//         // validating the password
//         if(password < 6 ){
//             return res.status(400).json({
//                 message:"Password must have  six character long atleast  "
//             })
//         }



//         /// checking the user is already register 
//         const exsitingUser =  await prisma.user.findUnique({email: req.body.email})


//         if(exsitingUser){
//             return res.status(400).json({
//                 message: "Email is already registred" ,
//                 success: false 
//             })
            
//         }


//         const saltRounds = 10
//         const hashedPassword = await bcrypt.hash(req.body.password,saltRounds) 

//         //checking the count of the user  
//         const userCount = await prisma.user.count()
//         const role = userCount === 0 ? 'admin' : 'user'

//         // deleting the verious oyp from the email
//         await prisma.otp.deleteMany({
//             email: req.body.email
//         })


//         await prisma.otp.create({
//             data:{
//                 email,
//                 otp,
//                 expiresAt
//             }
//         })

//         ////
//         // await 

//     }catch(error){
  
//     }
// })



// const express = require('express');
// const {
//   register,
//   verifyOtp,
//   resendOtp,
//   logout,
//   status
// } = require('../controllers/authController');



// router.post('/register', register);
// router.post('/verify-otp', verifyOtp);
// router.post('/resend-otp', resendOtp);
// router.post('/logout', logout);
// router.get('/status', status);

// module.exports = router;


// const express = require('express')
// const{
//   register
// } = require('../controllers/authControllers')


// const router = express.Router()

// router.post('/register',register)
// router.get('/test', (req, res) => {
//     res.json({ message: 'Auth router is working!' })
// })

// module.exports= router




// Debug wrapper for register
// router.post('/register', (req, res) => {
//     console.log('Register route hit!');
//     console.log('Request body:', req.body);
//     register(req, res);
// })

// routes/authRoutes.js
// const express = require('express');
// const { register, otpgeneration } = require('../controllers/authControllers.js');

// const router = express.Router();

// // Debug middleware to log all requests
// router.use((req, res, next) => {
//     console.log(`Auth Route: ${req.method} ${req.path}`);
//     console.log('Request body:', req.body);
//     next();
// });

// router.post('/register', register);
// router.post('/otp-verification', otpgeneration);

// module.exports = router;


const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware')
const { register, otpVerification , generatingOtp,login, forgotpassword, getAllUsers ,veryNewPasswordOtp, 
    loginOtp,logout} = require('../controllers/authControllers');

const router = express.Router();

// Debug middleware to log all requests
router.use((req, res, next) => {
    console.log(`Auth Route: ${req.method} ${req.path}`);
    console.log('Request body:', req.body);
    next();
});
router.use((req, res, next) => {
    console.log(`Auth Route: ${req.method} ${req.path}`);
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    next();
});
router.post('/register', register);
router.post('/otp-verification', otpVerification);
router.post('/generate-otp', generatingOtp)
router.post('/login',login)
router.post('/forgotpassword', forgotpassword)
router.post('/otpforgot' , veryNewPasswordOtp)
router.post('/otplogin',loginOtp)
router.post('/logout',logout)
router.get("/admin/users", authMiddleware, getAllUsers);

module.exports = router;
