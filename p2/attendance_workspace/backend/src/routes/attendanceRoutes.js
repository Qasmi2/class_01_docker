const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Route mapping rules
router.get('/attendance', attendanceController.getAttendance);
router.post('/attendance', attendanceController.addEmployee); // New endpoint for adding workers

module.exports = router;

