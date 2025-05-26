import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';

export default function TaskStepProjectSelect({ values = {}, onChange, onNext }) {
  const [projects, setProjects] = useState([]);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    axios.get('http://localhost:5000/api/projects', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(res => setProjects(res.data))
    .catch(err => console.error('Error loading projects', err));
  }, [token]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <h2>Step 3: Select Project</h2>

      <label>
        Choose the project this task belongs to:
        <select
          value={values.project_id || ''}
          onChange={e => onChange({ project_id: Number(e.target.value) })}
          required
          style={{ width:'100%', padding:'0.5rem', marginTop:'0.5rem' }}
        >
          <option value="" disabled>Select a project</option>
          {projects.map(p => (
            <option key={p.project_id} value={p.project_id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <button
        onClick={onNext}
        disabled={!values.project_id}
        style={{ alignSelf:'flex-end', padding:'0.5rem 1rem' }}
      >
        Next →
      </button>
    </div>
  );
}
