const pool = require('../db');

module.exports = (io) => {

  return {
    // GET /api/tasks
    getAllTasks: async (req, res) => {
      try {
        const result = await pool.query(`
          SELECT
            t.task_id, t.title, t.description, t.deadline,
            t.importance, t.urgency, t.status, t.owner_id,
            t.start_date, t.created_at, t.time_estimate,
            t.project_id, p.name AS project_name,
            t.area_id, a.name AS area_name,
            u.full_name AS owner_name
          FROM tasks t
          JOIN users u ON t.owner_id = u.user_id
          LEFT JOIN projects p ON t.project_id = p.project_id
          LEFT JOIN areas a ON t.area_id = a.area_id
          WHERE t.status = 'pending' AND t.deadline >= NOW()
          ORDER BY t.deadline ASC
        `);

        const tasks = result.rows;

        const assignees = await pool.query(`
          SELECT
            ta.task_id, u.user_id, u.full_name,
            ta.importance AS assignee_importance,
            ta.urgency AS assignee_urgency,
            ta.is_completed,
            ta.start_date,
            ta.assigned_time_estimate,
            d.full_name AS delegated_by
          FROM task_assignments ta
          JOIN users u ON ta.assignee_id = u.user_id
          LEFT JOIN users d ON ta.assigned_by = d.user_id
        `);

        const grouped = {};
        assignees.rows.forEach(row => {
          if (!grouped[row.task_id]) grouped[row.task_id] = [];
          grouped[row.task_id].push({
            user_id: row.user_id,
            full_name: row.full_name,
            delegated_by: row.delegated_by || null,
            importance: row.assignee_importance,
            urgency: row.assignee_urgency,
            is_completed: row.is_completed,
            start_date: row.start_date,
            assigned_time_estimate: row.assigned_time_estimate
          });
        });

        const enriched = await Promise.all(tasks.map(async t => {
          let total_hours_spent_for_user = 0;
          let time_difference_for_user = null;

          const task_assignees = grouped[t.task_id] || [];
          const assignee_entry = task_assignees.find(a => a.user_id === req.user.user_id);

          const isOwner = t.owner_id === req.user.user_id;
          const isAssignee = !!assignee_entry;

          if (isOwner || isAssignee) {
            const workSessionsResult = await pool.query(
              `SELECT SUM(EXTRACT(EPOCH FROM (COALESCE(end_time, CURRENT_TIMESTAMP) - start_time))) / 3600 AS total_hours
               FROM work_sessions
               WHERE task_id = $1 AND user_id = $2`,
              [t.task_id, req.user.user_id]
            );
            total_hours_spent_for_user = workSessionsResult.rows[0]?.total_hours || 0;

            let effective_time_estimate = t.time_estimate;
            if (isAssignee && assignee_entry.assigned_time_estimate != null) {
              effective_time_estimate = assignee_entry.assigned_time_estimate;
            }

            if (effective_time_estimate !== null) {
              time_difference_for_user = effective_time_estimate - total_hours_spent_for_user;
            }
          }

          return {
            ...t,
            assignees: task_assignees,
            total_hours_spent_for_user: total_hours_spent_for_user,
            time_difference_for_user: time_difference_for_user
          };
        }));

        res.json(enriched);
      } catch (err) {
        console.error('Error fetching tasks:', err.message);
        res.status(500).json({ error: err.message });
      }
    },

    // GET /api/tasks/:task_id
    getTaskById: async (req, res) => {
        const { task_id } = req.params;
        try {
            const result = await pool.query('SELECT * FROM tasks WHERE task_id = $1', [task_id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Task not found' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error fetching task:', err.message);
            res.status(500).json({ error: err.message });
        }
    },

    // GET /api/tasks/archive/:user_id
    getArchivedTasksForUser: async (req, res) => {
      const { user_id } = req.params;

      try {
        const taskResult = await pool.query(`
          SELECT
            t.task_id, t.title, t.description, t.deadline,
            t.importance, t.urgency, t.status, t.owner_id,
            t.start_date, t.created_at, t.time_estimate,
            t.project_id, t.area_id,
            u.full_name AS owner_name
          FROM tasks t
          JOIN users u ON t.owner_id = u.user_id
          WHERE (t.status = 'completed' OR t.deadline < NOW())
          ORDER BY t.deadline ASC
        `);

        const allArchivedTasks = taskResult.rows;

        const assigneeResult = await pool.query(`
          SELECT
            ta.task_id, u.user_id, u.full_name,
            ta.importance AS assignee_importance,
            ta.urgency AS assignee_urgency,
            ta.is_completed,
            ta.start_date,
            ta.assigned_time_estimate,
            d.full_name AS delegated_by
          FROM task_assignments ta
          JOIN users u ON ta.assignee_id = u.user_id
          LEFT JOIN users d ON ta.assigned_by = d.user_id
        `);

        const assigneesByTask = {};
        assigneeResult.rows.forEach(row => {
          if (!assigneesByTask[row.task_id]) assigneesByTask[row.task_id] = [];
          assigneesByTask[row.task_id].push({
            user_id: row.user_id,
            full_name: row.full_name,
            delegated_by: row.delegated_by || null,
            importance: row.assignee_importance,
            urgency: row.assignee_urgency,
            is_completed: row.is_completed,
            start_date: row.start_date,
            assigned_time_estimate: row.assigned_time_estimate
          });
        });

        const filtered = allArchivedTasks.filter(task => {
          const isOwner = task.owner_id === Number(user_id);
          const isAssigned = (assigneesByTask[task.task_id] || []).some(a => a.user_id === Number(user_id));
          return isOwner || isAssigned;
        });

        const enriched = await Promise.all(filtered.map(async t => {
          let total_hours_spent_for_user = 0;
          let time_difference_for_user = null;

          const task_assignees = assigneesByTask[t.task_id] || [];
          const assignee_entry = task_assignees.find(a => a.user_id === Number(user_id));

          const isOwner = t.owner_id === Number(user_id);
          const isAssigned = !!assignee_entry;

          if (isOwner || isAssigned) {
            const workSessionsResult = await pool.query(
              `SELECT SUM(EXTRACT(EPOCH FROM (COALESCE(end_time, CURRENT_TIMESTAMP) - start_time))) / 3600 AS total_hours
               FROM work_sessions
               WHERE task_id = $1 AND user_id = $2`,
              [t.task_id, user_id]
            );
            total_hours_spent_for_user = workSessionsResult.rows[0]?.total_hours || 0;

            let effective_time_estimate = t.time_estimate;
            if (isAssigned && assignee_entry.assigned_time_estimate != null) {
              effective_time_estimate = assignee_entry.assigned_time_estimate;
            }

            if (effective_time_estimate !== null) {
              time_difference_for_user = effective_time_estimate - total_hours_spent_for_user;
            }
          }

          return {
            ...t,
            assignees: task_assignees,
            total_hours_spent_for_user: total_hours_spent_for_user,
            time_difference_for_user: time_difference_for_user
          };
        }));

        res.json(enriched);
      } catch (err) {
        console.error('[TASK ARCHIVE FETCH ERROR]', err);
        res.status(500).json({ error: 'Error fetching archived tasks' });
      }
    },

    // POST /api/tasks
    createTask: async (req, res) => {
      const {
        title, description, deadline, importance, urgency,
        owner_id, project_id = null, area_id = null, start_date = null,
        time_estimate = null
      } = req.body;

      try {
        const normalizedDate = start_date ? new Date(start_date).toISOString().split('T')[0] : null;

        const result = await pool.query(`
          INSERT INTO tasks (title, description, deadline, importance, urgency, owner_id, status, project_id, area_id, start_date, time_estimate)
          VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10)
          RETURNING *
        `, [title, description, deadline, importance, urgency, owner_id, project_id, area_id, normalizedDate, time_estimate]);

        res.json(result.rows[0]);
      } catch (err) {
        console.error('Error inserting task:', err.message);
        res.status(500).json({ error: err.message });
      }
    },

    // PATCH /api/tasks/:id
    updateTask: async (req, res) => {
      const { task_id } = req.params;
      const {
        title, description, deadline, importance, urgency,
        status, project_id = null, area_id = null, start_date,
        time_estimate
      } = req.body;

      try {
        const existingTask = await pool.query(
          'SELECT deadline FROM tasks WHERE task_id = $1',
          [task_id]
        );

        if (existingTask.rowCount === 0) {
          return res.status(404).json({ error: 'Task not found' });
        }

        const finalDeadline = deadline || existingTask.rows[0].deadline;
        if (start_date && new Date(start_date) > new Date(finalDeadline)) {
          return res.status(400).json({ error: 'Start date cannot be after the deadline.' });
        }

        const normalizedStart = start_date ? new Date(start_date).toISOString().split('T')[0] : null;

        const result = await pool.query(`
          UPDATE tasks SET
            title = COALESCE($1, title),
            description = COALESCE($2, description),
            deadline = COALESCE($3, deadline),
            importance = COALESCE($4, importance),
            urgency = COALESCE($5, urgency),
            status = COALESCE($6, status),
            project_id = $7,
            area_id = $8,
            start_date = COALESCE($9, start_date),
            time_estimate = COALESCE($10, time_estimate)
          WHERE task_id = $11
          RETURNING *
        `, [
          title, description, deadline, importance, urgency,
          status, project_id, area_id, normalizedStart, time_estimate, task_id
        ]);

        res.json(result.rows[0]);
      } catch (err) {
        console.error('Error updating task:', err.message);
        res.status(500).json({ error: err.message });
      }
    },

    // PUT /api/tasks/:task_id
    updateTaskDetails: async (req, res) => {
      const { task_id } = req.params;
      const updates = req.body;

      try {
        const fields = [];
        const values = [];

        Object.entries(updates).forEach(([key, val], idx) => {
          fields.push(`${key} = ${idx + 1}`);
          values.push(val);
        });

        const query = `
          UPDATE tasks SET ${fields.join(', ')} WHERE task_id = ${values.length + 1}
          RETURNING *
        `;

        const result = await pool.query(query, [...values, task_id]);
        res.json(result.rows[0]);
      } catch (err) {
        console.error('Error updating task details:', err.message);
        res.status(500).json({ error: err.message });
      }
    },

    // GET /api/tasks/:id/assignees
    getTaskAssignees: async (req, res) => {
      const { task_id } = req.params;

      try {
        const result = await pool.query(`
          SELECT
            u.user_id, u.full_name, u.email,
            ta.importance AS assignee_importance,
            ta.urgency,
            ta.is_completed,
            ta.start_date,
            ta.assigned_time_estimate,
            ta.total_hours_spent,
            ta.time_difference,
            d.full_name AS delegated_by
          FROM task_assignments ta
          JOIN users u ON ta.assignee_id = u.user_id
          LEFT JOIN users d ON ta.assigned_by = d.user_id
          WHERE ta.task_id = $1
        `, [task_id]);

        const formatted = result.rows.map(row => ({
          user_id: row.user_id,
          full_name: row.full_name,
          email: row.email,
          importance: row.assignee_importance,
          urgency: row.urgency,
          is_completed: row.is_completed,
          delegated_by: row.delegated_by,
          start_date: row.start_date,
          assigned_time_estimate: row.assigned_time_estimate,
          total_hours_spent: row.total_hours_spent,
          time_difference: row.time_difference
        }));

        res.json(formatted);
      } catch (err) {
        console.error('Error fetching assignees:', err.message);
        res.status(500).json({ error: err.message });
      }
    },

    // POST /api/tasks/:id/assignees
    assignTask: async (req, res) => {
      const { task_id } = req.params;
      const { user_id, importance, urgency, start_date, assigned_time_estimate } = req.body;
      const assigned_by = req.user?.user_id || 1;

      try {
        const alreadyAssigned = await pool.query(`
          SELECT 1 FROM task_assignments
          WHERE task_id = $1 AND assignee_id = $2
        `, [task_id, user_id]);

        if (alreadyAssigned.rows.length > 0) {
          return res.status(400).json({ error: 'User is already assigned to this task.' });
        }

        const normalizedStart = start_date ? new Date(start_date).toISOString().split('T')[0] : null;

        await pool.query(`
          INSERT INTO task_assignments (task_id, assignee_id, assigned_by, importance, urgency, start_date, assigned_time_estimate)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [task_id, user_id, assigned_by, importance, urgency, normalizedStart, assigned_time_estimate]);

        // Fetch task and user details for the notification message
        const taskInfo = await pool.query('SELECT title FROM tasks WHERE task_id = $1', [task_id]);
        const assignerInfo = await pool.query('SELECT full_name FROM users WHERE user_id = $1', [assigned_by]);

        if (taskInfo.rows.length > 0 && assignerInfo.rows.length > 0) {
          const taskTitle = taskInfo.rows[0].title;
          const assignerName = assignerInfo.rows[0].full_name;
          const message = `${assignerName} assigned you a new task: "${taskTitle}"`;

          // Create notification for the assignee
          await pool.query(
            'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
            [user_id, message]
          );
        }

        res.status(201).json({ message: 'Task assigned successfully.' });
      } catch (err) {
        console.error('Error assigning task:', err.message);
        res.status(500).json({ error: err.message });
      }
    },

    // DELETE /api/tasks/:id/assignees/:userId
    unassignTask: async (req, res) => {
      const { task_id, userId } = req.params;
      const requestorId = req.user?.user_id || 1;

      try {
        const result = await pool.query(`
          DELETE FROM task_assignments
          WHERE task_id = $1 AND assignee_id = $2 AND assigned_by = $3
        `, [task_id, userId, requestorId]);

        if (result.rowCount === 0) {
          return res.status(403).json({ error: 'You can only unassign users you personally assigned.' });
        }

        res.sendStatus(204);
      } catch (err) {
        console.error('Error unassigning task:', err.message);
        res.status(500).json({ error: err.message });
      }
    },

    // PATCH /api/tasks/:taskId/assignment/:userId/complete
    markAssignmentCompleted: async (req, res) => {
      const { task_id, userId } = req.params;
      const { is_completed } = req.body;

      try {
        // Prevent unmarking if already completed
        if (is_completed === false) {
          const currentStatus = await pool.query(
            `SELECT is_completed FROM task_assignments WHERE task_id = $1 AND assignee_id = $2`,
            [task_id, userId]
          );
          if (currentStatus.rows[0]?.is_completed === true) {
            return res.status(400).json({ error: 'Completed tasks cannot be unmarked.' });
          }
        }

        // If marking as completed, calculate total hours spent and difference
        if (is_completed) {
          // Stop any active work session for this user on this task
          await pool.query(
            `UPDATE work_sessions SET end_time = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND task_id = $2 AND end_time IS NULL`,
            [userId, task_id]
          );

          // Calculate total hours spent on this task by this user
          const totalHoursResult = await pool.query(
            `SELECT SUM(EXTRACT(EPOCH FROM (COALESCE(end_time, CURRENT_TIMESTAMP) - start_time))) / 3600 AS total_hours
             FROM work_sessions
             WHERE task_id = $1 AND user_id = $2`,
            [task_id, userId]
          );
          const total_hours_spent = totalHoursResult.rows[0].total_hours || 0;

          // Get the assigned time estimate for this assignment or the task's general estimate
          const estimateResult = await pool.query(
            `SELECT ta.assigned_time_estimate, t.time_estimate
             FROM task_assignments ta
             JOIN tasks t ON ta.task_id = t.task_id
             WHERE ta.task_id = $1 AND ta.assignee_id = $2`,
            [task_id, userId]
          );
          const assigned_time_estimate = estimateResult.rows[0]?.assigned_time_estimate;
          const task_time_estimate = estimateResult.rows[0]?.time_estimate;

          const effective_time_estimate = assigned_time_estimate !== null ? assigned_time_estimate : task_time_estimate;
          const time_difference = effective_time_estimate !== null ? effective_time_estimate - total_hours_spent : null;

          // Update task_assignments with completion status, total hours, and difference
          await pool.query(
            `UPDATE task_assignments
             SET is_completed = $1,
                 total_hours_spent = $2,
                 time_difference = $3
             WHERE task_id = $4 AND assignee_id = $5`,
            [is_completed, total_hours_spent, time_difference, task_id, userId]
          );
        } else {
          // If unmarking, just update is_completed (though we're preventing this now)
          await pool.query(
            `UPDATE task_assignments
             SET is_completed = $1
             WHERE task_id = $2 AND assignee_id = $3`,
            [is_completed, task_id, userId]
          );
        }

        res.sendStatus(200);
      } catch (err) {
        console.error("Error updating assignment completion", err);
        res.status(500).json({ error: "Failed to update completion status" });
      }
    },

    // PATCH /api/tasks/:taskId/assignment/:userId/start-date
    updateAssignmentStartDate: async (req, res) => {
      const { task_id, userId } = req.params;
      const { start_date } = req.body;
      const requestorId = req.user?.user_id || 1;

      try {
        const check = await pool.query(`
          SELECT ta.assigned_by, t.deadline
          FROM task_assignments ta
          JOIN tasks t ON t.task_id = ta.task_id
          WHERE ta.task_id = $1 AND ta.assignee_id = $2
        `, [task_id, userId]);

        if (check.rows.length === 0) {
          return res.status(404).json({ error: 'Assignment not found' });
        }

        const { assigned_by, deadline } = check.rows[0];

        if (assigned_by !== requestorId) {
          return res.status(403).json({ error: 'Only the assigner can update the start date.' });
        }

        if (new Date(start_date) > new Date(deadline)) {
          return res.status(400).json({ error: 'Start date cannot be after the task deadline.' });
        }

        const normalizedStart = new Date(start_date).toISOString().split('T')[0];

        await pool.query(`
          UPDATE task_assignments
          SET start_date = $1
          WHERE task_id = $2 AND assignee_id = $3
        `, [normalizedStart, task_id, userId]);

        res.status(200).json({ message: 'Start date updated successfully.' });
      } catch (err) {
        console.error('Error updating start date:', err.message);
        res.status(500).json({ error: 'Failed to update start date' });
      }
    },

    // DELETE /api/tasks/:id
    deleteTask: async (req, res) => {
      const { task_id } = req.params;

      try {
        await pool.query('DELETE FROM tasks WHERE task_id = $1', [task_id]);
        res.sendStatus(204);
      } catch (err) {
        console.error('Error deleting task:', err.message);
        res.status(500).json({ error: err.message });
      }
    },

    // POST /api/tasks/:taskId/start
    startWorkSession: async (req, res) => {
        const { taskId } = req.params;
        const { user_id } = req.user;
        try {
            // End any existing work session for the user, this allows switching tasks
            await pool.query(
                `UPDATE work_sessions SET end_time = CURRENT_TIMESTAMP
                 WHERE user_id = $1 AND end_time IS NULL`,
                [user_id]
            );

            // Start a new work session
            const result = await pool.query(
                `INSERT INTO work_sessions (task_id, user_id, start_time)
                 VALUES ($1, $2, CURRENT_TIMESTAMP)
                 RETURNING *`,
                [taskId, user_id]
            );

            io.emit('workSessionUpdate', { userId: user_id, taskId: taskId, type: 'start' });

            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error('Error starting work session:', err.message);
            // Use the specific constraint name we created
            if (err.constraint === 'one_active_session_per_user') {
                return res.status(409).json({ error: 'A new session could not be started due to a conflict. Please try again.' });
            }
            res.status(500).json({ error: 'Failed to start work session.' });
        }
    },

    // POST /api/tasks/stop
    stopWorkSession: async (req, res) => {
        const { user_id } = req.user;

        try {
            const result = await pool.query(
                `UPDATE work_sessions SET end_time = CURRENT_TIMESTAMP
                 WHERE user_id = $1 AND end_time IS NULL
                 RETURNING *`,
                [user_id]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'No active work session found to stop.' });
            }

            // Emit WebSocket event
            io.emit('workSessionUpdate', { userId: user_id, type: 'stop' });

            res.status(200).json(result.rows[0]);
        } catch (err) {
            console.error('Error stopping work session:', err.message);
            res.status(500).json({ error: 'Failed to stop work session.' });
        }
    },

    // GET /api/users/:userId/work-history
    getWorkHistory: async (req, res) => {
        const { userId } = req.params;

        try {
            const result = await pool.query(
                `SELECT
                   ws.session_id,
                   ws.user_id,
                   ws.start_time,
                   ws.end_time,
                   t.task_id,
                   t.title,
                   t.time_estimate,
                   EXTRACT(EPOCH FROM (COALESCE(ws.end_time, CURRENT_TIMESTAMP) - ws.start_time))/3600 AS hours_spent
                 FROM work_sessions ws
                 JOIN tasks t ON ws.task_id = t.task_id
                 WHERE ws.user_id = $1
                 ORDER BY ws.start_time DESC`,
                [userId]
            );

            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching work history:', err.message);
            res.status(500).json({ error: 'Failed to fetch work history.' });
        }
    },

    // GET /api/users/:userId/current-task
    getCurrentTask: async (req, res) => {
        const { userId } = req.params;

        try {
            const result = await pool.query(
                `SELECT
                    t.task_id,
                    t.title,
                    t.time_estimate,
                    ws.start_time,
                    t.deadline
                 FROM work_sessions ws
                 JOIN tasks t ON ws.task_id = t.task_id
                 WHERE ws.user_id = $1 AND ws.end_time IS NULL`,
                [userId]
            );

            if (result.rows.length > 0) {
                const currentTask = result.rows[0];
                // If deadline passed, still return the task, but it's considered overdue
                res.json(currentTask);
            } else {
                res.json(null); // No active task
            }
        } catch (err) {
            console.error('Error fetching current task:', err.message);
            res.status(500).json({ error: 'Failed to fetch current task.' });
        }
    },
  };
};