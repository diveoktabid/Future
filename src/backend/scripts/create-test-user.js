const bcrypt = require("bcryptjs");
const { executeQuery } = require("../config/database");

async function createTestUser() {
  try {
    console.log("🔧 Creating test user...");

    // Check if users table exists and create if not
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          full_name VARCHAR(150) NOT NULL,
          phone_number VARCHAR(20),
          role ENUM('admin', 'user', 'operator') DEFAULT 'user',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          last_login TIMESTAMP NULL
        )
      `);
      console.log("✅ Users table ready");
    } catch (error) {
      console.log("ℹ️ Users table already exists");
    }

    // Check if refresh_tokens table exists and create if not
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          token VARCHAR(500) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log("✅ Refresh tokens table ready");
    } catch (error) {
      console.log("ℹ️ Refresh tokens table already exists");
    }

    // Hash password
    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create test user
    const result = await executeQuery(`
      INSERT INTO users (username, email, password, full_name, phone_number, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        password = VALUES(password),
        full_name = VALUES(full_name),
        phone_number = VALUES(phone_number),
        is_active = VALUES(is_active)
    `, [
      "testuser",
      "test@email.com", 
      hashedPassword,
      "Test User",
      "081234567890",
      "user",
      true
    ]);

    console.log("✅ Test user created/updated successfully!");
    console.log("📧 Email: test@email.com");
    console.log("🔑 Password: password123");
    console.log("👤 Role: user");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating test user:", error);
    process.exit(1);
  }
}

createTestUser();
