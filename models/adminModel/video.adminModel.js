const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        unique: true,
        required: [true, 'Title is required'],
        minlength: [5, 'Title must be at least 5 characters long'],
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        minlength: [10, 'Description must be at least 10 characters long']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
    },
    thumbnail: {
        type: {
            publicId: {
                type: String,
                unique: true,
                required: [true, 'Public ID is required'],
            },
            url: {
                type: String,
                required: true,
                trim: true,
                validate: {
                    validator: function (v) {
                        return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/.test(v);
                    },
                    message: props => `${props.value} is not a valid URL for a thumbnail image!`
                }
            }
        },
        unique: true,
        required: [true, "Thumbnail is required!"],
    },
    video: {
        type: {
            publicId: {
                type: String,
                unique: true,
                required: [true, 'Public ID is required'],
            },
            url: {
                type: String,
                unique: true,
                required: [true, 'Video URL is required'],
                validate: {
                    validator: function (v) {
                        return /^(ftp|http|https):\/\/[^ "]+$/.test(v);
                    },
                    message: props => `${props.value} is not a valid URL!`
                }
            }
        },
        unique: true,
        required: [true, "Video is required!"],
    }
}, { timestamps: true });

videoSchema.index({ category: 1, title: 1 });

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
