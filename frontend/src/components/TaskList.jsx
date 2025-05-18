import React, { useEffect, useState } from 'react';
import { getTasks } from '../api/tasks';

function TaskList() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch(err => console.error('Error fetching tasks:', err));
  }, []);

  return (
    <div>
      <h2>Active Tasks</h2>
      {tasks.length === 0 ? (
        <p>No tasks available.</p>
      ) : (
        tasks.map(task => (
          <div key={task.task_id} style={{
            border: '1px solid #ccc',
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '8px'
          }}>
            <strong>{task.title}</strong>
            <p>{task.description}</p>
            <p><b>Deadline:</b> {new Date(task.deadline).toLocaleString()}</p>
            <p><b>Importance:</b> {task.importance}, <b>Urgency:</b> {task.urgency}</p>
            <p><b>Status:</b> {task.status}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default TaskList;
