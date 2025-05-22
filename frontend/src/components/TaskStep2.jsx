// src/components/TaskStep2.jsx
import React from 'react';

function TaskStep2({
  values = {},
  onChange,
  onBack,
  onConfirm,
  loading
}) {
  const { importance = 3, urgency = 3 } = values;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <h2>Step 2: Priority</h2>

      {/* Importance slider */}
      <div>
        <label style={{ display:'block', marginBottom:'0.25rem' }}>
          Importance: {importance}
        </label>
        <input
          type="range"
          min={1} max={5}
          value={importance}
          onChange={e => onChange({ importance: +e.target.value })}
          style={{ width:'100%' }}
        />
      </div>

      {/* Urgency slider */}
      <div>
        <label style={{ display:'block', marginBottom:'0.25rem' }}>
          Urgency: {urgency}
        </label>
        <input
          type="range"
          min={1} max={5}
          value={urgency}
          onChange={e => onChange({ urgency: +e.target.value })}
          style={{ width:'100%' }}
        />
      </div>

      {/* Back / Confirm */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'1rem' }}>
        <button onClick={onBack} style={{ padding:'0.5rem 1rem' }}>
          ← Back
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{ padding:'0.5rem 1rem' }}
        >
          {loading ? 'Saving…' : 'Confirm'}
        </button>
      </div>
    </div>
  );
}

export default TaskStep2;
