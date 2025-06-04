// src/components/CreateTaskModal.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { createTask } from '../api/tasks';
import { getAllProjects } from '../api/projects';
import { getAllAreas } from '../api/areas';

export default function CreateTaskModal({ visible, onClose, ownerId, initialTitle = '' }) {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    title: initialTitle,
    description: '',
    deadline: '',
    importance: 3,
    urgency: 3,
    project_id: null,
    area_id: null
  });
  const [projects, setProjects] = useState([]);
  const [areas, setAreas] = useState([]);
  const [taskType, setTaskType] = useState(null); // 'project', 'area', or null
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm({
        title: initialTitle,
        description: '',
        deadline: '',
        importance: 3,
        urgency: 3,
        project_id: null,
        area_id: null
      });
      setTaskType(null);

      if (user.role === 'manager' || user.role === 'team_lead') {
        getAllProjects().then(data => {
          const active = data.filter(p => !p.is_completed);
          setProjects(active);
        });
      }

      if (user.role === 'manager' || user.role === 'hr') {
        getAllAreas(true).then(setAreas);
      }
    }
  }, [visible, initialTitle, user]);

  if (!visible) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await createTask({ ...form, owner_id: ownerId });
      onClose();
    } catch (err) {
      console.error('CreateTask error', err);
      alert('Could not create task');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type) => {
    setTaskType(prev => prev === type ? null : type); // toggle behavior
    setForm(prev => ({
      ...prev,
      project_id: type === 'project' ? prev.project_id : null,
      area_id: type === 'area' ? prev.area_id : null
    }));
  };

  const renderTypeSelector = () => {
    if (user.role === 'manager') {
      return (
        <>
          <label>Is this task part of a project or area?</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label>
              <input
                type="checkbox"
                checked={taskType === 'project'}
                onChange={() => handleTypeChange('project')}
              />
              Project
            </label>
            <label>
              <input
                type="checkbox"
                checked={taskType === 'area'}
                onChange={() => handleTypeChange('area')}
              />
              Area
            </label>
          </div>
        </>
      );
    } else if (user.role === 'team_lead') {
      return (
        <>
          <label>Is this task part of a project?</label>
          <div>
            <label>
              <input
                type="checkbox"
                checked={taskType === 'project'}
                onChange={() => handleTypeChange('project')}
              />
              Yes (Project)
            </label>
          </div>
        </>
      );
    } else if (user.role === 'hr') {
      return (
        <>
          <label>Is this task part of an area?</label>
          <div>
            <label>
              <input
                type="checkbox"
                checked={taskType === 'area'}
                onChange={() => handleTypeChange('area')}
              />
              Yes (Area)
            </label>
          </div>
        </>
      );
    }
    return null;
  };

  const isSubmitDisabled =
    !form.deadline ||
    (taskType === 'project' && !form.project_id) ||
    (taskType === 'area' && !form.area_id);

  return (
    <div style={overlay}>
      <div style={modal}>
        <button onClick={onClose} style={closeBtn} aria-label="Close">×</button>
        <h2>Create Task</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Title - Readonly */}
          <div>
            <label>Title</label>
            <input
              type="text"
              value={form.title}
              readOnly
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#eee',
                cursor: 'not-allowed'
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>

          {/* Deadline */}
          <div>
            <label>Deadline</label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>

          {/* Role-based Type Selector */}
          {renderTypeSelector()}

          {/* Project Dropdown */}
          {taskType === 'project' && (
            <div>
              <label>Select Project</label>
              <select
                value={form.project_id || ''}
                onChange={(e) => setForm({ ...form, project_id: Number(e.target.value) })}
                required
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="" disabled>Select a project</option>
                {projects.map(p => (
                  <option key={p.project_id} value={p.project_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Area Dropdown */}
          {taskType === 'area' && (
            <div>
              <label>Select Area</label>
              <select
                value={form.area_id || ''}
                onChange={(e) => setForm({ ...form, area_id: Number(e.target.value) })}
                required
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="" disabled>Select an area</option>
                {areas.map(a => (
                  <option key={a.area_id} value={a.area_id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Priority Sliders */}
          <div>
            <label>Importance: {form.importance}</label>
            <input
              type="range"
              min={1} max={10}
              value={form.importance}
              onChange={(e) => setForm({ ...form, importance: +e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label>Urgency: {form.urgency}</label>
            <input
              type="range"
              min={1} max={10}
              value={form.urgency}
              onChange={(e) => setForm({ ...form, urgency: +e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled || loading}
            style={{
              alignSelf: 'flex-end',
              padding: '0.5rem 1rem',
              background: isSubmitDisabled ? '#aaa' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
              opacity: isSubmitDisabled ? 0.6 : 1
            }}
          >
            {loading ? 'Saving…' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
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
  position: 'relative',
  background: '#cccccc',
  padding: '2rem',
  borderRadius: '8px',
  width: '400px',
  boxSizing: 'border-box'
};

const closeBtn = {
  position: 'absolute',
  top: '0.5rem',
  right: '0.5rem',
  border: 'none',
  background: 'transparent',
  fontSize: '1.5rem',
  cursor: 'pointer'
};
