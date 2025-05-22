// src/components/TaskStep1.jsx
import React from 'react';

export default function TaskStep1({ values = {}, onChange, onNext }) {
  const {
    title = '',
    description = '',
    deadline = ''
  } = values;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <h2>Step 1: Details & Schedule</h2>

      {/* Title (read-only) */}
      <div>
        <label style={{ display:'block', marginBottom:'0.25rem' }}>
          Title
        </label>
        <input
          type="text"
          value={title}
          readOnly
          style={{
            width:'100%',
            padding:'0.5rem',
            boxSizing:'border-box',
            background:'#eee',
            cursor:'not-allowed'
          }}
        />
      </div>

      {/* Description */}
      <div>
        <label style={{ display:'block', marginBottom:'0.25rem' }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={e => onChange({ description: e.target.value })}
          rows={3}
          style={{ width:'100%', padding:'0.5rem', boxSizing:'border-box' }}
        />
      </div>

      {/* Deadline */}
      <div>
        <label style={{ display:'block', marginBottom:'0.25rem' }}>
          Deadline <span style={{ color:'red' }}>*</span>
        </label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={e => onChange({ deadline: e.target.value })}
          required
          style={{ width:'100%', padding:'0.5rem', boxSizing:'border-box' }}
        />
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={!deadline}
        style={{ alignSelf:'flex-end', padding:'0.5rem 1rem' }}
      >
        Next →
      </button>
    </div>
  );
}
