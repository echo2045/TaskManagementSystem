// src/components/TaskBoard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import TaskCard        from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import { getTasksForUser } from '../api/tasks';
import { getTaskColor }    from '../utils/getTaskColor';

export default function TaskBoard({ filterUser, currentUser }) {
  const [tasks, setTasks]           = useState([]);
  const [now, setNow]               = useState(new Date());
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Task‐entry state
  const [newTitle, setNewTitle]     = useState('');
  const [modalOpen, setModalOpen]   = useState(false);

  // Always fetch for the **logged‐in** user
  const userId = currentUser.user_id;

  const fetchTasks = useCallback(() => {
    getTasksForUser(filterUser?.user_id || userId)
      .then(setTasks)
      .catch(console.error);
  }, [filterUser, userId]);

  // Poll every 30s, aligned to :01 past the minute
  useEffect(() => {
    fetchTasks();
    let tId, iId;
    const align = () => {
      const s = new Date().getSeconds();
      const delay = s < 1  ? (1 - s) * 1000
                  : s < 31 ? (31 - s) * 1000
                  : (61 - s) * 1000;
      tId = setTimeout(() => {
        setNow(new Date());
        fetchTasks();
        iId = setInterval(() => {
          setNow(new Date());
          fetchTasks();
        }, 30000);
      }, delay);
    };
    align();
    return () => {
      clearTimeout(tId);
      clearInterval(iId);
    };
  }, [fetchTasks]);

  // Filter to only pending & not‐expired tasks
  let visible = tasks.filter(
    t => t.status === 'pending' && new Date(t.deadline) >= now
  );

  // Apply search/type/date filters
  if (search) {
    visible = visible.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (typeFilter) {
    visible = visible.filter(t =>
      getTaskColor(t.importance, t.urgency) === typeFilter
    );
  }
  if (dateFilter) {
    visible = visible.filter(t =>
      new Date(t.deadline).toLocaleDateString() ===
      new Date(dateFilter).toLocaleDateString()
    );
  }

  // Group by calendar date
  const grouped = visible.reduce((acc, t) => {
    const d = new Date(t.deadline).toLocaleDateString();
    (acc[d] = acc[d] || []).push(t);
    return acc;
  }, {});

  // Only allow creating tasks for yourself
  const canCreate = !filterUser || filterUser.user_id === userId;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Task Entry — only for your own tasks */}
      {canCreate && (
        <>
          <h3 style={{ padding:'0 1rem' }}>Task Entry</h3>
          <div style={{
            display:'flex',
            gap:'0.5rem',
            padding:'0 1rem',
            marginBottom:'1rem'
          }}>
            <input
              placeholder="Enter Task Name"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              style={{ flex:1, padding:'0.5rem' }}
            />
            <button
              onClick={() => setModalOpen(true)}
              disabled={!newTitle.trim()}
            >
              Create
            </button>
          </div>

          <CreateTaskModal
            visible={modalOpen}
            onClose={() => setModalOpen(false)}
            onCreated={() => {
              setModalOpen(false);
              setNewTitle('');
              fetchTasks();
            }}
            ownerId={userId}
            initialTitle={newTitle}
          />
        </>
      )}

      {/* Search & Filters */}
      <div style={{
        display:'flex',
        gap:'1rem',
        padding:'0 1rem',
        marginBottom:'1rem'
      }}>
        <div style={{ flex:1 }}>
          <label style={{ display:'block' }}>Search</label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', padding:'0.5rem' }}
          />
        </div>
        <div>
          <label style={{ display:'block' }}>Type</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ padding:'0.5rem' }}
          >
            <option value="">All Types</option>
            <option value="do">Do</option>
            <option value="schedule">Schedule</option>
            <option value="delegate">Delegate</option>
            <option value="eliminate">Eliminate</option>
          </select>
        </div>
        <div>
          <label style={{ display:'block' }}>Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{ padding:'0.5rem' }}
          />
        </div>
        <button onClick={() => {
          setSearch('');
          setTypeFilter('');
          setDateFilter('');
        }}>
          Clear
        </button>
      </div>

      {/* Task List */}
      <div style={{
        flex:1,
        overflowY:'auto',
        padding:'0 1rem'
      }}>
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <h4 style={{ margin:'1rem 0 0.5rem' }}>{date}</h4>
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
    </div>
  );
}
