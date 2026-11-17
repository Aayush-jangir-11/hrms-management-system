const express = require('express');
const {
  loginUser,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  getPreferences,
  updatePreferences,
} = require('../controllers/auth');
const { protect } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/login', authLimiter, loginUser);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/preferences', protect, getPreferences);
router.put('/preferences', protect, updatePreferences);

module.exports = router;

