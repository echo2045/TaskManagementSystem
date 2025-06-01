import React, { useState, useEffect, useCallback, useContext } from 'react';
import TaskCard from './TaskCard';
import { getArchivedTasksForUser } from '../api/tasks';
import { getSupervisees } from '../api/users';
import { AuthContext } from '../AuthContext';
import { getTaskColor } from '../utils/getTaskColor';

export default function ArchiveBoard({ filterUser, currentUser }) {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [now, setNow] = useState(new Date());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [superviseeIds, setSuperviseeIds] = useState([]);

  const viewingUserId = filterUser?.user_id || currentUser.user_id;

  useEffect(() => {
    if (!['manager', 'hr'].includes(user.role)) {
      getSupervisees(user.user_id)
        .then(list => setSuperviseeIds(list.map(u => u.user_id)))
        .catch(console.error);
    }
  }, [user]);

  const fetchArchive = useCallback(() => {
    getArchivedTasksForUser(viewingUserId)
      .then(setTasks)
      .catch(console.error);
  }, [viewingUserId]);
  

  useEffect(() => {
    fetchArchive();
    let tId, iId;
    const align = () => {
      const s = new Date().getSeconds();
      const delay = s < 1 ? (1 - s) * 1000 : s < 31 ? (31 - s) * 1000 : (61 - s) * 1000;
      tId = setTimeout(() => {
        setNow(new Date());
        fetchArchive();
        iId = setInterval(() => {
          setNow(new Date());
          fetchArchive();
        }, 30000);
      }, delay);
    };
    align();
    return () => {
      clearTimeout(tId);
      clearInterval(iId);
    };
  }, [fetchArchive]);

  const viewingOther = viewingUserId !== currentUser.user_id;
  const allowed = !viewingOther
    || ['manager', 'hr'].includes(user.role)
    || superviseeIds.includes(viewingUserId);

  if (!allowed) {
    return (
      <div style={{ padding: '2rem', color: '#000' }}>
        You are not this person’s supervisor.
      </div>
    );
  }

  // Annotate expired
  let archived = tasks.map(t => ({
    ...t,
    wasExpired: new Date(t.deadline) < now
  }));

  // Filters
  if (search) {
    archived = archived.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (statusFilter) {
    archived = archived.filter(t => {
      if (statusFilter === 'Complete') return t.status === 'completed' && !t.wasExpired;
      if (statusFilter === 'Late') return t.status === 'completed' && t.wasExpired;
      if (statusFilter === 'Incomplete') return t.status !== 'completed';
      return true;
    });
  }
  if (typeFilter) {
    archived = archived.filter(t =>
      getTaskColor(t.importance, t.urgency) === typeFilter
    );
  }
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '0 1rem' }}>
        <h3>Archive</h3>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '0 1rem', marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.9rem' }}>Search</label>
        <input
          type="text"
          placeholder="Search archive…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '0.5rem' }}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', padding: '0 1rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '0.9rem' }}>Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '0.5rem' }}
          >
            <option value="">All</option>
            <option value="Complete">Complete</option>
            <option value="Late">Late</option>
            <option value="Incomplete">Incomplete</option>
          </select>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '0.9rem' }}>Type</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: '0.5rem' }}
          >
            <option value="">All</option>
            <option value="do">Do</option>
            <option value="schedule">Schedule</option>
            <option value="delegate">Delegate</option>
            <option value="eliminate">Eliminate</option>
          </select>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '0.9rem' }}>Date</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{ padding: '0.5rem', flex: 1 }}
            />
            <button
              onClick={() => setDateFilter('')}
              style={{ padding: '0 0.75rem' }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Archived Task List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem' }}>
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <h4 style={{ margin: '1rem 0 0.5rem' }}>{date}</h4>
            {items.map(task => (
              <TaskCard
                key={task.task_id}
                task={task}
                viewingUserId={viewingUserId}
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
