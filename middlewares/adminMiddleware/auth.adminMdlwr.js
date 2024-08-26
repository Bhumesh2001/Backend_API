const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

exports.adminAuth = async (req, res, next) => {
    const token = req.cookies.adminToken;    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Unauthorized. Please log in.', 
        });
    };
    try {
        const decoded = jwt.verify(token, process.env.ADMIN_SECRET_KEY);       
        if (decoded.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Admins only.', 
            });
        };
        req.admin = decoded;
        next();
    } catch (error) {
        console.log(error);
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid token.' 
        });
    };
};

exports.loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many login attempts. Please try again later.',
});