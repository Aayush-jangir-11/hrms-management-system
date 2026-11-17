const Notification = require("../models/Notification");
const { getPagination, formatPagination } = require("../utils/paginate");

// Get notifications for logged-in user
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { isPaginated, page, limit, skip } = getPagination(req.query, 30);

    const [totalRecords, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments({ recipient: userId }),
      Notification.countDocuments({ recipient: userId, isRead: false }),
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(isPaginated ? skip : 0)
        .limit(limit)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications,
      pagination: formatPagination({
        totalRecords,
        page,
        limit,
        isPaginated,
      }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark single notification as read
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete single notification
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    await Notification.findOneAndDelete({ _id: id, recipient: userId });

    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Clear all notifications
const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    await Notification.deleteMany({ recipient: userId });

    res.status(200).json({ success: true, message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
};
