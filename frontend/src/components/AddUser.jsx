// src/components/AddUser.jsx
import React, { useState } from 'react';
import { createUser }      from '../api/users';

export default function AddUser() {
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    email: '',
    role: 'member',
    password: '',
    confirm: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    const { password, confirm } = form;
    if (password !== confirm) {
      setMessage('Passwords do not match.');
      return;
    }
    try {
      // send exactly the fields your backend expects
      await createUser({
        username:  form.username,
        full_name: form.full_name,
        email:     form.email,
        role:      form.role,
        password:  form.password
      });
      setMessage('User created successfully.');
      setForm({
        username:'', full_name:'', email:'', role:'member',
        password:'', confirm:''
      });
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || 'Failed to create user.');
    }
  };

  return (
    <div style={{
      flex:1, overflowY:'auto',
      background:'#FFFFFF', padding:'2rem'
    }}>
      <h2>Add User</h2>
      <form onSubmit={handleSubmit} style={{
        display:'flex', flexDirection:'column',
        gap:'1rem', maxWidth:'400px'
      }}>
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
            name="email"
            type="email"
            value={form.email}
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
            style={{ width:'100%', padding:'0.5rem' }}
          >
            <option value="member">Member</option>
            <option value="team_lead">Team Lead</option>
            <option value="manager">Manager</option>
            <option value="hr">HR</option>
          </select>
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            style={{ width:'100%', padding:'0.5rem' }}
          />
        </label>
        <label>
          Confirm Password
          <input
            name="confirm"
            type="password"
            value={form.confirm}
            onChange={handleChange}
            required
            style={{ width:'100%', padding:'0.5rem' }}
          />
        </label>
        <button type="submit" style={{ padding:'0.75rem', fontWeight:'bold' }}>
          Create User
        </button>
      </form>
      {message && (
        <p style={{
          marginTop:'1rem',
          color: message.includes('successfully') ? 'green' : 'red'
        }}>
          {message}
        </p>
      )}
    </div>
  );
}
