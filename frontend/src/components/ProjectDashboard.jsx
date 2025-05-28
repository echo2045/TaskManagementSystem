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
      return t.project_id &&
        t.status === 'pending' &&
        new Date(t.deadline) >= now &&
        (t.owner_id === viewingUserId || assignedIds.includes(viewingUserId));
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
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {canCreate && (
        <>
          <h3 style={{ padding:'0 1rem' }}>Task Entry</h3>
          <div style={{ display:'flex', gap:'0.5rem', padding:'0 1rem', marginBottom:'1rem' }}>
            <input
              placeholder="Enter Task Name"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              style={{ flex:1, padding:'0.5rem' }}
            />
            <button onClick={() => setModalOpen(true)} disabled={!newTitle.trim()}>Create</button>
          </div>
          <CreateTaskModal
            visible={modalOpen}
            onClose={() => { setModalOpen(false); setNewTitle(''); fetchTasks(); }}
            ownerId={user.user_id}
            initialTitle={newTitle}
          />
        </>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:'1.5rem', padding:'0 1rem', marginBottom:'1rem' }}>
        <div style={{ flex:2 }}>
          <label>Search</label>
          <input value={search} onChange={e => setSearch(e.target.value)} style={{ width:'100%' }} />
        </div>
        <div>
          <label>Type</label>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All</option>
            <option value="do">Do</option>
            <option value="schedule">Schedule</option>
            <option value="delegate">Delegate</option>
            <option value="eliminate">Eliminate</option>
          </select>
        </div>
        <div>
          <label>Date</label>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        </div>
      </div>

      {/* Task List */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 1rem' }}>
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <h4>{date}</h4>
            {items.map(t => (
              <TaskCard
                key={t.task_id}
                task={t}
                viewingUserId={viewingUserId}
                onStatusChange={fetchTasks}
                showProjectNameInstead={true}
              />
            ))}
          </div>
        ))}
        {visible.length === 0 && <p>No tasks to display.</p>}
      </div>
    </div>
  );
}
