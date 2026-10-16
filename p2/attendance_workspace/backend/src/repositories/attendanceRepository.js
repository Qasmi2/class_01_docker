const pool = require('../config/db');

class AttendanceRepository {
  // 1. GET ALL: Fetch records and map snake_case to camelCase
  async getAllRecords() {
    const query = `
      SELECT 
        id, 
        name, 
        is_present AS "isPresent", 
        created_at AS "createdAt" 
      FROM attendance 
      ORDER BY id ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // 2. CREATE NEW: Convert React's camelCase input back into snake_case database writing
  async createRecord(name, isPresent) {
    const query = `
      INSERT INTO attendance (name, is_present) 
      VALUES ($1, $2) 
      RETURNING id, name, is_present AS "isPresent", created_at AS "createdAt";
    `;
    const values = [name, isPresent];
    const result = await pool.query(query, values);
    return result.rows[0]; // Returns the single row that was just added
  }
}

module.exports = new AttendanceRepository();
