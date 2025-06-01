
// src/components/ProjectDashboard.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import TaskCard        from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import { getTasksForUser } from '../api/tasks';
import { getSupervisees }  from '../api/users';
import { AuthContext }     from '../AuthContext';
import { getTaskColor }    from '../utils/getTaskColor';

export default function ProjectDashboard({ filterUser }) {
  const { user } = useContext(AuthContext);

  const [tasks, setTasks]           = useState([]);
  const [now, setNow]               = useState(new Date());
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [superviseeIds, setSuperviseeIds] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle]   = useState('');

  const viewingUserId = filterUser?.user_id || user.user_id;

  useEffect(() => {
    if (!['manager','hr'].includes(user.role)) {
      getSupervisees(user.user_id)
        .then(list => setSuperviseeIds(list.map(u => u.user_id)))
        .catch(console.error);
    }
  }, [user]);

  const fetchTasks = useCallback(() => {
    getTasksForUser(viewingUserId)
      .then(data => setTasks(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error(err);
        setTasks([]);
      });
  }, [viewingUserId]);

  useEffect(() => {
    fetchTasks();
    let tId, iId;
    const align = () => {
      const s = new Date().getSeconds();
      const delay = s < 1 ? (1 - s) * 1000 : s < 31 ? (31 - s) * 1000 : (61 - s) * 1000;
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
    return () => { clearTimeout(tId); clearInterval(iId); };
  }, [fetchTasks]);

  const viewingOther = viewingUserId !== user.user_id;
  const allowed = !viewingOther
    || ['manager','hr'].includes(user.role)
    || superviseeIds.includes(viewingUserId);

  if (!allowed) return <div style={{ padding:'2rem' }}>You are not this person's supervisor.</div>;

  const visible = tasks
  .filter(t => {
    const assignedIds = Array.isArray(t.assignees) ? t.assignees.map(a => a.user_id) : [];
    const isManager = ['manager', 'hr'].includes(user.role);
    
    return t.project_id &&
      t.status === 'pending' &&
      new Date(t.deadline) >= now &&
      (
        isManager ||
        t.owner_id === viewingUserId ||
        assignedIds.includes(viewingUserId)
      );
  })
    .filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter && getTaskColor(t.importance, t.urgency) !== typeFilter) return false;
      if (dateFilter && new Date(t.deadline).toLocaleDateString() !== new Date(dateFilter).toLocaleDateString()) return false;
      return true;
    });

  const grouped = visible.reduce((acc, t) => {
    const key = new Date(t.deadline).toLocaleDateString();
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  const canCreate = viewingUserId === user.user_id;

  return (
  <div style={{
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: '1rem'
  }}>
    <h3 style={{ marginBottom: '1rem' }}>Project Tasks</h3>

    {/* Filters */}
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
      <input
        placeholder="Search by task title"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ flex: 2, padding: '0.5rem' }}
      />
      <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ height: '2.5rem' }}>
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
        style={{ height: '2.5rem' }}
      />
    </div>

    {/* Scrollable Task Section */}
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <h4>{date}</h4>
          {items.map(t => (
            <TaskCard
              key={t.task_id}
              task={t}
              viewingUserId={viewingUserId}
              showProjectNameInstead={true}
              onStatusChange={fetchTasks}
            />
          ))}
        </div>
      ))}
      {visible.length === 0 && <p>No project tasks to display.</p>}
    </div>
  </div>
);

}
