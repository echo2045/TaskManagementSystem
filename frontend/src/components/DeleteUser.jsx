// src/components/DeleteUser.jsx
import React, { useEffect, useState } from 'react';
import { getUsers, deleteUserById } from '../api/users';

export default function DeleteUser({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getUsers().then(setUsers).catch(console.error);
  }, []);

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (userId, fullName) => {
    const confirmed = window.confirm(`Are you sure you want to delete user "${fullName}"?`);
    if (!confirmed) return;

    try {
      await deleteUserById(userId);
      setUsers(users.filter(u => u.user_id !== userId));
      alert(`User "${fullName}" deleted successfully.`);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete user.');
    }
  };

  return (
    <div>
      <h2>Delete User</h2>
      <input
        type="text"
        placeholder="Search users by name or email..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '0.5rem',
          marginBottom: '1rem',
          borderRadius: '4px',
          border: '1px solid #ccc'
        }}
      />
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {filteredUsers.map(user => (
          <div key={user.user_id} style={{
            padding: '0.5rem',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{user.full_name} ({user.email})</span>
            <button
              onClick={() => handleDelete(user.user_id, user.full_name)}
              style={{
                padding: '0.3rem 0.8rem',
                backgroundColor: '#cc0000',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
