const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mailService = require('../service/mailService');
const User = require('../models/User');
const config = require('../../config/config');
const {errResponse, messageResponse} = require('../response/response');

/***
 * POST login
 */

function login(req, res, next) {
    const {username, password} = req.body;
    if (!username || !password) return res.status(400).send(new errResponse(400, 'username and password required'));

    User.findOne({username: username}).exec()
        .then(user => {
            if (!user) return res.status(401).send(new errResponse(401, 'Invalid user ' + username));
            if (user.banned) return res.status(401).send(new errResponse(401, 'Your account is banned'));

            user.comparePassword(password).then(isMatch => {
                if (!isMatch) return res.status(401).send(new errResponse(401, 'Invalid email or password'));
                if (!user.is_verified) return res.status(401).send(new errResponse(401, 'Your account has not been verified.'));

                let expired = parseInt(new Date().getTime() / 1000 + config.jwt.live);
                let payload = {
                    _id: user._id,
                    roles: user.roles,
                    exp: expired
                };
                let token = jwt.sign(payload, config.jwt.secret);
                let refresh_token = crypto.randomBytes(32).toString('hex');

                user.refresh_token = refresh_token;
                user.save((error, user) => {
                    if (error) return res.status(500).send(new errResponse(500, error.message));
                    res.status(200).send({
                        meta: {status_code: 200, message: 'login success'},
                        data: {
                            username: user.username,
                            token: token,
                            refresh_token: refresh_token,
                            expired: expired
                        }
                    });
                });
            });
        });
}


/***
 * POST Register new user
 */

function registerUser(req, res, next) {
    const body = req.body;
    const {username, password, email} = body;

    if (!username || !password || !email)
        return res.status(422).send(new errResponse(422, 'username, password and email is required'));

    User.find({$or: [{username: username}, {email: email}]}, {username: 1, email: 1}).exec()
        .catch(err => res.status(500).send(new errResponse(500, err.message)))
        .then(users => {
            if (users.length === 2)
                return res.status(422).send(new errResponse(422, 'username and email already exist!'));

            if (users.length === 1) {
                if (users[0].username)
                    return res.status(422).send(new errResponse(422, 'username already exist!'));
                return res.status(422).send(new errResponse(422, 'email already exist!'))
            }

            let user = new User({
                username: username,
                password: password,
                email: email,
                verify_token: crypto.randomBytes(16).toString('hex')
            });

            return user.save()
                .then(user => mailService.sendMailVerification(user, user.verify_token, req.headers.host))
                .then(info => res.status(200).send(new messageResponse(`A verification mail has been sent to ${user.email}`)))
        })
        .catch(err => res.status(500).send(new errResponse(500, err.message)));
}

/**
 * Get confirm email
 */

function confirmationAccount(req, res, next) {
    const token = req.params.token;

    User.findOne({verify_token: token, verify_token_expires: {$gt: Date.now()}}).exec().then(user => {
        if (!user) return res.status(400).send(new errResponse(400, 'Invalid token or token have expired'));
        if (user.is_verified) return res.status(400).send(new errResponse(400, 'already verified'));
        user.is_verified = true;
        return user.save((err, user) => {
            if (error) return res.status(500).send(new errResponse(500, err.message));
            res.status(200).send("The account has been verified. Please login");
        });
    }).catch(err => res.status(500).send(err.message));
}


/**
 * POST resend email verified
 */
function resendEmailVerify(req, res, next) {
    const email = req.body.email;
    if (!email) res.status(422).send(new errResponse(422, 'email is required'));

    User.findOne({email: email}, {profile: 0}).exec()
        .then(user => {
            if (!user) return res.status(422).send(new errResponse(422, 'unable to find a user with that email.'));
            if (user.is_verified) return res.status(400).send(new errResponse(400, 'already verified'));

            user.verify_token = crypto.randomBytes(16).toString('hex');
            return user.save().then(user => mailService.sendMailVerification(user, user.verify_token, req.headers.host))
                .then(info => res.status(200).send(new messageResponse(`A verification mail has been resent to ${user.email}`)))
        })
        .catch(err => res.status(500).send(new errResponse(500, err.message)));
}


/**
 * POST change password
 */
function changePassword(req, res, next) {
    const {old_password, new_password} = req.body;
    if (!old_password && !new_password)
        return res.status(402).send(new messageResponse('old_password and new_password reqired'));

    const userId = req.user._id;
    User.findOne({_id: userId}, {password: 1}).exec()
        .then(user => {
            return user.comparePassword(old_password).then(isMatch => {
                if (isMatch) {
                    user.password = new_password;
                    return user.save((err, user) => {
                        if (!err)
                            return res.status(200).send(new messageResponse("Change password successfully"));
                        res.status(500).send(err.message)
                    });
                }
                res.status(402).send(new errResponse(402, "old password not match"));
            })
        }).catch(err => res.status(500).send(err.message));
}


/**
 * POST reset password
 */
function resetPassword(req, res, next) {
    const {email} = req.body;

    if (!email)
        return res.status(422).send(new errResponse(422, 'email is required'));

    User.findOne({email: email}, {profile: 0}).exec()
        .then(user => {
            if (!user)
                return res.status(402).send("username or email not match");
            user.password_reset_token = crypto.randomBytes(16).toString('hex');
            return user.save().then(user => mailService.sendMailResetPassword(user, user.password_reset_token, req.headers.host))
                .then(info => res.status(200).send(new messageResponse(`A password reset mail has been resent to ${user.email}`)))
        }).catch(err => res.status(500).send(err.message));
}

module.exports = {
    registerUser: registerUser,
    confirmationAccount: confirmationAccount,
    resendEmailVerify: resendEmailVerify,
    login: login,
    changePassword: changePassword,
    resetPassword: resetPassword
};