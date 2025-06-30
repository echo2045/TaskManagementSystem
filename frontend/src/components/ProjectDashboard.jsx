// src/components/ProjectDashboard.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import TaskCard from './TaskCard';
import { getTasksForUser } from '../api/tasks';
import { getSupervisees } from '../api/users';
import { getAllProjects } from '../api/projects';
import { AuthContext } from '../AuthContext';
import { getTaskColor, borderColors, interiorColors } from '../utils/getTaskColor';
import EisenhowerHelpModal from './EisenhowerHelpModal';

export default function ProjectDashboard({ filterUser }) {
  const { user } = useContext(AuthContext);

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [now, setNow] = useState(new Date());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [groupByStartDate, setGroupByStartDate] = useState(false);
  const [superviseeIds, setSuperviseeIds] = useState([]);
  const [isHelpModalVisible, setHelpModalVisible] = useState(false);

  const viewingUserId = filterUser?.user_id || user.user_id;

  useEffect(() => {
    if (!['manager', 'hr'].includes(user.role)) {
      getSupervisees(user.user_id)
        .then(list => setSuperviseeIds(list.map(u => u.user_id)))
        .catch(console.error);
    }
    getAllProjects(true)
      .then(setProjects)
      .catch(console.error);
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
  }, [fetchTasks, filterUser]);

  const viewingOther = viewingUserId !== user.user_id;
  const allowed = !viewingOther
    || ['manager', 'hr'].includes(user.role)
    || superviseeIds.includes(viewingUserId);

  if (!allowed) return <div style={{ padding: '2rem' }}>You are not this person's supervisor.</div>;

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
      if (projectFilter && t.project_id !== Number(projectFilter)) return false;
      const compareDate = groupByStartDate ? t.start_date : t.deadline;
      if (dateFilter && new Date(compareDate).toLocaleDateString() !== new Date(dateFilter).toLocaleDateString()) return false;
      return true;
    });

  const grouped = visible
    .sort((a, b) => new Date(groupByStartDate ? a.start_date : a.deadline) - new Date(groupByStartDate ? b.start_date : b.deadline))
    .reduce((acc, t) => {
      const key = new Date(groupByStartDate ? t.start_date : t.deadline).toLocaleDateString();
      (acc[key] = acc[key] || []).push(t);
      return acc;
    }, {});

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Eisenhower Matrix Capsules */}
      <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1rem 1rem' }}>
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
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>Search Project Tasks</label>
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

        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} style={{ height: '2.5rem' }}>
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.project_id} value={p.project_id}>{p.name}</option>
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

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <h4><strong>{groupByStartDate ? 'Start Date' : 'Deadline'}:</strong> {date}</h4>
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
      <EisenhowerHelpModal
        visible={isHelpModalVisible}
        onClose={() => setHelpModalVisible(false)}
      />
    </div>
  );
}
