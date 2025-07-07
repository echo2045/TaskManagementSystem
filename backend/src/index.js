require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const pool = require('./db');

const { checkDeadlines } = require('./jobs/deadlineChecker');

// Periodically check for missed deadlines
setInterval(() => checkDeadlines(io), 60000); // Every 60 seconds

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for now, refine later
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`[SOCKET] User connected: ${socket.id}`);

  socket.on('join_room', (userId) => {
    if (userId) {
      console.log(`[SOCKET] Socket ${socket.id} joining room for user ${userId}`);
      socket.join(userId.toString());
    }
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] User disconnected: ${socket.id}`);
  });
});

// Listen for database notifications
const listenForNotifications = async () => {
  const client = await pool.connect();
  client.on('notification', (msg) => {
    if (msg.channel === 'new_notification_channel') {
      const payload = JSON.parse(msg.payload);
      console.log(`[DB NOTIFY] Received notification for user ${payload.user_id}: ${payload.message}`);
      io.to(payload.user_id.toString()).emit('new_notification', payload);
      console.log(`[SOCKET EMIT] Emitted 'new_notification' to room ${payload.user_id}`);
    }
  });
  await client.query('LISTEN new_notification_channel');
  console.log('[DB NOTIFY] Listening for new_notification_channel');
};

listenForNotifications().catch(console.error);

module.exports = { app, io, httpServer }; // Export io along with app and httpServer

const authRoutes         = require('./routes/authRoutes');
const authenticate       = require('./middleware/auth');
const userRoutes         = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes')(io);
const notificationRoutes = require('./routes/notificationRoutes')(io);
const projectRoutes      = require('./routes/projectRoutes');
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
app.use('/api/notifications', authenticate, notificationRoutes);

// 🚧 TEMPORARILY allow public access to projects and areas
app.use('/api/projects', projectRoutes); // 👈 No authenticate
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
