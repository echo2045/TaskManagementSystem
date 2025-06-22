// src/components/EisenhowerHelpModal.jsx
import React from 'react';

export default function EisenhowerHelpModal({ visible, onClose }) {
  if (!visible) return null;

  const cellStyle = (bg, border) => ({
    background: bg,
    border: `2px solid ${border}`,
    borderRadius: '10px',
    padding: '1.5rem',
    textAlign: 'center',
    flex: 1,
    fontSize: '1rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '0.75rem'
  });

  return (
    <div style={overlay}>
      <div style={modal}>
        <button onClick={onClose} style={closeBtn} aria-label="Close">×</button>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>Eisenhower Matrix</h2>

        <p style={{ fontSize: '1rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Tasks are categorized using <strong>Importance</strong> and <strong>Urgency</strong> scores.
          A score above <strong>5</strong> is considered <strong>high</strong>; 5 or below is considered <strong>low</strong>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={cellStyle('#FFEBEE', '#E57373')}>
            <div><strong>Do</strong></div>
            <div>Importance &gt; 5 and Urgency &gt; 5</div>
            <div style={{ fontSize: '0.95rem', color: '#333' }}>Handle these tasks immediately.</div>
          </div>
          <div style={cellStyle('#E8F5E9', '#81C784')}>
            <div><strong>Schedule</strong></div>
            <div>Importance &gt; 5 and Urgency ≤ 5</div>
            <div style={{ fontSize: '0.95rem', color: '#333' }}>Plan and do these later.</div>
          </div>
          <div style={cellStyle('#E1F5FE', '#64B5F6')}>
            <div><strong>Delegate</strong></div>
            <div>Importance ≤ 5 and Urgency &gt; 5</div>
            <div style={{ fontSize: '0.95rem', color: '#333' }}>Assign to someone else.</div>
          </div>
          <div style={cellStyle('#FFFDE7', '#FBC02D')}>
            <div><strong>Eliminate</strong></div>
            <div>Importance ≤ 5 and Urgency ≤ 5</div>
            <div style={{ fontSize: '0.95rem', color: '#333' }}>Consider removing or skipping.</div>
          </div>
        </div>

        <p style={{ fontSize: '0.95rem', color: '#444' }}>
          These categories help you focus your energy where it matters most. Task colors in the dashboard reflect these types.
        </p>
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
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
  width: '700px',
  maxWidth: '95%',
  maxHeight: '90vh',
  overflowY: 'auto',
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
