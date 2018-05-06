const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {type: String, require: true, unique: true, min: 6, max: 30},
    password: {type: String, require: true},
    email: {type: String, require: true, unique: true, min: 6, max: 30},
    roles: [String],
    created_at: {type: Date, default: Date.now()},
    updated_at: {type: Date, default: Date.now()},
    banned: Boolean,
    banned_by: {type: Schema.Types.ObjectId, ref: 'UserSchema'},
    profile: {
        name: {type: String, min: 6, max: 30},
        birthday: Date,
        age: {type: Number, min: 1}
    },
    is_verified: {type: Boolean, default: false},
    verify_token: String,
    verify_token_expires: Date,
    refresh_token: String,
    refresh_token_expires: Date,
    password_reset_token: String,
    password_reset_token_expires: Date
});

UserSchema.pre('save', function (next) {
    const user = this;
    let now = new Date();
    user.updated_at = now;
    user.created_at = this.created_at || now;


    if (user.isModified('password_reset_token')) {
        user.password_reset_expires = new Date(now.getTime() + 10 * 60 * 1000);//10 minutes
    }

    if (user.isModified('refresh_token')) {
        user.refresh_token_expires = new Date(now.getTime() + 6 * 60 * 60 * 1000);//6 hours
    }

    if (user.isModified('verify_token')) {
        user.verify_token_expires = new Date(now.getTime() + 10 * 60 * 1000);//10 minutes
    }

    if (!user.isModified('password')) return next();


    return bcrypt.genSalt(10, (err, salt) => {
        if (err)
            return next(err);
        bcrypt.hash(user.password, salt, function (error, hashed) {
            console.log(user.password);
            console.log(hashed);
            if (error) return next(error);
            user.password = hashed;
            next();
        })
    })
});

UserSchema.methods.comparePassword = function (rawPass) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(rawPass, this.password, ((err, same) => {
            if (err)
                return reject(err);
            return resolve(same);
        }))
    });
};

UserSchema.methods.hasRole = function (role) {
    return _.includes(this.roles, role);
};

module.exports = mongoose.model('User', UserSchema);