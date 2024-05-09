const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: options.user.email,
        subject: options.subject,
        html: `
            <p>Forgot your password? Click <a href="http://localhost:3000/resetPassword/${options.resetToken}" > here</a> to reset your password.</p>
            <p>If you didn't forget your password, please ignore this email.</p>
            <p>${options.resetToken}</p>
        `
    };

    await transport.sendMail(mailOptions);
};

module.exports = sendEmail;