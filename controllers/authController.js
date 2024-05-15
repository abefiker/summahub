const crypto = require('crypto');
const { promisify } = require('util');
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const jwt = require('jsonwebtoken')
const sendEmail = require('../utils/email')
const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    }
    if (process.env.NODE_ENV === 'production') { cookieOptions.secure = true }
    res.cookie('jwt', token, cookieOptions)
    user.password = undefined
    res.status(statusCode).json({
        status: 'Success',
        token,
        data: user
    })
}
exports.logout = (req, res) => {
    res.cookie('jwt', 'logout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    })
    res.status(200).json({
        status: 'Success',
        message: 'Logged out'
    })
}
exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role
    })
    createSendToken(newUser, 201, res)
})
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body
    if (!email || !password) {
        return next(new AppError('please provide a email and password', 400))
    }
    const user = await User.findOne({ email: email }).select('+password')
    console.log(user)
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401))
    }
    createSendToken(user, 200, res)
})
exports.protect = catchAsync(async (req, res, next) => {
    //protecting existing route
    let token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt
    }
    if (!token) {
        return next(new AppError('Your not loged in! , please log in to get access', 401))
    }
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    // console.log(decoded)
    const currentUser = await User.findOne({ _id: decoded.id });
    if (!currentUser) {
        return next(new AppError('the user belongs to this token does no longer exists', 401))
    }
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('Your password has expired, please change it, please current', 401))
    }
    req.user = currentUser
    next()
})
//only for rendering pages , no errors!
exports.isLoggedIn = async (req, res, next) => {
    try {
        // Protecting existing route
        if (req.cookies.jwt) {
            // Verify token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            // Check if a user still exists
            const currentUser = await User.findOne({ _id: decoded.id });
            if (!currentUser) {
                return next();
            }
            // Check if user changed password after the token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }
            // There is a logged-in user
            res.locals.user = currentUser;
            return next();
        }
    } catch (err) {
        return next();
    }
    next();
};
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            next(new AppError('You have not permissions to perform this action', 403))
        }
        next()
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email })
    console.log(user, 'Forgot Password function');
    if (!user) {
        next(new AppError('user not found with this email', 404))
    }
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm 
    to: ${resetURL}.\nIf you didn't forget your password, please ignore this email`
    try {
        await sendEmail({
            user,
            subject: 'your password reset token valid for 10 min',
            message,
            resetToken
        })
        res.status(200).json({
            status: 'Success',
            message: 'Token sent to email'
        })
    } catch (error) {
        user.passwordResetTokend = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false })
        return next(new AppError('There was an error sending the email. Please try again', 500))
    }

})


exports.resetPassword = catchAsync(async (req, res, next) => {
    //1) get user based on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } })
    //2)if token not expires then there is a user, set the new password
    if (!user) {
        return next(new AppError('Token is Expired', 400))
    }
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm

    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()
    //3)change the chengedPasswordAt property for the user

    //4)log the user in and send JWT
    createSendToken(user, 200, res)
})
exports.updatePassword = catchAsync(async (req, res, next) => {
    //1)Get a user from the collection
    const user = await User.findOne({ _id: req.params.id }).select('+password')
    //2)check if posted current password is correct
    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
        return next(new AppError('Current password is incorrect', 401))
    }
    //3)if so , update the password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    //4)log user i and send JWT
    await user.save()
    createSendToken(user, 200, res)
})