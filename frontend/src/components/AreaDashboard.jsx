// src/components/AreaDashboard.jsx
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import { getTasksForUser } from '../api/tasks';
import { getAllAreas } from '../api/areas';
import TaskCard from './TaskCard';
import { getTaskColor } from '../utils/getTaskColor';

export default function AreaDashboard({ viewingOwnOnly = false }) {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [areas, setAreas] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [groupBy, setGroupBy] = useState('deadline');

  const fetchTasks = async () => {
    try {
      const data = await getTasksForUser(user.user_id);
      const filtered = data.filter(t =>
        t.area_id &&
        t.status === 'pending' &&
        (user.role === 'manager' ||
          t.owner_id === user.user_id ||
          t.assignees?.some(a => a.user_id === user.user_id))
      );
      setTasks(filtered);
    } catch (err) {
      console.error('Error loading area tasks', err);
    }
  };

  const fetchAreas = async () => {
    try {
      const data = await getAllAreas(true);
      setAreas(data);
    } catch (err) {
      console.error('Error loading area list', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchAreas();
  }, []);

  let visible = tasks;
  if (search) {
    visible = visible.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (typeFilter) {
    visible = visible.filter(t => getTaskColor(t.importance, t.urgency) === typeFilter);
  }
  if (areaFilter) {
    visible = visible.filter(t => t.area_id === Number(areaFilter));
  }
  if (dateFilter) {
    visible = visible.filter(t =>
      new Date(t[groupBy]).toLocaleDateString() === new Date(dateFilter).toLocaleDateString()
    );
  }

  const grouped = visible.reduce((acc, t) => {
    const key = new Date(t[groupBy]).toLocaleDateString();
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(
    ([a], [b]) => new Date(a) - new Date(b)
  );

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      padding: '1rem'
    }}>
      <h3 style={{ marginBottom: '1rem' }}>Area Tasks</h3>

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

        <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} style={{ height: '2.5rem' }}>
          <option value="">All Areas</option>
          {areas.map(a => (
            <option key={a.area_id} value={a.area_id}>
              {a.name}
            </option>
          ))}
        </select>

        <select value={groupBy} onChange={e => setGroupBy(e.target.value)} style={{ height: '2.5rem' }}>
          <option value="deadline">Group by Deadline</option>
          <option value="start_date">Group by Start Date</option>
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
        {sortedGroups.map(([date, items]) => (
          <div key={date}>
            <h4>{date}</h4>
            {items.map(t => {
              const area = areas.find(a => a.area_id === t.area_id);
              return (
                <TaskCard
                  key={t.task_id}
                  task={{ ...t, owner_name: area?.creator_name || 'Unknown' }}
                  viewingUserId={user.user_id}
                  showAreaNameInstead={true}
                  onStatusChange={fetchTasks}
                />
              );
            })}
          </div>
        ))}
        {visible.length === 0 && <p>No area tasks to display.</p>}
      </div>
    </div>
  );
}
