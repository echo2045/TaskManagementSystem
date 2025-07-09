import React, { useState, useEffect, useContext } from 'react';
import { FaQuestionCircle } from 'react-icons/fa';
import { AuthContext } from '../AuthContext';
import { createTask } from '../api/tasks';
import { getAllProjects } from '../api/projects';
import { getAllAreas } from '../api/areas';
import { updateTaskRequest } from '../api/requests';
import EisenhowerHelpModal from './EisenhowerHelpModal';
import { useTaskRequestFlowManager } from '../utils/taskRequestFlowManager.jsx';

export default function AcceptTaskRequestModal({ visible, onClose, request }) {
  const { user } = useContext(AuthContext);
  const { startFlow, DelegateModalComponent, showDelegateModal } = useTaskRequestFlowManager(onClose);
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    start_date: '',
    importance: 1, // Default for delegate task
    urgency: 6,    // Default for delegate task
    project_id: null,
    area_id: null,
    time_estimate: ''
  });
  const [projects, setProjects] = useState([]);
  const [areas, setAreas] = useState([]);
  const [taskType, setTaskType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (visible && request) {
      const today = new Date().toLocaleDateString('en-CA');
      setForm({
        title: request.title || '',
        description: '',
        deadline: '',
        start_date: today,
        importance: 1,
        urgency: 6,
        project_id: null,
        area_id: null,
        time_estimate: ''
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
  }, [visible, request, user]);

  if (!visible) return null;

  const toUtcIsoDate = (dateStr) => {
    if (!dateStr) return null;
    const localDate = new Date(dateStr);
    localDate.setUTCHours(0, 0, 0, 0);
    return localDate.toISOString();
  };

  const handleSubmit = async () => {
    console.log('[AcceptTaskRequestModal handleSubmit] - Start');
    setLoading(true);
    await startFlow({ formData: form, request, user, requesterId: request.requester_id });
    // onClose(); // This modal will close when DelegateModal closes
    console.log('[AcceptTaskRequestModal handleSubmit] - After startFlow');
  };

  const handleDelegateModalClose = () => {
    setShowDelegateModal(false);
    onClose(); // Now close the AcceptTaskRequestModal
  };

  const handleTypeChange = (type) => {
    setTaskType(prev => prev === type ? null : type);
    setForm(prev => ({
      ...prev,
      project_id: type === 'project' ? prev.project_id : null,
      area_id: type === 'area' ? prev.area_id : null
    }));
  };

  const renderTypeSelector = () => {
    if (user.role === 'manager' || user.role === 'team_lead') {
      return (
        <>
          <label>Is this task part of a project or area?</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label>
              <input type="checkbox" checked={taskType === 'project'} onChange={() => handleTypeChange('project')} />
              Project
            </label>
            <label>
              <input type="checkbox" checked={taskType === 'area'} onChange={() => handleTypeChange('area')} />
              Area
            </label>
          </div>
        </>
      );
    } else if (user.role === 'team_lead') {
      return (
        <>
          <label>Is this task part of a project?</label>
          <label>
            <input type="checkbox" checked={taskType === 'project'} onChange={() => handleTypeChange('project')} />
            Yes (Project)
          </label>
        </>
      );
    } else if (user.role === 'hr') {
      return (
        <>
          <label>Is this task part of an area?</label>
          <label>
            <input type="checkbox" checked={taskType === 'area'} onChange={() => handleTypeChange('area')} />
            Yes (Area)
          </label>
        </>
      );
    }
    return null;
  };

  const isSubmitDisabled = 
    !form.title.trim() || 
    !form.deadline || 
    !form.time_estimate || 
    (taskType === 'project' && !form.project_id) || 
    (taskType === 'area' && !form.area_id);

  return (
    <div style={overlay}>
      <div style={modal}>
        <button onClick={onClose} style={closeBtn} aria-label="Close">×</button>
        <h2>Accept and Create Task</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>

          <div>
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
            />
          </div>

          <div>
            <label>Time Estimate (hours)</label>
            <input
              type="number"
              value={form.time_estimate}
              onChange={(e) => setForm({ ...form, time_estimate: e.target.value })}
              placeholder="e.g., 4.5"
              style={{ width: '100%', padding: '0.5rem' }}
              required
            />
          </div>

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

          <div>
            <label>Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>

          {renderTypeSelector()}

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
                  <option key={p.project_id} value={p.project_id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

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
                  <option key={a.area_id} value={a.area_id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Importance: {form.importance}</label>
              <FaQuestionCircle onClick={() => setShowHelp(true)} title="What do these scores mean?" style={{ color: '#555', cursor: 'pointer' }} />
            </div>
            <input
              type="range"
              min={1} max={5}
              value={form.importance}
              onChange={(e) => setForm({ ...form, importance: +e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label>Urgency: {form.urgency}</label>
            <input
              type="range"
              min={6} max={10}
              value={form.urgency}
              onChange={(e) => setForm({ ...form, urgency: +e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

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

        <EisenhowerHelpModal visible={showHelp} onClose={() => setShowHelp(false)} />

        {DelegateModalComponent}
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modal = {
  position: 'relative',
  background: '#cccccc',
  padding: '2.5rem',
  borderRadius: '10px',
  width: '500px',
  boxSizing: 'border-sizing'
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