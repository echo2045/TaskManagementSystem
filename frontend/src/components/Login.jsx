// frontend/src/components/Login.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';

export default function Login() {
  const [identifier, setIdentifier] = useState(''); // username or email
  const [password, setPassword]     = useState('');
  const [msg, setMsg]               = useState('');
  const { login }                   = useContext(AuthContext);

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    try {
      await login(identifier, password);
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={{
      display:        'flex',
      justifyContent: 'center',
      alignItems:     'center',
      height:         '100vh',
      background:     '#FAFAFA'
    }}>
      <form onSubmit={handleSubmit} style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           '1rem',
        padding:       '2rem',
        background:    '#fff',
        borderRadius:  '8px',
        boxShadow:     '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ textAlign:'center' }}>Log In</h2>
        {msg && (
          <p style={{ color:'red', textAlign:'center' }}>
            {msg}
          </p>
        )}
        <label>
          Username or Email
          <input
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            required
            style={{ width:'100%', padding:'0.5rem' }}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width:'100%', padding:'0.5rem' }}
          />
        </label>
        <button type="submit" style={{
          padding:     '0.75rem',
          fontWeight:  'bold',
          cursor:      'pointer'
        }}>
          Sign In
        </button>
      </form>
    </div>
  );
}
