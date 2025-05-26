// src/components/TaskStepAreaSelect.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function TaskStepAreaSelect({ values = {}, onChange, onNext }) {
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/areas')
      .then(res => setAreas(res.data))
      .catch(err => console.error('Error loading areas', err));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>Step 3: Select Area</h2>

      <label>
        Choose the area this task belongs to:
        <select
          value={values.area_id || ''}
          onChange={e => onChange({ area_id: Number(e.target.value) })}
          required
          style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
        >
          <option value="" disabled>Select an area</option>
          {areas.map(a => (
            <option key={a.area_id} value={a.area_id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>

      <button
        onClick={onNext}
        disabled={!values.area_id}
        style={{ alignSelf: 'flex-end', padding: '0.5rem 1rem' }}
      >
        Next →
      </button>
    </div>
  );
}
