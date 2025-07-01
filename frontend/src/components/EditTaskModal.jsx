// src/components/EditTaskModal.jsx
import React, { useEffect, useState } from 'react';
import { updateTask, getAssignees } from '../api/tasks';
import { getAllProjects } from '../api/projects';
import { getAllAreas } from '../api/areas';

export default function EditTaskModal({ task, onClose, onDone }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [startDate, setStartDate] = useState(formatDate(task.start_date || new Date()));
  const [deadline, setDeadline] = useState(formatDate(task.deadline));
  const [importance, setImportance] = useState(task.importance);
  const [urgency, setUrgency] = useState(task.urgency);
  const [projectId, setProjectId] = useState(task.project_id || '');
  const [areaId, setAreaId] = useState(task.area_id || '');
  const [timeEstimate, setTimeEstimate] = useState(task.time_estimate || '');
  const [projects, setProjects] = useState([]);
  const [areas, setAreas] = useState([]);
  const [assignees, setAssignees] = useState([]);

  useEffect(() => {
    getAllProjects(true).then(setProjects).catch(console.error);
    getAllAreas(true).then(setAreas).catch(console.error);
    getAssignees(task.task_id).then(setAssignees).catch(console.error);
  }, [task.task_id]);

  const handleSubmit = async () => {
    if (!title.trim()) return alert('Title is required');

    const start = new Date(startDate);
    const end = new Date(deadline);
    if (start > end) return alert('Start date must be before or same as deadline');

    const invalidAssignees = assignees.filter(a => new Date(a.start_date) > end);
    if (invalidAssignees.length > 0) {
      return alert('Deadline cannot be earlier than an assignee’s start date.');
    }

    try {
      await updateTask(task.task_id, {
        title,
        description,
        start_date: startDate + 'T00:00:00',
        deadline: deadline + 'T00:00:00',
        importance,
        urgency,
        project_id: projectId || null,
        area_id: projectId ? null : areaId || null,
        time_estimate: timeEstimate ? Number(timeEstimate) : null
      });
      onDone();
    } catch (err) {
      console.error(err);
      alert('Failed to update task');
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2>Edit Task</h2>

        <label style={label}>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} style={input} />

        <label style={label}>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} style={textarea} />

        <label style={label}>Time Estimate (hours)</label>
        <input type="number" value={timeEstimate} onChange={e => setTimeEstimate(e.target.value)} style={input} placeholder="e.g., 4.5" />

        <div style={row}>
          <div style={{ flex: 1, marginRight: '1rem' }}>
            <label style={label}>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={input} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>Deadline</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={input} />
          </div>
        </div>

        <div style={row}>
          <div style={{ flex: 1, marginRight: '1rem' }}>
            <label style={label}>Importance: {importance}</label>
            <input
              type="range"
              min={1}
              max={10}
              value={importance}
              onChange={e => setImportance(+e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>Urgency: {urgency}</label>
            <input
              type="range"
              min={1}
              max={10}
              value={urgency}
              onChange={e => setUrgency(+e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <label style={label}>Is this task linked to a project or area?</label>
        <div style={row}>
          <label style={{ marginRight: '1rem' }}>
            <input
              type="checkbox"
              checked={!!projectId}
              onChange={() => {
                setProjectId(projectId ? '' : projects[0]?.project_id || '');
                setAreaId('');
              }}
            /> Project
          </label>
          <label>
            <input
              type="checkbox"
              checked={!!areaId}
              onChange={() => {
                setAreaId(areaId ? '' : areas[0]?.area_id || '');
                setProjectId('');
              }}
            /> Area
          </label>
        </div>

        {projectId && (
          <>
            <label style={label}>Select Project</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} style={input}>
              {projects.map(p => (
                <option key={p.project_id} value={p.project_id}>{p.name}</option>
              ))}
            </select>
          </>
        )}

        {areaId && (
          <>
            <label style={label}>Select Area</label>
            <select value={areaId} onChange={e => setAreaId(e.target.value)} style={input}>
              {areas.map(a => (
                <option key={a.area_id} value={a.area_id}>{a.name}</option>
              ))}
            </select>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '1rem' }}>
          <button onClick={onClose} style={buttonCancel}>Cancel</button>
          <button onClick={handleSubmit} style={buttonSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-CA');
}

const overlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modal = {
  background: '#fff',
  padding: '2rem',
  borderRadius: '8px',
  width: '500px',
  maxHeight: '90vh',
  overflowY: 'auto'
};

const label = {
  fontWeight: 'bold',
  marginTop: '1rem',
  display: 'block'
};

const input = {
  width: '100%',
  padding: '0.5rem',
  borderRadius: '4px',
  border: '1px solid #ccc',
  marginTop: '0.25rem'
};

const textarea = {
  ...input,
  height: '100px',
  resize: 'vertical'
};

const row = {
  display: 'flex',
  marginTop: '1rem',
  alignItems: 'center'
};

const buttonCancel = {
  padding: '0.5rem 1rem',
  background: '#ccc',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

const buttonSave = {
  padding: '0.5rem 1rem',
  background: '#4caf50',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};
