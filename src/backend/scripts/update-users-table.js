const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bartech_iot_db",
};

async function addPhoneNumberColumn() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log("🔄 Checking and updating users table structure...");

    // Check if phone_number column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
      AND TABLE_SCHEMA = '${process.env.DB_NAME || "bartech_iot_db"}' 
      AND COLUMN_NAME = 'phone_number'
    `);

    if (columns.length === 0) {
      console.log("📱 Adding phone_number column to users table...");
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN phone_number VARCHAR(20) NULL AFTER full_name
      `);

      // Add index for phone_number
      await connection.execute(`
        ALTER TABLE users 
        ADD INDEX idx_phone (phone_number)
      `);

      console.log("✅ phone_number column added successfully");
    } else {
      console.log("✅ phone_number column already exists");
    }

    // Check if 'user' role exists in ENUM
    const [roleCheck] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
      AND TABLE_SCHEMA = '${process.env.DB_NAME || "bartech_iot_db"}' 
      AND COLUMN_NAME = 'role'
    `);

    if (roleCheck.length > 0) {
      const columnType = roleCheck[0].COLUMN_TYPE;
      if (!columnType.includes("'user'")) {
        console.log("👤 Adding 'user' role to ENUM...");
        await connection.execute(`
          ALTER TABLE users 
          MODIFY COLUMN role ENUM('admin', 'technician', 'user', 'viewer') DEFAULT 'user'
        `);
        console.log("✅ 'user' role added to ENUM");
      } else {
        console.log("✅ 'user' role already exists in ENUM");
      }
    }
  } catch (error) {
    console.error("❌ Error updating database structure:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

async function main() {
  try {
    await addPhoneNumberColumn();
    console.log("🎉 Database structure updated successfully!");
  } catch (error) {
    console.error("💥 Migration failed:", error.message);
    process.exit(1);
  }
}

main();
