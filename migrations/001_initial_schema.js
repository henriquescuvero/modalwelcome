const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function up() {
  try {
    // Create modal_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS modal_settings (
        id SERIAL PRIMARY KEY,
        shop_domain VARCHAR(255) UNIQUE NOT NULL,
        title TEXT,
        content TEXT,
        button_text TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create function to update timestamp
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create trigger for updated_at
      CREATE TRIGGER update_modal_settings_updated_at
          BEFORE UPDATE ON modal_settings
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
up();
