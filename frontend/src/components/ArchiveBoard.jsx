// src/components/ArchiveBoard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getArchivedTasks } from '../api/tasks';
import TaskCard from './TaskCard';
import { getTaskColor } from '../utils/getTaskColor';

export default function ArchiveBoard({ filterUser }) {
  const [tasks, setTasks]   = useState([]);
  const [now, setNow]       = useState(new Date());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [dateFilter, setDateFilter]     = useState('');

  const fetchArchive = useCallback(() => {
    getArchivedTasks().then(setTasks).catch(console.error);
  }, []);

  useEffect(() => {
    fetchArchive();
    let timeoutId, intervalId;
    const schedule = () => {
      const sec = new Date().getSeconds();
      const delay = sec < 1 ? (1 - sec)*1000
                  : sec < 31 ? (31 - sec)*1000
                  : (61 - sec)*1000;
      timeoutId = setTimeout(() => {
        setNow(new Date());
        fetchArchive();
        intervalId = setInterval(() => {
          setNow(new Date());
          fetchArchive();
        }, 30000);
      }, delay);
    };
    schedule();
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [fetchArchive]);

  // Annotate expired flag
  let archived = tasks.map(t => ({
    ...t,
    wasExpired: new Date(t.deadline) < now
  }));

  // User filter
  if (filterUser) {
    archived = archived.filter(t => t.owner_id === filterUser.user_id);
  }
  // Search filter
  if (search) {
    archived = archived.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase())
    );
  }
  // Status filter
  if (statusFilter) {
    archived = archived.filter(t => {
      if (statusFilter === 'Complete')   return t.status === 'completed' && !t.wasExpired;
      if (statusFilter === 'Late')       return t.status === 'completed' && t.wasExpired;
      if (statusFilter === 'Incomplete') return t.status !== 'completed';
      return true;
    });
  }
  // Type of task filter
  if (typeFilter) {
    archived = archived.filter(t =>
      getTaskColor(t.importance, t.urgency) === typeFilter
    );
  }
  // Date filter
  if (dateFilter) {
    archived = archived.filter(t =>
      new Date(t.deadline).toLocaleDateString() ===
      new Date(dateFilter).toLocaleDateString()
    );
  }

  // Group by date
  const grouped = archived.reduce((acc, t) => {
    const key = new Date(t.deadline).toLocaleDateString();
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <h3 style={{ padding:'0 1rem' }}>Archive</h3>

      {/* Search */}
      <div style={{ padding:'0 1rem' }}>
        <label style={{ fontSize:'0.9rem' }}>Search</label>
        <input
          type="text"
          placeholder="Search archive"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width:'60%', padding:'0.5rem', margin:'0.25rem 0' }}
        />
      </div>

      {/* Filters */}
      <div style={{ padding:'0 1rem' }}>
        <label style={{ fontSize:'0.9rem', marginRight:'1rem' }}>Filters</label>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding:'0.5rem', marginRight:'0.5rem' }}
        >
          <option value="">All Status</option>
          <option value="Complete">Complete</option>
          <option value="Late">Late</option>
          <option value="Incomplete">Incomplete</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{ padding:'0.5rem', marginRight:'0.5rem' }}
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
          style={{ padding:'0.5rem' }}
        />
      </div>

      {/* Task List */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 1rem' }}>
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <h4 style={{ margin:'1rem 0 0.5rem' }}>{date}</h4>
            {items.map(task => (
              <TaskCard
                key={task.task_id}
                task={task}
                isArchived
                wasExpired={task.wasExpired}
                onStatusChange={fetchArchive}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
