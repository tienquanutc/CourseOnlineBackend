const jwt = require('jsonwebtoken');
const _ = require('lodash');
const config = require("../../config/config");
const {errResponse} = require('../response/response');
/***
 *
 * @returns {Function} middleware to authorization and authentication
 * @param claimsRequired object contain roles..... etc required to authentication
 */
let auth = function (claimsRequired) {
    let roles = claimsRequired.roles || [];
    return function (req, res, next) {
        const authorizationHeader = req.headers.authorization;

        if (!authorizationHeader)
            return res.status(401).send(new errResponse(401, 'Missing authorization header'));
        if (!authorizationHeader.startsWith('Bearer '))
            return res.status(401).send(new errResponse(401, 'Missing Bearer authorization header'));

        const parts = authorizationHeader.split(' ');
        if (parts.length !== 2)
            return res.status(401).send(new errResponse(401, 'Authorization header must be: Bearer ${token}'));
        const token = parts[1];

        jwt.verify(token, config.jwt.secret, (err, user) => {
            if (err)
                return res.status(401).send(new errResponse(401, 'Invalid token'));
            const now = new Date();
            const nowSecond = now.getTime() / 1000;
            //expired token
            if (nowSecond >= user.exp) {
                return res.status(401).send(new errResponse(401, `Token expired at ${new Date(user.exp * 1000)}, but now is ${now}`));
            }
            req.user = user;
            // check role
            const permission = roles.length !== 0 && (_.includes(roles, '*') || _.intersection(user.roles, roles).length !== 0);
            if (!permission) return res.status(403).send(new errResponse(403, 'Token have not enough permission'));

            req.user = user;
            return next();
        });

    }
};

module.exports = auth;