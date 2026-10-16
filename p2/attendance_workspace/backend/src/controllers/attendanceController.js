const attendanceRepository = require('../repositories/attendanceRepository');

class AttendanceController {
  // Handle GET /api/attendance
  async getAttendance(req, res) {
    try {
      const records = await attendanceRepository.getAllRecords();
      return res.status(200).json(records);
    } catch (error) {
      console.error('Controller GET Error:', error);
      return res.status(500).json({ error: 'Internal Server Database Error' });
    }
  }

  // Handle POST /api/attendance
  async addEmployee(req, res) {
    try {
      const { name, isPresent } = req.body;

      // Basic data validation
      if (!name) {
        return res.status(400).json({ error: 'Employee name is required.' });
      }

      // Default isPresent status to false if missing from payload
      const attendanceStatus = isPresent !== undefined ? isPresent : false;

      const newRecord = await attendanceRepository.createRecord(name, attendanceStatus);
      return res.status(201).json(newRecord);
    } catch (error) {
      console.error('Controller POST Error:', error);
      return res.status(500).json({ error: 'Failed to write record to database.' });
    }
  }
}

module.exports = new AttendanceController();
