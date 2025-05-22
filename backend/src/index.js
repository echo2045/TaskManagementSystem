require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const app          = express();

const authRoutes    = require('./routes/authRoutes');
const authenticate  = require('./middleware/auth');
const userRoutes    = require('./routes/userRoutes');
const taskRoutes    = require('./routes/taskRoutes');

const notificationRoutes = require('./routes/notificationRoutes');

app.use(cors());
app.use(express.json());

// Public auth endpoints
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', authenticate, userRoutes);
app.use('/api/tasks', authenticate, taskRoutes);

app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('Task Management System Backend is Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
