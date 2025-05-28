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

  const getAreaName = id =>
    areas.find(a => a.area_id === id)?.name || 'Area';

  return (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>Area Tasks</h3>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input
          placeholder="Search by task title"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 2, padding: '0.5rem' }}
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="do">Do</option>
          <option value="schedule">Schedule</option>
          <option value="delegate">Delegate</option>
          <option value="eliminate">Eliminate</option>
        </select>
        <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)}>
          <option value="">All Areas</option>
          {areas.map(a => (
            <option key={a.area_id} value={a.area_id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {visible.length > 0 ? (
        visible.map(t => (
          <TaskCard
            key={t.task_id}
            task={t}
            viewingUserId={user.user_id}
            showAreaNameInstead={true}
            onStatusChange={fetchTasks}
          />
        ))
      ) : (
        <p>No area tasks to display.</p>
      )}
    </div>
  );
}
