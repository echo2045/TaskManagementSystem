const pool = require('../db');

const checkDeadlines = async (io) => {
  console.log('[CRON] Checking for missed deadlines...');
  try {
    const result = await pool.query(`
      SELECT t.task_id, t.title, ta.assignee_id
      FROM tasks t
      JOIN task_assignments ta ON t.task_id = ta.task_id
      WHERE t.deadline < NOW() AND t.status = 'pending' AND ta.is_completed = FALSE
    `);

    for (const task of result.rows) {
      const message = `The deadline for task "${task.title}" has passed.`;
      await pool.query(
        'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
        [task.assignee_id, message]
      );
    }
  } catch (err) {
    console.error('[CRON] Error checking deadlines:', err);
  }
};

module.exports = { checkDeadlines };
