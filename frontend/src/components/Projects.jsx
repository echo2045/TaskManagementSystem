// src/components/Projects.jsx
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import {
  createProject,
  getAllProjects,
  markProjectComplete,
  deleteProject
} from '../api/projects';
import ProjectDashboard from './ProjectDashboard';

export default function Projects() {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [newName, setNewName] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [showActive, setShowActive] = useState(true);

  const fetch = async () => {
    try {
      const data = await getAllProjects();
      setProjects(data);
    } catch (err) {
      console.error('Error loading projects', err);
    }
  };

  useEffect(() => {
    if (user.role === 'manager') {
      fetch();
    }
  }, [user]);

  const handleCreate = async e => {
    e.preventDefault();
    setMessage('');
    try {
      await createProject(newName, user.user_id);
      setNewName('');
      setMessage('Project created');
      fetch();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error');
    }
  };

  const handleToggle = async (id, isCompleted) => {
    try {
      await markProjectComplete(id, !isCompleted);
      fetch();
    } catch (err) {
      console.error('Error updating project', err);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this project and its tasks?')) return;
    try {
      await deleteProject(id);
      fetch();
    } catch (err) {
      console.error('Error deleting project', err);
    }
  };

  if (user.role !== 'manager') {
    return <ProjectDashboard viewingOwnOnly />;
  }

  const filtered = projects
    .filter(p => showActive ? !p.is_completed : p.is_completed)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Section 1: Create */}
      <section>
        <h2>Add Project</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem' }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
            placeholder="New project name"
            style={{ padding: '0.5rem', flex: 1 }}
          />
          <button type="submit">Create</button>
        </form>
        {message && <p>{message}</p>}
      </section>

      {/* Section 2: Manage List */}
      <section>
        <h2>Manage Projects</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <input
            placeholder="Search projects"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '0.5rem', flex: 2 }}
          />
          <button onClick={() => setShowActive(true)} disabled={showActive}>
            Active
          </button>
          <button onClick={() => setShowActive(false)} disabled={!showActive}>
            Archive
          </button>
        </div>

        {filtered.map(p => (
          <div
            key={p.project_id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              border: '1px solid #ccc',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              marginBottom: '0.5rem',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
              <input
                type="checkbox"
                checked={p.is_completed}
                onChange={() => handleToggle(p.project_id, p.is_completed)}
              />
              <span>{p.name}</span>
              {p.created_by_name && (
                <span style={{ fontSize: '0.85rem', color: '#555' }}>
                  (Created by {p.created_by_name})
                </span>
              )}
            </div>
            <button
              onClick={() => handleDelete(p.project_id)}
              style={{ fontSize: '1.2rem' }}
            >
              🗑
            </button>
          </div>
        ))}
      </section>

      {/* Section 3: Dashboard */}
      <section>
        <ProjectDashboard viewingOwnOnly />
      </section>
    </div>
  );
}
