// src/components/ChangePassword.jsx
import React, { useState } from 'react';
import { changePassword } from '../api/users';

export default function ChangePassword({ userId }) {
  const [oldPw, setOldPw]         = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [message, setMessage]     = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    if (newPw !== confirmPw) {
      setMessage('New passwords do not match.');
      return;
    }
    try {
      await changePassword(userId, oldPw, newPw);
      setMessage('Password changed successfully.');
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to change password.';
      setMessage(errMsg);
    }
  };

  return (
    <div style={{
      display:        'flex',
      justifyContent: 'center',
      alignItems:     'center',
      height:         '100%',
      background:     '#FFFFFF',
      padding:        '2rem',
      boxSizing:      'border-box'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Change Password</h2>
        <form onSubmit={handleSubmit} style={{
          display:       'flex',
          flexDirection: 'column',
          gap:           '1rem'
        }}>
          <div>
            <label
              htmlFor="oldPassword"
              style={{ display: 'block', marginBottom: '0.5rem', color: '#000' }}
            >
              Enter old password:
            </label>
            <input
              id="oldPassword"
              type="password"
              value={oldPw}
              onChange={e => setOldPw(e.target.value)}
              required
              style={{
                width:     '100%',
                padding:   '0.5rem',
                background:'#cccccc',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label
              htmlFor="newPassword"
              style={{ display: 'block', marginBottom: '0.5rem', color: '#000' }}
            >
              Enter new password:
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              required
              style={{
                width:     '100%',
                padding:   '0.5rem',
                background:'#cccccc',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              style={{ display: 'block', marginBottom: '0.5rem', color: '#000' }}
            >
              Verify password:
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              required
              style={{
                width:     '100%',
                padding:   '0.5rem',
                background:'#cccccc',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <button type="submit" style={{
            padding:    '0.75rem',
            fontWeight: 'bold',
            cursor:     'pointer'
          }}>
            Change Password
          </button>
        </form>
        {message && (
          <p style={{
            marginTop: '1rem',
            color:     message.includes('successfully') ? 'green' : 'red',
            textAlign: 'center'
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
