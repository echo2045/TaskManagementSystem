import React, { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { assignTask } from '../api/tasks';
import { interiorColors } from '../utils/getTaskColor';

export default function DelegateRequestedTaskModal({ visible, onClose, task, assigneeId }) {
  const { user } = useContext(AuthContext);
  const [importance, setImportance] = useState(1); // Default for delegate task
  const [urgency, setUrgency] = useState(6);    // Default for delegate task
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [assignedTimeEstimate, setAssignedTimeEstimate] = useState(task.time_estimate || '');
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const toUtcIsoDate = (dateStr) => {
    if (!dateStr) return null;
    const localDate = new Date(dateStr);
    localDate.setUTCHours(0, 0, 0, 0);
    return localDate.toISOString();
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const isoStartDate = toUtcIsoDate(startDate);
      await assignTask(
        task.task_id,
        assigneeId,
        importance,
        urgency,
        isoStartDate,
        assignedTimeEstimate ? Number(assignedTimeEstimate) : null
      );
      onClose();
    } catch (err) {
      console.error('DelegateRequestedTaskModal error', err);
      alert('Could not delegate task');
    } finally {
      setLoading(false);
    }
  };

  const modalBg = interiorColors['delegate'];

  return (
    <div style={overlay}>
      <div style={{ ...modalContent, background: modalBg }}>
        <button onClick={onClose} style={closeBtn}>×</button>
        <h2>Delegate Task: {task.title}</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>Importance: {importance}</label>
            <input
              type="range"
              min={1} max={5}
              value={importance}
              onChange={(e) => setImportance(+e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label>Urgency: {urgency}</label>
            <input
              type="range"
              min={6} max={10}
              value={urgency}
              onChange={(e) => setUrgency(+e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label>Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>

          <div>
            <label>Assigned Time Estimate (hours):</label>
            <input
              type="number"
              value={assignedTimeEstimate}
              onChange={(e) => setAssignedTimeEstimate(e.target.value)}
              placeholder="e.g., 4.5"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              alignSelf: 'flex-end',
              padding: '0.5rem 1rem',
              background: loading ? '#aaa' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Delegating…' : 'Delegate Task'}
          </button>
        </div>
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

const modalContent = {
  position: 'relative',
  padding: '1.5rem',
  borderRadius: '8px',
  width: '500px',
  maxHeight: '85vh',
  overflow: 'hidden',
  boxSizing: 'border-box',
  background: '#f0f0f0'
};

const closeBtn = {
  position: 'absolute',
  top: '0.5rem',
  right: '0.5rem',
  background: 'transparent',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer'
};