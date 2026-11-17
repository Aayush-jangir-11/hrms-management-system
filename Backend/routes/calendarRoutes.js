const express = require("express");
const router = express.Router();
const {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  toggleCalendarEvent,
  deleteCalendarEvent,
} = require("../controllers/calendarController");
const { protect } = require("../middlewares/authMiddleware");

// All calendar routes require authentication
router.use(protect);

router.get("/", getCalendarEvents);
router.post("/", createCalendarEvent);
router.put("/:id", updateCalendarEvent);
router.put("/:id/toggle", toggleCalendarEvent);
router.patch("/:id/toggle", toggleCalendarEvent);
router.delete("/:id", deleteCalendarEvent);

module.exports = router;
