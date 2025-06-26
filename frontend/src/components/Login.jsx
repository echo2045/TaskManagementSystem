// frontend/src/components/Login.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { User, Lock } from 'lucide-react';

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

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#f0f2f5',
      fontFamily: 'Arial, sans-serif',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      padding: '3rem',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '400px',
    },
    title: {
      textAlign: 'center',
      color: '#333',
      marginBottom: '1rem',
      fontSize: '2rem',
    },
    errorMsg: {
      color: '#d93025',
      textAlign: 'center',
      marginBottom: '0.5rem',
    },
    inputContainer: {
      position: 'relative',
    },
    input: {
      width: '100%',
      padding: '0.75rem 2.5rem',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '1rem',
      boxSizing: 'border-box',
    },
    icon: {
      position: 'absolute',
      left: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#888',
    },
    button: {
      padding: '0.75rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      background: '#007bff',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      transition: 'background 0.3s',
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Welcome Back</h2>
        {msg && (
          <p style={styles.errorMsg}>
            {msg}
          </p>
        )}
        <div style={styles.inputContainer}>
          <User size={20} style={styles.icon} />
          <input
            placeholder="Username or Email"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.inputContainer}>
          <Lock size={20} style={styles.icon} />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <button 
          type="submit" 
          style={styles.button}
          onMouseOver={e => e.currentTarget.style.background = '#0056b3'}
          onMouseOut={e => e.currentTarget.style.background = '#007bff'}
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
