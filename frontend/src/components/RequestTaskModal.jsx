import React, { useState, useEffect } from 'react';
import { getSupervisors, createTaskRequest } from '../api/requests';

export default function RequestTaskModal({ isOpen, onClose }) {
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (isOpen) {
      getSupervisors().then(setSupervisors).catch(console.error);
      setSelectedSupervisor('');
      setTitle('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTaskRequest({ supervisor_id: selectedSupervisor, title });
      onClose();
    } catch (err) {
      console.error('Error creating task request:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={overlay}>
      <div style={modal}>
        <button onClick={onClose} style={closeBtn} aria-label="Close">×</button>
        <h2>Request a Task</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>Supervisor</label>
            <select
              value={selectedSupervisor}
              onChange={(e) => setSelectedSupervisor(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="" disabled>Select a supervisor</option>
              {supervisors.map((supervisor) => (
                <option key={supervisor.user_id} value={supervisor.user_id}>
                  {supervisor.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ marginRight: '1rem' }}>Cancel</button>
            <button type="submit">Send Request</button>
          </div>
        </form>
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