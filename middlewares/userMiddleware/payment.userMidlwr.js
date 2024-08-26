// const UserPayment = require('../../models/userModel/payment.userModel');

// exports.isSubscriptionValid = async (req, res, next) => {
//     const userId = req.user._id;
//     const category = req.params.category;

//     const payment = await UserPayment.findOne({
//         userId,
//         category,
//         subscriptionType: 'subscription',
//         expiryDate: { $gte: new Date() },
//     });

//     if (payment) {
//         next();
//     } else {
//         return res.status(403).json({
//             success: false,
//             message: 'Your subscription for this category has expired.',
//         });
//     };
// };
