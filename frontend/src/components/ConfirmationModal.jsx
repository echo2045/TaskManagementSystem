// src/components/ConfirmationModal.jsx
import React from 'react';

export default function ConfirmationModal({ visible, onClose, onConfirm, title, message }) {
  if (!visible) return null;

  return (
    <div style={overlay}>
      <div style={modal}>
        <button onClick={onClose} style={closeBtn} aria-label="Close">×</button>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>{title || 'Confirm Action'}</h2>
        <p style={{ fontSize: '1rem', marginBottom: '2rem', lineHeight: '1.6' }}>
          {message || 'Are you sure you want to proceed?'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button onClick={onClose} style={cancelButton}>Cancel</button>
          <button onClick={onConfirm} style={confirmButton}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modal = {
  background: '#fff',
  padding: '2.5rem',
  borderRadius: '12px',
  width: '500px',
  maxWidth: '95%',
  boxSizing: 'border-box',
  position: 'relative'
};

const closeBtn = {
  position: 'absolute',
  top: '0.75rem',
  right: '0.75rem',
  background: 'transparent',
  border: 'none',
  fontSize: '1.8rem',
  cursor: 'pointer'
};

const button = {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 'bold'
};

const cancelButton = {
    ...button,
    background: '#f0f0f0',
    color: '#333'
};

const confirmButton = {
    ...button,
    background: '#dc3545',
    color: '#fff'
};