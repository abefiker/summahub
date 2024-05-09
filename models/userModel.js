const crypto = require('crypto');
const mongoose = require('mongoose')
const validator = require('validator')
const bycrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: [true, 'Please enter a first name']
    },
    lastname: {
        type: String,
        required: [true, 'Please enter a last name']
    },
    email: {
        type: String,
        required: [true, 'Please provide your emai'],
        unique: true,
        lowercase: true,
        validate: {
            validator: function (email) {
                return validator.isEmail(email);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    photo: String,
    role: {
        type: String,
        enum: ['user','admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a valid password'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function (passwordConfirm) {
                return passwordConfirm === this.password;
            },
            message: props => `${props.value} is not the same as password!`
        }
    },
    passwordChangeAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
})

userSchema.pre('save', async function (next) {
    // Only run if password was modified
    if (!this.isModified('password')) {return next();}

    // Hash password with cost of 12
    this.password = await  bycrypt.hash(this.password, 12);
    this.passwordConfirm = undefined; // Remove confirmed password
    console.log('hello from hashing middleware')
    next(); // Ensure middleware chain continues
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || this.isNew) {return next();}

    this.passwordChangeAt = Date.now() - 1000;
    console.log('password change middleware');
    next(); // Ensure middleware chain continues
});
userSchema.pre(/^find/, async function (next) {
    this.find({ active: { $ne: false } })
    console.log('hello from active user checker middleware')
    next()
})
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bycrypt.compare(candidatePassword, userPassword);
}
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.changedPasswordAt) {
        const changedTimestamp = parseInt(this.changedPasswordAt.getTime() / 1000, 10)
        return JWTTimestamp < changedTimestamp
    }
    return false
}
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex')
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000

    return resetToken
}
const User = mongoose.model('User', userSchema);
module.exports = User