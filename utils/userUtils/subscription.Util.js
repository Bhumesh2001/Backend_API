const cron = require('node-cron');
const userPaymentModel = require('../../models/userModel/payment.userModel');

// Function to check and update expired subscriptions
const checkAndUpdateExpiredSubscriptions = async () => {
    try {
        const currentDate = new Date();

        // Find all subscriptions that are expired
        const expiredSubscriptions = await userPaymentModel.find({
            subscriptionType: 'subscription',
            expiryDate: { $lt: currentDate },
        });

        if (expiredSubscriptions.length > 0) {
            for (const subscription of expiredSubscriptions) {
                await userPaymentModel.deleteOne({
                    userId: subscription.userId,
                    category: subscription.category
                });
                console.log(`
                    Subscription expired for userId: ${subscription.userId} 
                    in category: ${subscription.category}`
                );
            };
        } else {
            // console.log('No expired subscriptions found.');
        };
    } catch (error) {
        console.error('Error checking expired subscriptions:', error);
    };
};

// running a task every minute
cron.schedule('* * * * *', checkAndUpdateExpiredSubscriptions, {
    timezone: "UTC"
});
