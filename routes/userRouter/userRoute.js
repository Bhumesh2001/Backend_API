const express = require('express');
const userRouter = express.Router();

// controllers
const userController = require('../../controllers/userController/userCtrl');
const videoUserController = require('../../controllers/userController/video.userCtrl');
const paymentUserController = require('../../controllers/userController/payment.userCtrl');
const paymentGetwayController  = require('../../controllers/userController/pGetway.user.Ctrl');

// middlewares
const { userAuthentication } = require('../../middlewares/userMiddleware/userMidlwr');

// ********************* login/signup routes **********************

userRouter.post('/register', userController.registerUser);
userRouter.post('/verify-user', userController.verifyUser);
userRouter.post('/login', userController.loginUser);
userRouter.post('/logout', userController.logoutUser);

// login with google  
userRouter.get('/auth/google', userController.redirectToGoogleProfile);
userRouter.get('/auth/google/callback', userController.getGoogleProfile);

// login with facebook -
userRouter.get('/auth/facebook', userController.redirectToFacebookProfile);
userRouter.get('/auth/facebook/callback', userController.getFacebookProfile);

// resend otp or code route
userRouter.get('/resend-otp', userController.resendCodeOrOtp);

// ******************** Category routes **********************

// fetch all videos
userRouter.get('/fetch/all/videos', userAuthentication, videoUserController.getAllVideos);

// fetch all videos by category 
userRouter.get(
    '/fetch/all/videos/by-category',
    userAuthentication,
    videoUserController.getAllVideosByCategory
);

// ******************** Payments routes **********************

// create payment
userRouter.post(
    '/create-payment',
    userAuthentication,
    paymentUserController.CreatePayment
);

// get all payments 
userRouter.get('/get-all/payments', userAuthentication, paymentUserController.getAllPayments);

// get single payment
userRouter.get(
    '/get-single/payment/:paymentId', 
    userAuthentication, 
    paymentUserController.getSinglePayment
);

// ---------------------- payment getway routes --------------------------

// razorpay
userRouter.post('/create-order', userAuthentication, paymentGetwayController.createOrder);
userRouter.post('/verify-payment', userAuthentication, paymentGetwayController.verifyPayment);

// stripe


module.exports = userRouter;