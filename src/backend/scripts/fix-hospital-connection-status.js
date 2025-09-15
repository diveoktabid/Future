const mysql = require("mysql2/promise");
require("dotenv").config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bartech_iot_db",
  charset: "utf8mb4",
};

async function fixHospitalConnectionStatus() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Database connected successfully");

    // First, let's check the current status of hospital ID 5
    console.log("📋 Checking current status of hospital ID 5...");
    const [currentStatus] = await connection.execute(
      "SELECT hospital_id, hospital_name, connection_status FROM hospital WHERE hospital_id = ?",
      [5]
    );
    
    if (currentStatus.length === 0) {
      console.log("❌ Hospital with ID 5 not found");
      return;
    }

    console.log("Current status:", currentStatus[0]);

    // Update the connection status to 'Connected'
    console.log("🔄 Updating connection status to 'Connected'...");
    const [updateResult] = await connection.execute(
      "UPDATE hospital SET connection_status = ? WHERE hospital_id = ?",
      ["Connected", 5]
    );

    if (updateResult.affectedRows > 0) {
      console.log("✅ Successfully updated connection status for hospital ID 5");
      
      // Verify the update
      const [verifyResult] = await connection.execute(
        "SELECT hospital_id, hospital_name, connection_status FROM hospital WHERE hospital_id = ?",
        [5]
      );
      
      console.log("Updated status:", verifyResult[0]);
    } else {
      console.log("❌ No rows were updated");
    }

  } catch (error) {
    console.error("❌ Error updating hospital connection status:", error);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

// Run the script
if (require.main === module) {
  fixHospitalConnectionStatus().then(() => {
    console.log("🎉 Script execution completed");
    process.exit(0);
  }).catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
}

module.exports = { fixHospitalConnectionStatus };