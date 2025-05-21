// src/components/TaskBoard.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import TaskCard        from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import { getTasksForUser } from '../api/tasks';
import { getSupervisees }  from '../api/users';
import { AuthContext }     from '../AuthContext';
import { getTaskColor }    from '../utils/getTaskColor';

export default function TaskBoard({ filterUser, currentUser }) {
  const { user } = useContext(AuthContext);

  const [tasks, setTasks]           = useState([]);
  const [now, setNow]               = useState(new Date());
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [superviseeIds, setSuperviseeIds] = useState([]);

  // For creating
  const [newTitle, setNewTitle]   = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Whose tasks are being viewed?
  const viewingUserId = filterUser?.user_id || currentUser.user_id;

  // Load supervisees for guard logic
  useEffect(() => {
    if (user.role !== 'manager' && user.role !== 'hr') {
      getSupervisees(user.user_id)
        .then(list => setSuperviseeIds(list.map(u => u.user_id)))
        .catch(console.error);
    }
  }, [user]);

  // Fetch tasks
  const fetchTasks = useCallback(() => {
    getTasksForUser(viewingUserId)
      .then(setTasks)
      .catch(console.error);
  }, [viewingUserId]);

  // Poll aligned to :01 every 30s
  useEffect(() => {
    fetchTasks();
    let tId, iId;
    const align = () => {
      const s = new Date().getSeconds();
      const delay = s < 1 ? (1 - s)*1000
                  : s < 31 ? (31 - s)*1000
                  : (61 - s)*1000;
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

  // Guard: viewing other only if manager/HR or supervisee
  const viewingOther = viewingUserId !== currentUser.user_id;
  const allowed = !viewingOther
    || user.role === 'manager'
    || user.role === 'hr'
    || superviseeIds.includes(viewingUserId);
  if (!allowed) {
    return (
      <div style={{ padding:'2rem', color:'#000' }}>
        You are not this person’s supervisor.
      </div>
    );
  }

  // Filter to pending + not expired
  let visible = tasks.filter(t =>
    t.status === 'pending' && new Date(t.deadline) >= now
  );
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

  // Group by date
  const grouped = visible.reduce((acc, t) => {
    const d = new Date(t.deadline).toLocaleDateString();
    (acc[d] = acc[d] || []).push(t);
    return acc;
  }, {});

  // Only allow creating for yourself
  const canCreate = viewingUserId === currentUser.user_id;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {canCreate && (
        <>
          <h3 style={{ padding:'0 1rem' }}>Task Entry</h3>
          <div style={{
            display:'flex', gap:'0.5rem',
            padding:'0 1rem', marginBottom:'1rem'
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
            >Create</button>
          </div>
          <CreateTaskModal
            visible={modalOpen}
            onClose={() => setModalOpen(false)}
            onCreated={() => {
              setModalOpen(false);
              setNewTitle('');
              fetchTasks();
            }}
            ownerId={currentUser.user_id}
            initialTitle={newTitle}
          />
        </>
      )}

      {/* Filters */}
      <div style={{
        display:'flex', gap:'1rem',
        padding:'0 1rem', marginBottom:'1rem'
      }}>
        <div style={{ flex:1 }}>
          <label>Search</label>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', padding:'0.5rem' }}
          />
        </div>
        <div>
          <label>Type</label>
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
          <label>Date</label>
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
        }}>Clear</button>
      </div>

      {/* Task List */}
      <div style={{
        flex:1, overflowY:'auto', padding:'0 1rem'
      }}>
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <h4 style={{ margin:'1rem 0 0.5rem' }}>{date}</h4>
            {items.map(t => (
              <TaskCard
                key={t.task_id}
                task={t}
                viewingUserId={viewingUserId}
                onStatusChange={fetchTasks}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
