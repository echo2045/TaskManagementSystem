import React from 'react';

export default function Notifications() {
  return (
    <div style={{
      height: '50%',
      overflowY: 'auto',
      background: '#FFE0B2',  // light orange
      color: '#000',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      padding: '1rem',
      boxSizing: 'border-box'
    }}>
      <h3 style={{
        margin: '0 0 0.5rem',
        textAlign: 'center',
        fontSize: '1.25rem'
      }}>Notifications</h3>
      <div>
        <p>No new notifications.</p>
      </div>
    </div>
  );
}
