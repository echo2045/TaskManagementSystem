// frontend/src/components/TaskBoard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getTasks } from '../api/tasks';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';

export default function TaskBoard({ filterUser, currentUser }) {
  const [tasks, setTasks]         = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [now, setNow]             = useState(new Date());

  const fetchTasks = useCallback(() => {
    getTasks().then(setTasks).catch(console.error);
  }, []);

  useEffect(() => {
    fetchTasks();
    const id = setInterval(fetchTasks, 30000);
    return () => clearInterval(id);
  }, [fetchTasks]);

  const visible = tasks.filter(
    t => t.status === 'pending' &&
         new Date(t.deadline) >= now &&
         (!filterUser || t.owner_id === filterUser.user_id)
  );

  const grouped = visible.reduce((acc, t) => {
    const d = new Date(t.deadline).toLocaleDateString();
    (acc[d] = acc[d]||[]).push(t);
    return acc;
  }, {});

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <h3>Task Entry</h3>
      <div style={{ display:'flex', gap:'0.5rem' }}>
        <input
          placeholder="Enter Task Name"
          value={taskTitle}
          onChange={e => setTaskTitle(e.target.value)}
          style={{ flex:1, padding:'0.5rem' }}
        />
        <button onClick={() => setOpenModal(true)}>Create</button>
      </div>

      <h3 style={{ marginTop:'1rem' }}>Tasks</h3>
      <div style={{ flex:1, overflowY:'auto', padding:'0 0.5rem' }}>
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <h4>{date}</h4>
            {items.map(t => (
              <TaskCard
                key={t.task_id}
                task={t}
                onStatusChange={fetchTasks}
              />
            ))}
          </div>
        ))}
      </div>

      {openModal && (
        <CreateTaskModal
          onClose={() => { setOpenModal(false); fetchTasks(); }}
          taskTitle={taskTitle}
          ownerId={currentUser.user_id}   // ← now sending owner_id = 2
        />
      )}
    </div>
  );
}
