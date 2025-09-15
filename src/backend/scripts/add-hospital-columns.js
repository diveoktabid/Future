const mysql = require('mysql2/promise');

async function addHospitalColumns() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bartech_iot_db'
    });

    console.log('🔌 Connected to database');

    // Add missing columns to hospital table
    console.log('📝 Adding missing columns to hospital table...');
    
    const alterQueries = [
      'ALTER TABLE hospital ADD COLUMN IF NOT EXISTS address TEXT',
      'ALTER TABLE hospital ADD COLUMN IF NOT EXISTS phone VARCHAR(20)',
      'ALTER TABLE hospital ADD COLUMN IF NOT EXISTS email VARCHAR(100)',
      'ALTER TABLE hospital ADD COLUMN IF NOT EXISTS capacity INT',
      'ALTER TABLE hospital ADD COLUMN IF NOT EXISTS description TEXT'
    ];

    for (const query of alterQueries) {
      try {
        await connection.execute(query);
        console.log(`✅ Executed: ${query}`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️ Column already exists: ${query}`);
        } else {
          throw error;
        }
      }
    }

    console.log('✅ All columns added successfully');
    
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
if (require.main === module) {
  addHospitalColumns()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addHospitalColumns };
