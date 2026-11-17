const {
  loginUser,
  getMe,
  updateProfile,
  getPreferences,
  updatePreferences,
} = require("./authController");
const { forgotPassword, resetPassword, changePassword } = require("./passwordController");

module.exports = {
  loginUser,
  getMe,
  updateProfile,
  getPreferences,
  updatePreferences,
  forgotPassword,
  resetPassword,
  changePassword,
};

