const CalendarEvent = require("../models/CalendarEvent");

/**
 * GET /api/calendar
 * Query Parameters:
 *  - portalType: "admin" | "hr" | "employee"
 *  - month: "YYYY-MM" (e.g. "2026-09")
 *  - year: "YYYY"
 *  - category: "Meeting" | "Task" | "Reminder" | "Holiday" | "Shift Note"
 *  - search: string
 *  - date: "YYYY-MM-DD"
 */
const getCalendarEvents = async (req, res) => {
  try {
    const { portalType, month, year, category, search, date } = req.query;

    const query = {};

    if (portalType === "employee") {
      // Employees see their own created events OR any HR/Admin created Company Holidays
      query.$or = [
        { createdBy: req.user._id },
        { category: "Holiday" },
        { portalType: "employee", createdBy: req.user._id },
      ];
    } else if (portalType) {
      query.portalType = portalType;
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (date) {
      query.$or = [{ date: date }, { isRecurring: true }];
    } else if (month) {
      let monthPrefix = month;
      if (!/^\d{4}-\d{2}$/.test(month) && year && /^\d{1,2}$/.test(month)) {
        monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
      }
      if (/^\d{4}-\d{2}$/.test(monthPrefix)) {
        query.$or = [
          { date: { $regex: `^${monthPrefix}` } },
          { isRecurring: true },
          { rrule: { $ne: null } },
        ];
      }
    } else if (year) {
      query.$or = [
        { date: { $regex: `^${year}` } },
        { isRecurring: true },
        { rrule: { $ne: null } },
      ];
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      query.title = searchRegex;
    }

    const events = await CalendarEvent.find(query)
      .populate("createdBy", "name email role department")
      .sort({ date: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("Error in getCalendarEvents:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching calendar events",
      error: error.message,
    });
  }
};


// POST /api/calendar
// Body: { title, date, time, category, priority, note, portalType, rrule, isRecurring }

const createCalendarEvent = async (req, res) => {
  try {
    const { title, date, time, category, priority, note, portalType, rrule, isRecurring } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Event title is required.",
      });
    }

    const validPortalTypes = ["admin", "hr", "employee"];
    const targetPortal = validPortalTypes.includes(portalType) ? portalType : "employee";

    const validCategories = ["Meeting", "Task", "Reminder", "Holiday", "Shift Note"];
    const eventCategory = validCategories.includes(category) ? category : "Task";

    const validPriorities = ["Low", "Medium", "High", "Urgent"];
    const eventPriority = validPriorities.includes(priority) ? priority : "Medium";

    const hasRrule = Boolean(rrule && typeof rrule === "string" && rrule.trim());
    const rruleString = hasRrule ? rrule.trim() : null;
    const recurringFlag = Boolean(isRecurring || hasRrule);

    const now = new Date();
    const padNum = (n) => String(n).padStart(2, "0");
    const todayStr = `${now.getFullYear()}-${padNum(now.getMonth() + 1)}-${padNum(now.getDate())}`;

    // Restrict creating events for past dates
    if (date && date < todayStr) {
      return res.status(400).json({
        success: false,
        message: "Cannot schedule events for past dates.",
      });
    }

    // Handle bulk creation if dates array is passed
    if (Array.isArray(req.body.dates) && req.body.dates.length > 0) {
      if (req.body.dates.some((d) => d < todayStr)) {
        return res.status(400).json({
          success: false,
          message: "Cannot schedule events for past dates.",
        });
      }

      const eventsToCreate = req.body.dates.map((d) => ({
        title: title.trim(),
        date: d,
        time: time ? time.trim() : "All Day",
        category: eventCategory,
        priority: eventPriority,
        completed: false,
        note: note ? note.trim() : "",
        portalType: targetPortal,
        rrule: rruleString,
        isRecurring: recurringFlag,
        createdBy: req.user ? req.user._id : null,
      }));

      const createdEvents = await CalendarEvent.insertMany(eventsToCreate);
      return res.status(201).json({
        success: true,
        message: `${createdEvents.length} calendar events created successfully.`,
        data: createdEvents,
      });
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Valid date in YYYY-MM-DD format is required.",
      });
    }

    const newEvent = await CalendarEvent.create({
      title: title.trim(),
      date,
      time: time ? time.trim() : "All Day",
      category: eventCategory,
      priority: eventPriority,
      completed: false,
      note: note ? note.trim() : "",
      portalType: targetPortal,
      rrule: rruleString,
      isRecurring: recurringFlag,
      createdBy: req.user ? req.user._id : null,
    });

    return res.status(201).json({
      success: true,
      message: "Calendar event created successfully.",
      data: newEvent,
    });
  } catch (error) {
    console.error("Error in createCalendarEvent:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating calendar event",
      error: error.message,
    });
  }
};

// PUT /api/calendar/:id
// Body: { title, date, time, category, priority, note, completed }
const updateCalendarEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, time, category, priority, note, completed } = req.body;

    const event = await CalendarEvent.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found.",
      });
    }

    if (title !== undefined) event.title = title.trim();
    if (date !== undefined) event.date = date;
    if (time !== undefined) event.time = time.trim();
    if (category !== undefined) event.category = category;
    if (priority !== undefined) event.priority = priority;
    if (note !== undefined) event.note = note.trim();
    if (completed !== undefined) event.completed = Boolean(completed);

    await event.save();

    return res.status(200).json({
      success: true,
      message: "Calendar event updated successfully.",
      data: event,
    });
  } catch (error) {
    console.error("Error in updateCalendarEvent:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating calendar event",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/calendar/:id/toggle (or PUT /api/calendar/:id/toggle)
 */
const toggleCalendarEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await CalendarEvent.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found.",
      });
    }

    event.completed = !event.completed;
    await event.save();

    return res.status(200).json({
      success: true,
      message: `Event marked as ${event.completed ? "completed" : "incomplete"}.`,
      data: event,
    });
  } catch (error) {
    console.error("Error in toggleCalendarEvent:", error);
    return res.status(500).json({
      success: false,
      message: "Server error toggling event status",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/calendar/:id
 */
const deleteCalendarEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await CalendarEvent.findByIdAndDelete(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Calendar event deleted successfully.",
      data: { id },
    });
  } catch (error) {
    console.error("Error in deleteCalendarEvent:", error);
    return res.status(500).json({
      success: false,
      message: "Server error deleting calendar event",
      error: error.message,
    });
  }
};

module.exports = {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  toggleCalendarEvent,
  deleteCalendarEvent,
};
