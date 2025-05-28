import React, { useEffect, useState } from 'react';
import { getAllProjects } from '../api/projects';

export default function TaskStepProjectSelect({ values = {}, onChange, onNext }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    getAllProjects()
      .then(data => {
        const active = data.filter(p => !p.is_completed);
        setProjects(active);
      })
      .catch(err => console.error('Error loading projects', err));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>Step 3: Select Project</h2>

      <label>
        Choose the project this task belongs to:
        <select
          value={values.project_id || ''}
          onChange={e => onChange({ project_id: Number(e.target.value) })}
          required
          style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
        >
          <option value="" disabled>Select a project</option>
          {projects.map(p => (
            <option key={p.project_id} value={p.project_id}>{p.name}</option>
          ))}
        </select>
      </label>

      <button
        onClick={onNext}
        disabled={!values.project_id}
        style={{ alignSelf: 'flex-end', padding: '0.5rem 1rem' }}
      >
        Next →
      </button>
    </div>
  );
}
