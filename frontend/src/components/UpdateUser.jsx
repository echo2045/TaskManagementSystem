// src/components/UpdateUser.jsx
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { getUsers, updateUserById } from '../api/users';

export default function UpdateUser() {
  const { user } = useContext(AuthContext);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userData, setUserData] = useState({});
  const [search, setSearch] = useState('');
  const isManagerOrHR = user.role === 'manager' || user.role === 'hr';
  const isSelfUpdate = !isManagerOrHR;

  useEffect(() => {
    if (isManagerOrHR) {
      getUsers().then(setAllUsers);
    } else {
      setSelectedUser(user);
      setUserData({
        full_name: user.full_name || '',
        username: user.username || '',
        email: user.email || '',
        role: user.role || '',
      });
    }
  }, [user, isManagerOrHR]);

  const handleSelect = (u) => {
    setSelectedUser(u);
    setUserData({
      full_name: u.full_name || '',
      username: u.username || '',
      email: u.email || '',
      role: u.role || '',
    });
  };

  const handleSubmit = async () => {
    try {
      await updateUserById(selectedUser.user_id, userData);
      alert('User updated successfully');
    } catch (err) {
      console.error('Update failed:', err);
      alert('Update failed. Check console for details.');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      {/* LEFT: User Search List */}
      {isManagerOrHR && (
        <div style={{ width: '250px' }}>
          <input
            type="text"
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {allUsers
              .filter((u) =>
                u.full_name.toLowerCase().includes(search.toLowerCase()) ||
                u.username.toLowerCase().includes(search.toLowerCase())
              )
              .map((u) => (
                <div
                  key={u.user_id}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: selectedUser?.user_id === u.user_id ? '#ddd' : '#f5f5f5',
                  }}
                  onClick={() => handleSelect(u)}
                >
                  {u.full_name}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* RIGHT: Update Form */}
      {selectedUser && (
        <div style={{ flex: 1 }}>
          <h2>Update User Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="full_name">Full Name</label>
              <input
                id="full_name"
                type="text"
                value={userData.full_name}
                onChange={(e) =>
                  setUserData({ ...userData, full_name: e.target.value })
                }
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>

            <div>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={userData.username}
                onChange={(e) =>
                  setUserData({ ...userData, username: e.target.value })
                }
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>

            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>

            {isManagerOrHR && (
              <div>
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={userData.role}
                  onChange={(e) =>
                    setUserData({ ...userData, role: e.target.value })
                  }
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR</option>
                </select>
              </div>
            )}

            <button
              onClick={handleSubmit}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                background: '#333',
                color: '#fff',
                cursor: 'pointer',
                borderRadius: '4px',
                marginTop: '1rem',
              }}
            >
              Update
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
