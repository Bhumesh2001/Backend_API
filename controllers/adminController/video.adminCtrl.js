const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const streamifier = require('streamifier');
const Video = require('../../models/adminModel/video.adminModel');

// ------------- upload video -----------------

const uploadStream = (fileBuffer, options) => {
    return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (result) {
                resolve(result);
            } else {
                reject(error);
            }
        });
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

exports.uploadDummyVideo = async (req, res) => {
    try {
        if (req.body.length == 0) {
            return res.status(400).json({
                success: false,
                message: "No data"
            });
        };
        await Video.insertMany(req.body);
        res.status(201).json({
            success: true,
            message: "videos uploaded successfully...",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "error occured while inserting the video"
        });
    };
};

exports.uploadVideoToCloudinary = async (req, res) => {
    try {
        const { title, description, category, video, thumbnail } = req.body;

        const videoFile = req.files?.video || video;
        const thumbnailFile = req.files?.thumbnail || thumbnail;

        if (!title || !description || !category || !videoFile || !thumbnailFile) {
            return res.status(400).json({
                success: false,
                message: 'Title, description, category, video, and thumbnail are required.',
            });
        };
        // Initialize video object
        let videoObj = {
            title,
            description,
            category,
            thumbnail: {
                publicId: '',
                url: ''
            },
            video: {
                publicId: '',
                url: ''
            },
        };
        // Handle video upload
        if (req.files && req.files.video) {
            const videoBuffer = fs.readFileSync(req.files.video.tempFilePath);

            const videoResult = await uploadStream(videoBuffer, {
                resource_type: 'video',
                chunk_size: 6000000,  // Chunk size for large file uploads
            });
            videoObj.video.publicId = videoResult.public_id;
            videoObj.video.url = videoResult.secure_url;
        } else if (video) {
            const videoResult = await cloudinary.uploader.upload(video, {
                resource_type: 'video'
            });
            videoObj.video.publicId = videoResult.public_id;
            videoObj.video.url = videoResult.secure_url;
        };

        // Handle thumbnail upload
        if (req.files && req.files.thumbnail) {
            const thumbnailResult = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath, {
                resource_type: 'image'
            });
            videoObj.thumbnail.publicId = thumbnailResult.public_id;
            videoObj.thumbnail.url = thumbnailResult.secure_url;
        } else if (thumbnail) {
            const thumbnailResult = await cloudinary.uploader.upload(thumbnail, {
                resource_type: 'image'
            });
            videoObj.thumbnail.publicId = thumbnailResult.public_id;
            videoObj.thumbnail.url = thumbnailResult.secure_url;
        };

        const newVideo = new Video(videoObj);
        await newVideo.save();

        res.status(200).json({
            success: true,
            message: 'Video uploaded successfully!',
            video: newVideo,
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: validationErrors,
            });
        };
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue);
            return res.status(409).json({
                success: false,
                message: `Duplicate field value entered for ${field}: ${error.keyValue[field]}. Please use another value!`,
            });
        };
        res.status(500).json({
            success: false,
            message: 'Error occurred while uploading the video',
            error,
        });
    };
};

exports.getAllvideos = async (req, res) => {
    try {
        const videos = await Video.find({}, { __v: 0 });
        if (videos.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Videos not found",
            });
        };
        res.status(200).json({
            success: true,
            message: 'Video fetched successfully...',
            videos,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'error occured while fetching the video',
        });
    };
};

exports.getAllvideosByCategory = async (req, res) => {
    try {
        const category = req.body.category || req.query.category;
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'category is required',
            });
        };
        const videosByCategory = await Video.find({ category }, { __v: 0 });
        if (videosByCategory.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Videos Not Found',
            });
        };
        res.status(200).json({
            success: false,
            message: 'Videos fetched successfully...',
            videosByCategory,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'error occured while fetching the video',
        });
    };
};

