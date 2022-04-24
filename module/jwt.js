const jwt = require('jsonwebtoken');

const secretKey = require('../config/secretKey');

module.exports = {
    sign: (user) => {
        const payload = {
            usrIdx: user.usrIdx,
            usrEml: user.usrEml,
        };

        const encodedToken = {
            token: jwt.sign(payload, secretKey)
        };

        return encodedToken;
    },
    verify: (token) => {
        let decoded;
        try {
            decoded = jwt.verify(token, secretKey);
        } catch (err) {
            console.log("jwt verify error");
            return -1;
        }
        return decoded;
    }
};