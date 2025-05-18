// src/components/TaskBoard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getTasks } from '../api/tasks';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import { getTaskColor } from '../utils/getTaskColor';

export default function TaskBoard({ filterUser }) {
  const [tasks, setTasks]         = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [now, setNow]             = useState(new Date());
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchTasks = useCallback(() => {
    getTasks()
      .then(setTasks)
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchTasks();
    let timeoutId, intervalId;
    const schedule = () => {
      const sec = new Date().getSeconds();
      const delay = sec < 1 ? (1 - sec)*1000
                  : sec < 31 ? (31 - sec)*1000
                  : (61 - sec)*1000;
      timeoutId = setTimeout(() => {
        setNow(new Date());
        fetchTasks();
        intervalId = setInterval(() => {
          setNow(new Date());
          fetchTasks();
        }, 30000);
      }, delay);
    };
    schedule();
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [fetchTasks]);

  // Filter upcoming tasks
  let upcoming = tasks.filter(
    t => t.status === 'pending' && new Date(t.deadline) >= now
  );
  if (filterUser) {
    upcoming = upcoming.filter(t => t.owner_id === filterUser.user_id);
  }
  if (search) {
    upcoming = upcoming.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (typeFilter) {
    upcoming = upcoming.filter(t =>
      getTaskColor(t.importance, t.urgency) === typeFilter
    );
  }
  if (dateFilter) {
    upcoming = upcoming.filter(t =>
      new Date(t.deadline).toLocaleDateString() ===
      new Date(dateFilter).toLocaleDateString()
    );
  }

  // Group by date
  const grouped = upcoming.reduce((acc, t) => {
    const key = new Date(t.deadline).toLocaleDateString();
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  const open = () => setOpenModal(true);
  const close = () => {
    setOpenModal(false);
    fetchTasks();
  };

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%' }}>
      <h3 style={{padding:'0 1rem'}}>Task Entry</h3>
      <div style={{display:'flex',gap:'0.5rem',padding:'0 1rem'}}>
        <input
          placeholder="Enter Task Name"
          value={taskTitle}
          onChange={e => setTaskTitle(e.target.value)}
          style={{flex:1,padding:'0.5rem'}}
        />
        <button onClick={open}>Create</button>
      </div>

      <h3 style={{padding:'1rem 1rem 0'}}>Tasks</h3>
      <div style={{padding:'0 1rem'}}>
        <label style={{fontSize:'0.9rem'}}>Search</label>
        <input
          type="text"
          placeholder="Search tasks"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{width:'60%',padding:'0.5rem',margin:'0.25rem 0'}}
        />
        <div style={{margin:'0.5rem 0'}}>
          <label style={{fontSize:'0.9rem',marginRight:'1rem'}}>Filters</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{padding:'0.5rem',marginRight:'0.5rem'}}
          >
            <option value="">All Types</option>
            <option value="do">Do</option>
            <option value="schedule">Schedule</option>
            <option value="delegate">Delegate</option>
            <option value="eliminate">Eliminate</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{padding:'0.5rem'}}
          />
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'0 1rem'}}>
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <h4 style={{margin:'1rem 0 0.5rem'}}>{date}</h4>
            {items.map(task => (
              <TaskCard
                key={task.task_id}
                task={task}
                onStatusChange={fetchTasks}
              />
            ))}
          </div>
        ))}
      </div>

      {openModal && (
        <CreateTaskModal onClose={close} taskTitle={taskTitle} />
      )}
    </div>
  );
}
