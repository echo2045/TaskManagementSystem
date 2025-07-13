require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http');
const { Server } = require('socket.io');

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for now, refine later
    methods: ["GET", "POST"]
  }
});

module.exports = { app, io, httpServer }; // Export io along with app and httpServer

const authRoutes         = require('./routes/authRoutes');
const authenticate       = require('./middleware/auth');
const userRoutes         = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes')(io);
const notificationRoutes = require('./routes/notificationRoutes');
const projectRoutes      = require('./routes/projectRoutes');
const requestRoutes = require('./routes/requestRoutes')(io);
const areaRoutes         = require('./routes/areaRoutes');

//const deleteUserRoutes = require('./routes/deleteUserRoutes');
//const updateUserRoutes = require('./routes/updateUserRoutes');

app.use(cors());
app.use(express.json());

// Public auth endpoints
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', authenticate, userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);

// 🚧 TEMPORARILY allow public access to projects and areas
app.use('/api/projects', projectRoutes); // 👈 No authenticate
app.use('/api/requests', authenticate, requestRoutes);
app.use('/api/areas', areaRoutes);       // 👈 No authenticate

//app.use('/api/delete-user', deleteUserRoutes);
//app.use('/api/update-user', updateUserRoutes);

app.get('/', (req, res) => {
  res.send('Task Management System Backend is Running');
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
