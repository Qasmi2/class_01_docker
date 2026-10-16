const express = require('express');
const cors = require('cors');
require('dotenv').config();

const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows incoming connections from React
app.use(express.json()); // Parses incoming JSON payloads

// Attach application routes
app.use('/api', attendanceRoutes);

// Start listening
app.listen(PORT, () => {
  console.log(`🚀 Express MVC Backend is live on http://localhost:${PORT}`);
});
