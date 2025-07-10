// src/components/AreaDashboard.jsx
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import { getTasksForUser } from '../api/tasks';
import { getAllAreas } from '../api/areas';
import TaskCard from './TaskCard';
import { getTaskColor, borderColors, interiorColors } from '../utils/getTaskColor';
import EisenhowerHelpModal from './EisenhowerHelpModal';

export default function AreaDashboard() {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [areas, setAreas] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [groupByStartDate, setGroupByStartDate] = useState(false);
  const [isHelpModalVisible, setHelpModalVisible] = useState(false);

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
      const data = await getAllAreas();
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
      new Date(groupByStartDate ? t.start_date : t.deadline).toLocaleDateString() === new Date(dateFilter).toLocaleDateString()
    );
  }

  const grouped = visible
    .sort((a, b) => new Date(groupByStartDate ? a.start_date : a.deadline) - new Date(groupByStartDate ? b.start_date : b.deadline))
    .reduce((acc, t) => {
      const key = new Date(groupByStartDate ? t.start_date : t.deadline).toLocaleDateString();
      (acc[key] = acc[key] || []).push(t);
      return acc;
    }, {});

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      padding: 0
    }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '0.5rem' }}>
        {Object.entries(borderColors).map(([type, color]) => (
          <div
            key={type}
            onClick={() => setHelpModalVisible(true)}
            style={{
              backgroundColor: interiorColors[type],
              border: `2px solid ${color}`,
              borderRadius: '16px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontWeight: 'bold'
            }}
          >
            {type}
          </div>
        ))}
      </div>
      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1rem',
        alignItems: 'flex-end',
        paddingRight: '1rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 2 }}>
          <label style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>
            Search Area Tasks
          </label>
          <input
            placeholder="Search by task title"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '0.5rem' }}
          />
        </div>

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

        <select
          value={groupByStartDate ? 'start' : 'deadline'}
          onChange={e => setGroupByStartDate(e.target.value === 'start')}
          style={{ height: '2.5rem' }}
        >
          <option value="deadline">Group by Deadline</option>
          <option value="start">Group by Start Date</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          style={{ height: '2.5rem' }}
        />
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <h4><strong>{groupByStartDate ? 'Start Date' : 'Deadline'}:</strong> {date}</h4>
            {items.map(t => {
              const area = areas.find(a => a.area_id === t.area_id);
              return (
                <TaskCard
                  key={t.task_id}
                  task={t}
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
      <EisenhowerHelpModal
        visible={isHelpModalVisible}
        onClose={() => setHelpModalVisible(false)}
      />
    </div>
  );
}
