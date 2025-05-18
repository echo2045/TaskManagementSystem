// backend/src/index.js
require('dotenv').config();
const express       = require('express');
const cors          = require('cors');
const app           = express();
const userRoutes    = require('./routes/userRoutes');
const taskRoutes    = require('./routes/taskRoutes');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Task Management System Backend is Running');
});

// mount user routes at /api/users
app.use('/api/users', userRoutes);
// mount task routes at /api/tasks
app.use('/api/tasks', taskRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
