// src/components/EditProjectModal.jsx
import React, { useState } from 'react';
import { updateProject } from '../api/projects';

export default function EditProjectModal({ projectId, onClose }) {
  const [name, setName] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return alert('Project name required');
    try {
      await updateProject(projectId, name); // ✅ fixed: pass plain string
      onClose();
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update project name');
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2>Edit Project</h2>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter new project name"
          style={input}
        />
        <div style={buttonRow}>
          <button onClick={onClose} style={cancel}>Cancel</button>
          <button onClick={handleSubmit} style={save}>Save</button>
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

const modal = {
  background: '#f0f0f0',
  padding: '2rem',
  borderRadius: '8px',
  width: '400px',
  display: 'flex',
  flexDirection: 'column'
};

const input = {
  padding: '0.5rem',
  fontSize: '1rem',
  borderRadius: '4px',
  border: '1px solid #ccc',
  marginBottom: '1rem'
};

const buttonRow = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '1rem'
};

const cancel = {
  background: '#ccc',
  border: 'none',
  borderRadius: '4px',
  padding: '0.5rem 1rem',
  cursor: 'pointer'
};

const save = {
  background: '#4caf50',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  padding: '0.5rem 1rem',
  cursor: 'pointer'
};
