const nodemailer = require('nodemailer')
const sendEmail = async options => {
    //1) create transport
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    })
    //2) Define the email options
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: `<p>${options.message}</p>`
    }
    //3) Send the email
    await transport.sendMail(mailOptions)
}

module.exports = sendEmail 