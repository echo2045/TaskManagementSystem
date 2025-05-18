// src/components/PeopleList.jsx
import React, { useEffect, useState } from 'react';
import { getUsers } from '../api/users';   // ← was './api/users'

export default function PeopleList({ selectedUserId, onSelectUser }) {
  const [users, setUsers]   = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getUsers().then(setUsers).catch(console.error);
  }, []);

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      width: '250px',
      background: '#2E2E2E',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      height: '100vh'
    }}>
      <div style={{
        background: '#2E2E2E',
        color: '#fff',
        padding: '1rem',
        textAlign: 'center',
        fontSize: '1.25rem'
      }}>
        People
      </div>
      <div style={{
        background: '#3B3B3B',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        <input
          type="text"
          placeholder="Search People"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #cccccc',
            marginBottom: '1rem',
            background: '#cccccc',
            color: '#000'
          }}
        />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(user => (
            <div
              key={user.user_id}
              onClick={() => onSelectUser(user)}
              style={{
                background: user.user_id === selectedUserId ? '#dddddd' : '#4F4F4F',
                border: '1px solid #555555',
                color: user.user_id === selectedUserId ? '#000' : '#fff',
                padding: '0.5rem',
                borderRadius: '4px',
                marginBottom: '0.5rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <strong>{user.full_name}</strong><br />
              <small>{user.email}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
