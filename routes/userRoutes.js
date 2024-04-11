const express = require('express');
const userController = require('../controllers/userController')
const authController = require('../controllers/authController');
const router = express.Router()
router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.get('/logout', authController.logout)
router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)

router.use(authController.protect)

router.patch('/updatePassword/:id',authController.updatePassword)
router.get('/me',userController.getMe , userController.getUser)
router.patch('/updateMe',userController.updateMe)
router.delete('/deleteMe',userController.deleteMe)

router.use(authController.restrictTo('admin'))
router.route('/').get(userController.getAllusers)
router.route('/:id')
.delete(userController.deleteUser)
.patch(userController.updateUser)
.get(userController.getUser)
module.exports = router