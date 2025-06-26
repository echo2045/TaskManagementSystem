// src/components/EditTaskModal.jsx
import React, { useEffect, useState } from 'react';
import { updateTask } from '../api/tasks';
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
  const [projects, setProjects] = useState([]);
  const [areas, setAreas] = useState([]);
  const [isProjectTask, setIsProjectTask] = useState(!!task.project_id);
  const [isAreaTask, setIsAreaTask] = useState(!!task.area_id);

  useEffect(() => {
    getAllProjects(true).then(setProjects).catch(console.error);
    getAllAreas(true).then(setAreas).catch(console.error);
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) return alert('Title is required');
    if (new Date(startDate) > new Date(deadline)) {
      return alert('Start date must be before deadline');
    }

    try {
      await updateTask(task.task_id, {
        title,
        description,
        start_date: toUtcIsoDate(startDate),
        deadline: deadline + 'T00:00:00',
        importance,
        urgency,
        project_id: isProjectTask ? projectId : null,
        area_id: isAreaTask ? areaId : null
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
            <label style={label}>Importance</label>
            <input type="range" min={1} max={10} value={importance} onChange={e => setImportance(+e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>Urgency</label>
            <input type="range" min={1} max={10} value={urgency} onChange={e => setUrgency(+e.target.value)} style={{ width: '100%' }} />
          </div>
        </div>

        <div style={row}>
          <label style={{ ...label, marginRight: '1rem' }}>
            <input type="checkbox" checked={isProjectTask} onChange={() => {
              setIsProjectTask(true);
              setIsAreaTask(false);
              setAreaId('');
            }} />
            Project Task
          </label>
          <label style={label}>
            <input type="checkbox" checked={isAreaTask} onChange={() => {
              setIsAreaTask(true);
              setIsProjectTask(false);
              setProjectId('');
            }} />
            Area Task
          </label>
        </div>

        {isProjectTask && (
          <>
            <label style={label}>Project</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} style={input}>
              <option value="">— Select Project —</option>
              {projects.map(p => (
                <option key={p.project_id} value={p.project_id}>{p.name}</option>
              ))}
            </select>
          </>
        )}

        {isAreaTask && (
          <>
            <label style={label}>Area</label>
            <select value={areaId} onChange={e => setAreaId(e.target.value)} style={input}>
              <option value="">— Select Area —</option>
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

function toUtcIsoDate(dateString) {
  const localDate = new Date(dateString + 'T00:00:00');
  return new Date(Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    0, 0, 0
  )).toISOString();
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
