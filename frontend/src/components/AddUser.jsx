// frontend/src/components/AddUser.jsx
import React, { useState } from 'react';
import { createUser } from '../api/users';

export default function AddUser() {
  const [form, setForm] = useState({
    username:   '',
    full_name:  '',
    email:      '',
    password:   '',
    role:       ''
  });
  const [message, setMessage] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      await createUser(form);
      setMessage('User created successfully.');
      setForm({ username:'', full_name:'', email:'', password:'', role:'' });
      // Optionally, reload so PeopleList picks up the new user:
      // window.location.reload();
    } catch (err) {
      console.error(err);
      setMessage('Error creating user. Check console for details.');
    }
  };

  return (
    <div style={{
      flex:          1,
      background:    '#FFFFFF',
      color:         '#000',
      padding:       '2rem',
      overflowY:     'auto'
    }}>
      <h2>Add User</h2>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem', maxWidth:'400px' }}>
        <label>
          Username
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            style={{ width:'100%', padding:'0.5rem' }}
          />
        </label>
        <label>
          Full Name
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            required
            style={{ width:'100%', padding:'0.5rem' }}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            style={{ width:'100%', padding:'0.5rem' }}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            style={{ width:'100%', padding:'0.5rem' }}
          />
        </label>
        <label>
          Role
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            required
            style={{ width:'100%', padding:'0.5rem' }}
          >
            <option value="">Select role</option>
            <option value="member">Member</option>
            <option value="team_lead">Team Lead</option>
            <option value="manager">Manager</option>
            <option value="hr">HR</option>
          </select>
        </label>
        <button type="submit" style={{ padding:'0.75rem', fontWeight:'bold' }}>
          Create User
        </button>
      </form>
      {message && (
        <p style={{ marginTop:'1rem', color: message.includes('Error') ? 'red' : 'green' }}>
          {message}
        </p>
      )}
    </div>
  );
}
