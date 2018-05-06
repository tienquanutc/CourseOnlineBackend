const nodemalier = require('nodemailer');
const config = require('../../config/config');

let email_smtp = {
    host: "smtp.gmail.com",
    auth: {
        user: config.mail.user,
        pass: config.mail.pass
    }
};
let transporter = nodemalier.createTransport(email_smtp);

let sendMailVerification = function (user, token, host) {
    let mailOptions = {
        from: 'abcxyz@gmail.com',
        to: user.email,
        subject: 'Account Verification Token',
        text: `Hello ${user.username},\nPlease verify your account by clicking the link: \nhttp://${host}/api/account/confirmation/${token}`
    };
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) return reject(err);
            return resolve(info)
        })
    });
};

let sendMailResetPassword = function (user, token, host) {
    let mailOptions = {
        from: 'abcxyz@gmail.com',
        to: user.email,
        subject: 'Account Reset Token',
        text: `Hello ${user.username},\nReset your password by clicking the link: \nhttp://${host}/api/account/reset/${token}`
    };
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) return reject(err);
            return resolve(info)
        })
    });
};


module.exports = {
    sendMailVerification: sendMailVerification,
    sendMailResetPassword: sendMailResetPassword
};