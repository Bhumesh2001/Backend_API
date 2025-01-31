const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const axios = require('axios');

const userModel = require('../../models/userModel/userModel');
const { generateCode } = require('../../utils/userUtils/resendOtp');

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(
    process.env.CLIENT_ID,
    process.env.ClIENT_SECRET,
    process.env.CALLBACK_URL
);

const temporaryStorage = new Map();

// --------------- Register User -----------------
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, mobileNumber } = req.body;

        if (!name || !email || !password || !mobileNumber) {
            return res.status(400).json({
                success: false,
                message: 'name, email, password and mobileNumber are required',
            });
        };
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (!strongPasswordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be strong (include upper, lower, number, and special character)',
            });
        };

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        };

        const Code = generateCode();
        const userData = {
            name,
            email,
            password,
            mobileNumber,
            Code,
        };
        temporaryStorage.set(email, userData);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Account Verification',
            text: `Your verification code is: ${Code}`,
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) return console.error(err);
            console.log('Verification email sent: ' + info.response);
        });

        res.status(201).json({
            success: true,
            message: 'Please verify your email',
        });

        let expireTime = 30 * 60 * 1000;
        setTimeout(() => {
            if(temporaryStorage.has(email)){
                temporaryStorage.delete(email);
                console.log(`Data for user "${email}" has expired and been removed.`);
            };
        }, expireTime);

    } catch (error) {
        console.log(error);

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
                message: `Duplicate field value entered for ${field}: ${error.keyValue[field]}. 
                Please use another value!`,
            });
        };

        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message,
        });
    };
};

// -------------- Verify User -------------------
exports.verifyUser = async (req, res) => {
    const { email, code } = req.body || req.query;
    try {
        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'email and code are required',
            });
        };

        let user_data;
        if (temporaryStorage.has(email)) {
            user_data = temporaryStorage.get(email);
        };

        if (!user_data) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification code.'
            });
        };
        const { Code, ...userData } = user_data;

        if (parseInt(code) !== Code) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect verification code.'
            });
        };
        const user = new userModel({
            name: userData.name,
            email: userData.email,
            password: userData.password,
            mobileNumber: userData.mobileNumber,
        });

        user.isVerified = true;
        await user.save();

        temporaryStorage.delete(email);

        res.status(200).json({
            success: true,
            message: 'Email verified successfully. You can now log in.'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'error occured during verify the user',
        });
    };
};

exports.resendCodeOrOtp = (req, res) => {
    try {
        const CodeOrOtp = generateCode();
        res.status(200).json({
            success: true,
            message: "Otp or Code gernerated successfully...",
            code: CodeOrOtp,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'error occured during genrating the code',
        });
    };
};

// -------------- Login User ---------------------
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.',
            });
        };
        const user = await userModel.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        };

        const token = jwt.sign(
            { email: user.email, role: user.role },
            process.env.USER_SECRET_KEY,
            { expiresIn: '6h' }
        );

        res.cookie('userToken', token, {
            httpOnly: true, // Prevents JavaScript access
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            maxAge: 6 * 60 * 60 * 1000 // 6 hours
        });

        res.status(200).json({
            success: true,
            message: 'User logged in successful...',
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'error occured during login',
        });
    };
};

// ------------- Logout User -----------------
exports.logoutUser = async (req, res) => {
    try {
        res.clearCookie('userToken');
        res.status(200).json({
            success: true,
            message: 'Logged out successfully...',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to log out.'
        });
    };
};

// ---------------- login with google ----------------- 
exports.redirectToGoogleProfile = async (req, res) => {
    try {
        const googleUrl = client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email'
            ],
        });
        res.status(200).json({
            success: true,
            message: 'Past this url into the browser',
            googleUrl,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'error during generate auth url',
        });
    };
};

exports.getGoogleProfile = async (req, res) => {
    const { code } = req.query;

    try {
        // Get the tokens using the authorization code
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        // Use the tokens to fetch the user's profile information
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const userId = payload['sub'];
        const email = payload['email'];
        const name = payload['name'];

        const token = jwt.sign({ email, role: 'user' }, process.env.USER_SECRET_KEY, { expiresIn: '6h' });

        res.cookie('userToken', token, {
            httpOnly: true, // Prevents JavaScript access
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            maxAge: 6 * 60 * 60 * 1000 // 6 hours
        });

        res.status(200).json({
            success: true,
            message: 'User logged in successful...',
        });
    } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).json({ success: false, message: 'Authentication failed' });
    };
};

// -------------------- login with facebook -------------------
exports.redirectToFacebookProfile = (req, res) => {
    try {
        const fbAuthUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&scope=email`;

        res.status(200).json({
            success: true,
            message: 'Paste this url into the browser',
            fbAuthUrl,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'error occured while redirect to fecebook profile',
        });
    };
};

exports.getFacebookProfile = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: 'No code provided' });
    };

    try {
        const tokenResponse = await axios.get('https://graph.facebook.com/v12.0/oauth/access_token', {
            params: {
                client_id: process.env.FACEBOOK_APP_ID,
                client_secret: process.env.FACEBOOK_APP_SECRET,
                redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
                code,
            },
        });
        const accessToken = tokenResponse.data.access_token;
        const userResponse = await axios.get('https://graph.facebook.com/me', {
            params: {
                fields: 'id,name,email',
                access_token: accessToken,
            },
        });
        const { email } = userResponse.data;
        const token = jwt.sign({ email, role: 'user' }, process.env.USER_SECRET_KEY, { expiresIn: '6h' });

        res.cookie('userToken', token, {
            httpOnly: true, // Prevents JavaScript access
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            maxAge: 6 * 60 * 60 * 1000 // 6 hours
        });

        res.status(200).json({
            success: true,
            message: 'User logged in successful...',
        });

    } catch (error) {
        console.error('Error during Facebook authentication:', error);
        res.status(500).json({ success: false, message: 'Authentication failed' });
    };
};
