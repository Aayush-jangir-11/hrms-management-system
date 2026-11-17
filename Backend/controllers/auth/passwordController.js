const Employee = require('../../models/Employee');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const sendEmail = require('../../utils/sendEmail');

// Forgot Password - Send reset link
// POST /api/auth/forgot-password
// Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const employee = await Employee.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
    });

    if (!employee) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
    }

    // Generate unhashed random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token to save in MongoDB
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Token expires in 15 minutes
    const tokenExpire = new Date(Date.now() + 15 * 60 * 1000);

    await Employee.findByIdAndUpdate(employee._id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: tokenExpire,
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e293b; margin-bottom: 16px;">Reset Your Password</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">Hi <strong>${employee.name}</strong>,</p>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">You requested to reset your HRMS portal password. Click the button below to proceed:</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This link is valid for <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">HRMS Authentication System</p>
      </div>
    `;

    await sendEmail({
      to: employee.email,
      subject: 'HRMS Password Reset Request',
      html: htmlMessage,
    });

    return res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('[Auth Controller] Error during forgotPassword:', error);
    res.status(500).json({ success: false, message: 'Server error processing request' });
  }
};

// Reset Password - Verify token and update password
// POST /api/auth/reset-password/:token
// Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Hash parameter token to match stored DB hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const employee = await Employee.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset link.',
      });
    }

    // Hash new password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save updated password and clear reset token fields
    employee.password = hashedPassword;
    employee.resetPasswordToken = undefined;
    employee.resetPasswordExpire = undefined;
    await employee.save();

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully! You can now log in.',
    });
  } catch (error) {
    console.error('[Auth Controller] Error during resetPassword:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Change Password - Currently logged in employee or admin
// PUT /api/auth/change-password
// Private
const changePassword = async (req, res) => {
  try {
    const employeeId = req.user?._id || req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current password and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least one uppercase letter (A-Z).',
      });
    }

    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least one lowercase letter (a-z).',
      });
    }

    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least one number (0-9).',
      });
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least one special character (e.g. !@#$%^&*).',
      });
    }

    // Retrieve employee with password select
    const employee = await Employee.findById(employeeId).select('+password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found.',
      });
    }

    // Check current password match
    let isMatch = false;
    const storedPassword = employee.password || '';
    if (
      storedPassword.startsWith('$2a$') ||
      storedPassword.startsWith('$2b$') ||
      storedPassword.startsWith('$2y$')
    ) {
      isMatch = await bcrypt.compare(currentPassword, storedPassword);
    } else {
      isMatch = currentPassword === storedPassword;
    }

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as your current password.',
      });
    }

    // Hash new password using bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    employee.password = hashedPassword;
    await employee.save();

    console.log(`[Auth Controller] Password changed successfully for user: ${employee.email}`);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully!',
    });
  } catch (error) {
    console.error('[Auth Controller] Error during changePassword:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
  changePassword,
};
