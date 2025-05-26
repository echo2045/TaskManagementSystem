import React, { useContext, useState } from 'react';
import { AuthContext } from '../AuthContext';
import { createProject } from '../api/projects';

export default function Projects() {
  const { user } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  if (!user || user.role !== 'manager') {
    return <div style={{ padding: '2rem' }}>Access denied. Managers only.</div>;
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      await createProject(name, user.user_id);
      setMessage(`Project "${name}" created.`);
      setName('');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error creating project');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Projects</h2>
      <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
        <input
          type="text"
          placeholder="Project name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={{ padding: '0.5rem', marginRight: '1rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Add Project
        </button>
      </form>
      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
    </div>
  );
}
