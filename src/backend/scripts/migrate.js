const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
};

async function createDatabase() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log("🗄️  Creating database...");
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS ${
        process.env.DB_NAME || "bartech_iot_db"
      } CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log("✅ Database created successfully");
  } catch (error) {
    console.error("❌ Error creating database:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

async function createTables() {
  const connection = await mysql.createConnection({
    ...dbConfig,
    database: process.env.DB_NAME || "bartech_iot_db",
  });

  try {
    console.log("📋 Creating tables...");

    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(20) NULL,
        role ENUM('admin', 'technician', 'user', 'viewer') DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_phone (phone_number),
        INDEX idx_role (role),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Refresh tokens table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_token (token),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Password reset tokens table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_id (user_id),
        INDEX idx_token (token),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Hospital table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS hospital (
        hospital_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'AUTO_INCREMENT',
        hospital_name VARCHAR(100) NOT NULL,
        installation_date DATE NOT NULL,
        installation_time TIME NOT NULL,
        iot_status ENUM('Nyala', 'Mati') NOT NULL DEFAULT 'Mati',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_hospital_name (hospital_name),
        INDEX idx_iot_status (iot_status),
        INDEX idx_is_active (is_active),
        INDEX idx_installation_date (installation_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    // Monitoring data table (data_IOT_Rs)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS monitoring_data (
        monitoring_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'AUTO_INCREMENT',
        hospital_id INT NOT NULL,
        temperature DECIMAL(4,1) DEFAULT NULL,
        humidity DECIMAL(4,1) NOT NULL,
        gas_status ENUM('Low', 'Medium', 'High') NOT NULL,
        status_lampu1 ENUM('ON', 'OFF') NOT NULL,
        status_viewer ENUM('ON', 'OFF') NOT NULL,
        status_writing_table ENUM('ON', 'OFF') NOT NULL,
        status_lampu2 ENUM('ON', 'OFF') NOT NULL,
        status_lampu_op ENUM('ON', 'OFF') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospital(hospital_id) ON DELETE CASCADE,
        INDEX idx_hospital_id (hospital_id),
        INDEX idx_temperature (temperature),
        INDEX idx_humidity (humidity),
        INDEX idx_gas_status (gas_status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    console.log("✅ All tables created successfully");
  } catch (error) {
    console.error("❌ Error creating tables:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

async function insertDefaultData() {
  const connection = await mysql.createConnection({
    ...dbConfig,
    database: process.env.DB_NAME || "bartech_iot_db",
  });

  try {
    console.log("👤 Creating default admin user...");

    // Check if admin user already exists
    const [existingUsers] = await connection.execute(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      ["admin", "admin@bartech.com"]
    );

    if (existingUsers.length === 0) {
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("admin123", 12);

      await connection.execute(
        `INSERT INTO users (username, email, password, full_name, phone_number, role, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          "admin", // username
          "admin@bartech.com", // email
          hashedPassword, // password
          "System Administrator", // full_name
          "08122508875", // phone_number
          "admin", // role
        ]
      );

      console.log("✅ Default admin user created");
      console.log("📧 Email: admin@bartech.com");
      console.log("🔑 Password: admin123");
      console.log("⚠️  Please change the default password after first login!");
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    console.log("🏥 Creating sample hospital data...");

    // Check if hospital data already exists
    const [existingHospitals] = await connection.execute(
      "SELECT COUNT(*) as count FROM hospital"
    );

    if (existingHospitals[0].count === 0) {
      const sampleHospitals = [
        ["RS Udinus Central", "2024-01-15", "08:30:00", "Nyala", 1],
        ["RS Bartech Medical Center", "2024-02-20", "10:00:00", "Nyala", 1],
        ["RS Smart Health", "2024-03-10", "14:15:00", "Mati", 1],
        ["RS Prima Husada", "2024-04-05", "09:45:00", "Nyala", 1],
        ["RS Siloam Hospitals", "2024-05-12", "11:20:00", "Nyala", 1],
        ["RS Hermina Group", "2024-06-18", "13:30:00", "Mati", 1],
      ];

      for (const hospital of sampleHospitals) {
        await connection.execute(
          "INSERT INTO hospital (hospital_name, installation_date, installation_time, iot_status, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
          hospital
        );
      }

      console.log("✅ Sample hospital data created");
    } else {
      console.log("ℹ️  Sample hospital data already exist");
    }

    console.log("📊 Creating sample monitoring data...");

    // Check if monitoring data already exists
    const [existingMonitoring] = await connection.execute(
      "SELECT COUNT(*) as count FROM monitoring_data"
    );

    if (existingMonitoring[0].count === 0) {
      // Get hospital IDs for sample data
      const [hospitals] = await connection.execute(
        "SELECT hospital_id FROM hospital ORDER BY hospital_id LIMIT 6"
      );

      if (hospitals.length > 0) {
        const sampleMonitoringData = [];

        // Data untuk RS Udinus Central
        if (hospitals[0]) {
          sampleMonitoringData.push([
            hospitals[0].hospital_id,
            23.5, // temperature
            65.2, // humidity
            "Low", // gas_status
            "ON", // status_lampu1
            "ON", // status_viewer
            "OFF", // status_writing_table
            "ON", // status_lampu2
            "OFF", // status_lampu_op
          ]);
        }

        // Data untuk RS Bartech Medical Center
        if (hospitals[1]) {
          sampleMonitoringData.push([
            hospitals[1].hospital_id,
            22.8, // temperature
            61.3, // humidity
            "Low", // gas_status
            "OFF", // status_lampu1
            "ON", // status_viewer
            "ON", // status_writing_table
            "OFF", // status_lampu2
            "ON", // status_lampu_op
          ]);
        }

        // Data untuk RS Smart Health
        if (hospitals[2]) {
          sampleMonitoringData.push([
            hospitals[2].hospital_id,
            25.2, // temperature
            72.1, // humidity
            "High", // gas_status
            "ON", // status_lampu1
            "ON", // status_viewer
            "ON", // status_writing_table
            "ON", // status_lampu2
            "OFF", // status_lampu_op
          ]);
        }

        // Data untuk RS Prima Husada
        if (hospitals[3]) {
          sampleMonitoringData.push([
            hospitals[3].hospital_id,
            24.7, // temperature
            68.9, // humidity
            "Medium", // gas_status
            "ON", // status_lampu1
            "OFF", // status_viewer
            "ON", // status_writing_table
            "ON", // status_lampu2
            "ON", // status_lampu_op
          ]);
        }

        // Data untuk RS Siloam Hospitals
        if (hospitals[4]) {
          sampleMonitoringData.push([
            hospitals[4].hospital_id,
            21.3, // temperature
            58.7, // humidity
            "Low", // gas_status
            "OFF", // status_lampu1
            "ON", // status_viewer
            "OFF", // status_writing_table
            "OFF", // status_lampu2
            "OFF", // status_lampu_op
          ]);
        }

        // Data untuk RS Hermina Group
        if (hospitals[5]) {
          sampleMonitoringData.push([
            hospitals[5].hospital_id,
            26.1, // temperature
            75.4, // humidity
            "High", // gas_status
            "ON", // status_lampu1
            "ON", // status_viewer
            "ON", // status_writing_table
            "ON", // status_lampu2
            "ON", // status_lampu_op
          ]);
        }

        for (const monitoring of sampleMonitoringData) {
          await connection.execute(
            "INSERT INTO monitoring_data (hospital_id, temperature, humidity, gas_status, status_lampu1, status_viewer, status_writing_table, status_lampu2, status_lampu_op, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
            monitoring
          );
        }

        console.log("✅ Sample monitoring data created");
      } else {
        console.log(
          "⚠️  No hospital data found, skipping monitoring data creation"
        );
      }
    } else {
      console.log("ℹ️  Sample monitoring data already exist");
    }
  } catch (error) {
    console.error("❌ Error inserting default data:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

async function migrate() {
  try {
    console.log("🚀 Starting database migration...");
    console.log("================================");

    await createDatabase();
    await createTables();
    await insertDefaultData();

    console.log("================================");
    console.log("✅ Database migration completed successfully!");
    console.log("🎉 Your Express.js backend is ready to use");
    console.log("");
    console.log("📝 Next steps:");
    console.log("1. Start the backend server: npm run dev");
    console.log("2. Update your React frontend to use the new API endpoints");
    console.log("3. Test the authentication flow");
    console.log("4. Change the default admin password");
  } catch (error) {
    console.error("💥 Migration failed:", error.message);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate, createDatabase, createTables, insertDefaultData };
