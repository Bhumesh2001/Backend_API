const videoModel = require('../../models/adminModel/video.adminModel');
const userModel = require('../../models/userModel/userModel');
const userPaymentModel = require('../../models/userModel/payment.userModel');

exports.getAllVideos = async (req, res) => {
    try {
        const email = req.user.email;
        const user = await userModel.findOne({ email }, { _id: 1 });

        const userPayment = await userPaymentModel.find({ userId: user._id }, { category: 1 });
        let paidCategories = userPayment.map(paymentObj => paymentObj.category);

        let videos = await videoModel.find({}, { __v: 0 }).lean();

        videos = videos.map(video => ({
            ...video,
            thumbnail: video.thumbnail.url,
            video: video.video.url,
            paid: paidCategories.includes(video.category) ? true : false,
        }));

        if (videos.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Video not found!",
            });
        };

        res.status(200).json({
            success: true,
            message: 'All videos fetched successfully...',
            videos,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Error occured while fetching the videos',
        });
    };
};

exports.getAllVideosByCategory = async (req, res) => {
    try {
        const { category } = req.body || req.query;
        if (!category) {
            return res.status(400).json({
                success: false,
                messagge: 'category is required',
            });
        };
        let videosByCategory = await videoModel.find({ category }, { __v: 0 }).lean();
        
        const email = req.user.email;
        const user = await userModel.findOne({ email }, { _id: 1 });

        const Categories = await userPaymentModel.find(
            { userId: user._id, category },
            { category: 1, _id: 0 },
        );
        const paidCategories = Categories.map(doc => doc.category);

        videosByCategory = videosByCategory.map(video => ({
            ...video,
            thumbnail: video.thumbnail.url,
            video: video.video.url,
            paid: paidCategories.includes(video.category) ? true : false,
        }));

        if (videosByCategory.length === 0) {
            return res.status(404).json({
                success: true,
                message: "videos not found!",
            });
        };
        res.status(200).json({
            success: true,
            message: "Video fetched By category successfully...",
            videosByCategory,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Error occured while fetching the videos by category',
        });
    };
};
