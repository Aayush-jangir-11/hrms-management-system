const Task = require("../models/Task");
const Employee = require("../models/Employee");
const createNotification = require("../utils/createNotification");
const { getPagination, formatPagination } = require("../utils/paginate");

// Helper: Normalize date to midnight (00:00:00.000)
const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper: End of day (23:59:59.999)
const getEndOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

// Create a new task (HR / Admin assigns task to employee)
// POST /api/tasks
// Private (HR, Admin)
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, taskDate, dueDate, priority, status, startTime, endTime, isHourly } = req.body;
    const assignedBy = req.user._id;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required.",
      });
    }

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Please select an employee to assign the task.",
      });
    }

    const employeeExists = await Employee.findById(assignedTo);
    if (!employeeExists) {
      return res.status(404).json({
        success: false,
        message: "Assigned employee not found.",
      });
    }

    const todayStart = getStartOfDay(new Date());
    const parsedTaskDate = taskDate ? getStartOfDay(new Date(taskDate)) : todayStart;
    if (parsedTaskDate < todayStart) {
      return res.status(400).json({
        success: false,
        message: "Schedule date cannot be in the past. Please select today or a future date.",
      });
    }

    const parsedDueDate = dueDate ? getStartOfDay(new Date(dueDate)) : null;
    if (parsedDueDate && parsedDueDate < parsedTaskDate) {
      return res.status(400).json({
        success: false,
        message: "Due date cannot be before schedule date.",
      });
    }

    const validPriorities = ["Low", "Medium", "High", "Urgent"];
    const taskPriority = validPriorities.includes(priority) ? priority : "Medium";

    const validStatuses = ["Pending", "In Progress", "Completed"];
    const taskStatus = validStatuses.includes(status) ? status : "Pending";

    const newTask = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      assignedTo,
      assignedBy,
      taskDate: parsedTaskDate,
      dueDate: parsedDueDate,
      priority: taskPriority,
      status: taskStatus,
      startTime: startTime || "",
      endTime: endTime || "",
      isHourly: Boolean(isHourly),
    });

    const populatedTask = await Task.findById(newTask._id)
      .populate("assignedTo", "name email department position")
      .populate("assignedBy", "name email");

    // Trigger Notification for assigned Employee
    try {
      await createNotification({
        recipient: assignedTo,
        sender: assignedBy,
        type: "task",
        title: "New Task Assigned",
        message: `You have been assigned a new task: "${title.trim()}".`,
        link: "/employee/dashboard",
      });
    } catch (notifErr) {
      console.error("[Task Controller] Notification trigger error:", notifErr);
    }

    return res.status(201).json({
      success: true,
      message: "Task successfully assigned to employee.",
      data: populatedTask,
    });
  } catch (error) {
    console.error("[Task Controller] Error creating task:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create task.",
    });
  }
};

// Get today's tasks for logged-in employee
// GET /api/tasks/today
// Private (Employee, HR, Admin)

const getTodayTasks = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const todayStart = getStartOfDay(new Date());
    const todayEnd = getEndOfDay(new Date());

    // Fetch tasks scheduled for today, due today, or currently pending/in progress
    const tasks = await Task.find({
      assignedTo: employeeId,
      $or: [
        { taskDate: { $gte: todayStart, $lte: todayEnd } },
        { dueDate: { $gte: todayStart, $lte: todayEnd } },
        { status: "Pending" },
        { status: "In Progress" },
      ],
    })
      .populate("assignedBy", "name email")
      .sort({ status: 1, priority: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("[Task Controller] Error fetching today's tasks:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch today's tasks.",
    });
  }
};

// Toggle task status (Complete <-> Pending)
// PUT /api/tasks/:id/toggle
// Private (Employee, HR, Admin)

const toggleTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    // Toggle status between Completed and Pending
    const isNowCompleted = task.status !== "Completed";
    task.status = isNowCompleted ? "Completed" : "Pending";

    await task.save();

    return res.status(200).json({
      success: true,
      message: `Task marked as ${task.status}`,
      data: task,
    });
  } catch (error) {
    console.error("[Task Controller] Error toggling task status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update task.",
    });
  }
};

// Get all tasks (HR / Admin view)
// GET /api/tasks/all
// Private (HR, Admin)

const getAllTasks = async (req, res) => {
  try {
    const { employeeId, status, priority, date } = req.query;
    const { isPaginated, page, limit, skip } = getPagination(req.query);

    const filter = {};
    if (employeeId) filter.assignedTo = employeeId;
    if (status && status !== "All") filter.status = status;
    if (priority && priority !== "All") filter.priority = priority;
    if (date) {
      const dateStart = getStartOfDay(new Date(date));
      const dateEnd = getEndOfDay(new Date(date));
      filter.$or = [
        { taskDate: { $gte: dateStart, $lte: dateEnd } },
        { dueDate: { $gte: dateStart, $lte: dateEnd } },
      ];
    }

    const totalRecords = await Task.countDocuments(filter);

    let query = Task.find(filter)
      .populate("assignedTo", "name email department position")
      .populate("assignedBy", "name email")
      .sort({ taskDate: -1, createdAt: -1 });

    if (isPaginated) {
      query = query.skip(skip).limit(limit);
    }

    const tasks = await query;

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
      pagination: formatPagination({
        totalRecords,
        page,
        limit,
        isPaginated,
      }),
    });
  } catch (error) {
    console.error("[Task Controller] Error fetching all tasks:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tasks.",
    });
  }
};

// Update task details (HR / Admin)
// PUT /api/tasks/:id
// Private (HR, Admin)

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, taskDate, dueDate, priority, status, startTime, endTime, isHourly } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (assignedTo) task.assignedTo = assignedTo;
    if (taskDate) {
      const parsedTaskDate = getStartOfDay(new Date(taskDate));
      const todayStart = getStartOfDay(new Date());
      if (parsedTaskDate < todayStart) {
        return res.status(400).json({
          success: false,
          message: "Schedule date cannot be in the past. Please select today or a future date.",
        });
      }
      task.taskDate = parsedTaskDate;
    }
    if (dueDate !== undefined) {
      const parsedDueDate = dueDate ? getStartOfDay(new Date(dueDate)) : null;
      const effectiveTaskDate = task.taskDate || getStartOfDay(new Date());
      if (parsedDueDate && parsedDueDate < effectiveTaskDate) {
        return res.status(400).json({
          success: false,
          message: "Due date cannot be before schedule date.",
        });
      }
      task.dueDate = parsedDueDate;
    }
    if (priority) {
      const validPriorities = ["Low", "Medium", "High", "Urgent"];
      if (validPriorities.includes(priority)) task.priority = priority;
    }
    if (status) {
      const validStatuses = ["Pending", "In Progress", "Completed"];
      if (validStatuses.includes(status)) task.status = status;
    }
    if (startTime !== undefined) task.startTime = startTime;
    if (endTime !== undefined) task.endTime = endTime;
    if (isHourly !== undefined) task.isHourly = Boolean(isHourly);

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email department position")
      .populate("assignedBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      data: updatedTask,
    });
  } catch (error) {
    console.error("[Task Controller] Error updating task:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update task.",
    });
  }
};

// Delete a task (HR / Admin)
// DELETE /api/tasks/:id
// Private (HR, Admin)

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task successfully deleted.",
    });
  } catch (error) {
    console.error("[Task Controller] Error deleting task:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete task.",
    });
  }
};

module.exports = {
  createTask,
  getTodayTasks,
  toggleTaskStatus,
  getAllTasks,
  updateTask,
  deleteTask,
};
