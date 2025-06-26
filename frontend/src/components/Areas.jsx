// src/components/Areas.jsx
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import {
  createArea,
  getAllAreas,
  markAreaComplete,
  deleteArea
} from '../api/areas';
import AreaDashboard from './AreaDashboard';

export default function Areas() {
  const { user } = useContext(AuthContext);
  const [areas, setAreas] = useState([]);
  const [newName, setNewName] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [showActive, setShowActive] = useState(true);

  const fetch = async () => {
    try {
      const data = await getAllAreas();
      setAreas(data);
    } catch (err) {
      console.error('Error loading areas', err);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleCreate = async e => {
    e.preventDefault();
    setMessage('');
    try {
      await createArea(newName, user.user_id);
      setNewName('');
      setMessage('Area created');
      fetch();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error');
    }
  };

  const handleToggle = async (id, isCompleted) => {
    try {
      await markAreaComplete(id, !isCompleted);
      fetch();
    } catch (err) {
      console.error('Error updating area', err);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this area and its tasks?')) return;
    try {
      await deleteArea(id);
      fetch();
    } catch (err) {
      console.error('Error deleting area', err);
    }
  };

  if (user.role !== 'manager') {
    return <AreaDashboard />;
  }

  const filtered = areas
    .filter(a => (showActive ? !a.is_completed : a.is_completed))
    .filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h1 style={{ fontSize: '2rem', margin: '0' }}>Areas</h1>

      {/* Section 1: Create */}
      <section>
        <h2 style={{ marginTop: '0', marginBottom: '0.5rem' }}>Add Area</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem' }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
            placeholder="New area name"
            style={{ padding: '0.5rem', flex: 1 }}
          />
          <button type="submit">Create</button>
        </form>
        {message && <p>{message}</p>}
      </section>

      {/* Section 2: Manage List */}
      <section>
        <h2>Manage Areas</h2>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
              Search Area Tasks
            </label>
            <input
              placeholder="Search areas"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '0.5rem', width: '100%' }}
            />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div
              onClick={() => setShowActive(true)}
              style={{
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                borderBottom: showActive ? '2px solid black' : '2px solid transparent',
                fontWeight: showActive ? 'bold' : 'normal'
              }}
            >
              Active
            </div>
            <div
              onClick={() => setShowActive(false)}
              style={{
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                borderBottom: !showActive ? '2px solid black' : '2px solid transparent',
                fontWeight: !showActive ? 'bold' : 'normal'
              }}
            >
              Archive
            </div>
          </div>
        </div>

        {/* Area List */}
        {filtered.map(a => (
          <div
            key={a.area_id}
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
                checked={a.is_completed}
                onChange={() => handleToggle(a.area_id, a.is_completed)}
              />
              <span style={{ fontWeight: 'bold' }}>{a.name}</span>
              <span style={{ color: '#555', fontStyle: 'italic' }}>
                ({a.created_by_name || ''})
              </span>
            </div>
            <button onClick={() => handleDelete(a.area_id)} style={{ fontSize: '1.2rem' }}>
              🗑
            </button>
          </div>
        ))}
      </section>

      {/* Section 3: Dashboard */}
      <section>
        <AreaDashboard />
      </section>
    </div>
  );
}
