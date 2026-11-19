const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const Employee = require("./models/Employee");
const connectDB = require("./config/db");

dotenv.config();

const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    console.log("[SEEDER] Checking Admin employee in MongoDB...");

    // Seed Admin User Directly into Employee Schema
    const adminEmail = "admin@fuelit.online";
    let adminEmployee = await Employee.findOne({ email: adminEmail });

    if (!adminEmployee) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      adminEmployee = await Employee.create({
        employeeId: "ADM001",
        name: "Admin User",
        email: adminEmail,
        password: hashedPassword,
        role: "Admin",
        department: "Management",
        position: "System Administrator",
        status: "Active",
        joinDate: new Date(),
      });
      console.log("[SEEDER] Created Admin Employee:", adminEmail, "password: admin123");
    } else {
      console.log("ℹ[SEEDER] Admin Employee already exists in MongoDB:", adminEmail);
    }

    console.log("[SEEDER] Admin database seeding completed successfully!");
  } catch (error) {
    console.error("[SEEDER ERROR]:", error);
  }
};

if (require.main === module) {
  seedDatabase().then(() => mongoose.connection.close());
}

module.exports = seedDatabase;
