// src/components/SupervisorAllocation.jsx
import React, { useState, useEffect } from 'react';
import { getUsers, getSupervisees, assignSupervisee, unassignSupervisee } from '../api/users';

export default function SupervisorAllocation({ currentUser }) {
  const [supervisor, setSupervisor] = useState(currentUser);
  const [allUsers, setAllUsers]     = useState([]);
  const [team, setTeam]             = useState([]);
  const [search, setSearch]         = useState('');

  // Load all users and the selected supervisor's team
  useEffect(() => {
    getUsers().then(setAllUsers).catch(console.error);
    loadTeam(supervisor.user_id);
  }, [supervisor.user_id]);

  const loadTeam = supervisorId => {
    getSupervisees(supervisorId)
      .then(setTeam)
      .catch(console.error);
  };

  // Available candidates based on role rules
  const available = allUsers
    .filter(u => u.user_id !== supervisor.user_id)
    .filter(u => !team.some(m => m.user_id === u.user_id))
    .filter(u => {
      switch (supervisor.role) {
        case 'member':
          return false;
        case 'team_lead':
          return u.role === 'member';
        case 'manager':
          return true;
        case 'hr':
          return u.role !== 'hr';
        default:
          return false;
      }
    })
    .filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = u => {
    assignSupervisee(supervisor.user_id, u.user_id)
      .then(() => loadTeam(supervisor.user_id))
      .catch(console.error);
  };

  const handleRemove = u => {
    unassignSupervisee(supervisor.user_id, u.user_id)
      .then(() => loadTeam(supervisor.user_id))
      .catch(console.error);
  };

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      height:         '100%',
      background:     '#f5f5f5',
      padding:        '1rem',
      boxSizing:      'border-box',
      overflowY:      'auto'
    }}>
      <h2>Allocate Supervisor</h2>

      {/* Supervisor selector */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ marginRight: '0.5rem' }}>Supervisor:</label>
        <select
          value={supervisor.user_id}
          onChange={e => {
            const u = allUsers.find(x => x.user_id === +e.target.value);
            setSupervisor(u || currentUser);
          }}
          style={{ padding: '0.5rem', minWidth: '200px' }}
        >
          {allUsers.map(u => (
            <option key={u.user_id} value={u.user_id}>
              {u.full_name} ({u.role})
            </option>
          ))}
        </select>
      </div>

      {/* Team Members & Available side by side */}
      <div style={{ display: 'flex', gap: '2rem', flex: 1 }}>
        {/* Team Members */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <h3>Team Members</h3>
          {team.map(u => (
            <div
              key={u.user_id}
              style={{
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
                padding:        '0.5rem',
                border:         '1px solid #ddd',
                borderRadius:   '4px',
                marginBottom:   '0.5rem',
                background:     '#fff'
              }}
            >
              <span>{u.full_name} ({u.role})</span>
              <button
                onClick={() => handleRemove(u)}
                style={{
                  background:   'transparent',
                  border:       'none',
                  color:        '#E57373', // base red
                  fontSize:     '1.25rem',
                  cursor:       'pointer'
                }}
              >
                −
              </button>
            </div>
          ))}
        </div>

        {/* Available to Assign */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <h3>Available to Assign</h3>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
          />
          {available.map(u => (
            <div
              key={u.user_id}
              style={{
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
                padding:        '0.5rem',
                border:         '1px solid #ddd',
                borderRadius:   '4px',
                marginBottom:   '0.5rem',
                background:     '#fff'
              }}
            >
              <span>{u.full_name} ({u.role})</span>
              <button
                onClick={() => handleAdd(u)}
                style={{
                  background:   'transparent',
                  border:       'none',
                  color:        '#4caf50', // base green
                  fontSize:     '1.25rem',
                  cursor:       'pointer'
                }}
              >
                ＋
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
