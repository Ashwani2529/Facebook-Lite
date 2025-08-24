const jwt = require('jsonwebtoken');
const config = require('../config/constants');
const mongoose = require('mongoose');
const User = mongoose.model("User");

module.exports = function(req, res, next) {
    console.log('Login middleware hit');
    const { authorization } = req.headers;
    console.log('Authorization header:', authorization);
    
    if (!authorization) {
        return res.status(401).json({ "error": "you must be logged in" });
    }

    // authorization will be like authorization === Bearer djkfakhkkjfhg
    const token = authorization.replace("Bearer ", "");
    console.log('Token extracted:', token);
    
    jwt.verify(token, config.jwt.secret, (err, payload) => {
        if (err) {
            console.log('JWT verification error:', err);
            return res.status(401).json({ "error": "you must be logged in" });
        }
        console.log('JWT payload:', payload);
        
        const { _id } = payload;
        User.findById(_id).then(userData => {
            if (!userData) {
                return res.status(401).json({ "error": "you must be logged in" });
            }
            console.log('User found:', userData.email);
            req.user = userData;
            next();
        }).catch(err => {
            console.log('User lookup error:', err);
            return res.status(401).json({ "error": "you must be logged in" });
        });
    });
}
