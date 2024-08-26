const express = require('express');
const adminRouter = express();

// admin controllers
const adminController = require('../../controllers/adminController/adminCtrl');
const categoryController = require('../../controllers/adminController/category.adminCtrl');
const videoController = require('../../controllers/adminController/video.adminCtrl');
const userAdminController = require('../../controllers/adminController/user.adminCtrl');

// admin middleware
const { adminAuth, loginRateLimiter } = require('../../middlewares/adminMiddleware/auth.adminMdlwr');

// login/signup routes
adminRouter.post('/create-admin', adminController.createAdmin);
adminRouter.post('/login-admin', loginRateLimiter, adminController.loginAdmin);

// video routes
adminRouter.post(
    '/upload-video',
    adminAuth,
    videoController.uploadVideoToCloudinary
);

adminRouter.post('/upload-dummy-video', videoController.uploadDummyVideo);
adminRouter.get('/get-all-videos', adminAuth, videoController.getAllvideos);
adminRouter.get('/get-all-videos-by-category', adminAuth, videoController.getAllvideosByCategory);

// Category routes
adminRouter.post('/create-category', adminAuth, categoryController.createCategory);
adminRouter.get('/get-all/categories', adminAuth, categoryController.getAllCategories);
adminRouter.patch('/update-category/:categoryId', adminAuth, categoryController.updateCategory);
adminRouter.delete('/delete-categoriy/:categoryId', adminAuth, categoryController.deleteCategories);

// create user by admin 
adminRouter.post('/create-user', adminAuth, userAdminController.createUserByAdmin);
adminRouter.get('/all-users', adminAuth, userAdminController.getAllUsersByAdmin);
adminRouter.get('/single-user/:id', adminAuth, userAdminController.getSingleUserByAdmin);
adminRouter.get('/update-user/:id', adminAuth, userAdminController.updateUserByAdmin);
adminRouter.get('/delete-user/:id', adminAuth, userAdminController.deleteUserByAdmin);

module.exports = adminRouter;
