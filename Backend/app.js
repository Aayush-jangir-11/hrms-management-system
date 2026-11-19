const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const seedDb = require("./seed")

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const hrRoutes = require("./routes/hrRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const policyRoutes = require("./routes/policyRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const taskRoutes = require("./routes/taskRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const roleRoutes = require("./routes/roleRoutes");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

dotenv.config();
const app = express();

// HTTP Security Headers (Protection against XSS, Clickjacking, MIME Sniffing, etc.)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }),
);

const allowedOrigins = [
  "https://hrms-management-system-six.vercel.app",
  "http://localhost:5173",
  process.env.CLIENT_URL,
]
  .filter(Boolean)
  .map((url) => url.replace(/\/+$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, "");
      if (
        allowedOrigins.includes(cleanOrigin) ||
        /\.vercel\.app$/.test(cleanOrigin) ||
        /^http:\/\/localhost:\d+$/.test(cleanOrigin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  }),
);

app.use(express.json({ limit: "15mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "15mb" }));

// Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HRMS Backend API is running successfully 🚀",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/hr/reports", reportRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/roles", roleRoutes);

// 404 & Global Error Handling Middlewares (Must be defined after all routes)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
const startServer = async () => {
  try {
    await connectDB();
    await seedDb()
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
