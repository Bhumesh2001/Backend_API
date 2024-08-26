const admin = require('firebase-admin');
const serviceAccount = require('./firebaseSA.key.json'); 

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
