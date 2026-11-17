const Employee = require('../../models/Employee');
const Role = require('../../models/Role');
const bcrypt = require('bcrypt');
const generateToken = require('../../utils/generateToken');
const { getSidebarMenu } = require('../../config/navigationConfig');

// Authenticate user & get token
// POST /api/auth/login
// Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("[Auth Controller] Login attempt:", email);

    if (!email || !password) {
      console.warn("[Auth Controller] Missing email or password");
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    let normalizedEmail = email.trim().toLowerCase();

    // Find employee profile (case-insensitive email lookup)
    const employee = await Employee.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
    }).select('+password');

    if (!employee) {
      console.warn(`[Auth Controller] Employee profile not found: ${normalizedEmail}`);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check account status
    if (employee.status && employee.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: `Your account is ${employee.status}. Please contact administrator.`,
      });
    }

    // Check password (supports bcrypt hash & plain text with auto-upgrade)
    let isMatch = false;
    const storedPassword = employee.password || "";
    if (
      storedPassword.startsWith("$2a$") ||
      storedPassword.startsWith("$2b$") ||
      storedPassword.startsWith("$2y$")
    ) {
      isMatch = await bcrypt.compare(password, storedPassword);
    } else {
      isMatch = password === storedPassword;
      if (isMatch) {
        // Automatically upgrade plaintext to bcrypt hash in database
        const newHashed = await bcrypt.hash(password, 10);
        await Employee.findByIdAndUpdate(employee._id, { password: newHashed });
      }
    }

    if (!isMatch) {
      console.warn(`[Auth Controller] Password mismatch for: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Update last login timestamp safely
    await Employee.findByIdAndUpdate(employee._id, { lastLogin: new Date() });

    // Generate JWT token from Employee ID
    const token = generateToken(employee._id);

    // Fetch dynamic role permissions
    let permissions = [];
    if (employee.role?.toLowerCase() === "admin") {
      permissions = "ALL";
    } else {
      const roleDoc = await Role.findOne({
        name: { $regex: new RegExp(`^${employee.role}$`, 'i') },
      });
      permissions = roleDoc?.permissions || [];
    }

    const sidebarMenu = getSidebarMenu(employee.role, permissions);

    console.log(`[Auth Controller] Login successful: ${employee.email} (${employee.role})`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: employee._id,
        userName: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        position: employee.position,
        status: employee.status,
        avatar: employee.avatar || '',
        permissions,
        sidebarMenu,
        notificationPreferences: employee.notificationPreferences,
        token,
        employee,
      },
    });
  } catch (error) {
    console.error("[Auth Controller] Error during login:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// currently logged-in user profile
// GET /api/auth/me
// Private
const getMe = async (req, res) => {
  try {
    const employeeId = req.user?._id || req.user?.id;
    const employee = await Employee.findById(employeeId).select('-password');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    const employeeData = employee.toObject();
    delete employeeData.password;

    // Fetch dynamic role permissions
    let permissions = [];
    if (employee.role?.toLowerCase() === "admin") {
      permissions = "ALL";
    } else {
      const roleDoc = await Role.findOne({
        name: { $regex: new RegExp(`^${employee.role}$`, 'i') },
      });
      permissions = roleDoc?.permissions || [];
    }

    const sidebarMenu = getSidebarMenu(employee.role, permissions);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          _id: employee._id,
          employeeId: employee.employeeId,
          userName: employee.name,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          department: employee.department,
          position: employee.position,
          phone: employee.phone,
          status: employee.status,
          joinDate: employee.joinDate,
          address: employee.address,
          emergencyContact: employee.emergencyContact,
          assignedHr: employee.assignedHr,
          avatar: employee.avatar || '',
          permissions,
          sidebarMenu,
          notificationPreferences: employee.notificationPreferences,
        },
        employee: employeeData,
      },
    });
  } catch (error) {
    console.error("[Auth Controller] Error during getMe:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update logged-in employee profile
// PUT /api/auth/update-profile
// Private
const updateProfile = async (req, res) => {
  try {
    const employeeId = req.user?._id || req.user?.id;
    const { name, phone, address, emergencyContact, avatar } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found' });
    }

    if (name !== undefined && name.trim()) employee.name = name.trim();
    if (phone !== undefined) employee.phone = phone.trim();
    if (address !== undefined) employee.address = address.trim();
    if (emergencyContact !== undefined) employee.emergencyContact = emergencyContact.trim();
    if (avatar !== undefined) employee.avatar = avatar;

    await employee.save();

    const employeeData = employee.toObject();
    delete employeeData.password;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: employeeData,
    });
  } catch (error) {
    console.error("[Auth Controller] Error during updateProfile:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get current user notification preferences
// GET /api/auth/preferences
// Private
const getPreferences = async (req, res) => {
  try {
    const employeeId = req.user?._id || req.user?.id;
    const employee = await Employee.findById(employeeId).select("notificationPreferences");
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile not found" });
    }

    return res.status(200).json({
      success: true,
      data: employee.notificationPreferences || {
        leaveUpdates: true,
        payslipReady: true,
        taskAssigned: true,
        attendanceReminder: true,
        emailAlerts: true,
      },
    });
  } catch (error) {
    console.error("[Auth Controller] Error during getPreferences:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update current user notification preferences
// PUT /api/auth/preferences
// Private
const updatePreferences = async (req, res) => {
  try {
    const employeeId = req.user?._id || req.user?.id;
    const { preferences } = req.body;

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { notificationPreferences: preferences },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully",
      data: employee.notificationPreferences,
    });
  } catch (error) {
    console.error("[Auth Controller] Error during updatePreferences:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  loginUser,
  getMe,
  updateProfile,
  getPreferences,
  updatePreferences,
};
