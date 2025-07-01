// src/components/PeopleList.jsx
import React, { useEffect, useState } from 'react';
import { getUsers } from '../api/users';
import UserStatus from './UserStatus';

export default function PeopleList({
  currentUserId,
  selectedUserId,
  onSelectUser
}) {
  const [users, setUsers]   = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getUsers()
      .then(us => {
        // never show yourself
        setUsers(us.filter(u => u.user_id !== currentUserId));
      })
      .catch(console.error);
  }, [currentUserId]);

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      width:         '200px',
      display:       'flex',
      flexDirection: 'column',
      background:    '#2E2E2E',
      boxSizing:     'border-box',
      height:        '100%'
    }}>
      <div style={{
        padding:   '1rem',
        color:     '#fff',
        textAlign: 'center',
        fontSize:  '1.25rem'
      }}>
        People
      </div>
      <div style={{
        background: '#3B3B3B',
        padding:    '0.5rem',
        boxSizing:  'border-box'
      }}>
        <input
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width:        '100%',
            padding:      '0.5rem',
            borderRadius: '4px',
            border:       '1px solid #ccc',
            boxSizing:    'border-box'
          }}
        />
      </div>
      <div style={{
        flex:      1,
        overflowY: 'auto',
        padding:   '0.5rem',
        boxSizing: 'border-box'
      }}>
        {filtered.map(u => (
          <div
            key={u.user_id}
            onClick={() => onSelectUser(u)}
            style={{
              padding:      '0.5rem',
              marginBottom: '0.5rem',
              borderRadius: '4px',
              background:   u.user_id === selectedUserId ? '#888888' : '#4F4F4F',
              color:        u.user_id === selectedUserId ? '#000' : '#fff',
              cursor:       'pointer'
            }}
          >
            {u.full_name}
            <UserStatus userId={u.user_id} />
          </div>
        ))}
      </div>
    </div>
);
}
