const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.ClIENT_SECRET,
    process.env.CALLBACK_URL,
);

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
});

module.exports = {
    oauth2Client,
    authUrl,
};
