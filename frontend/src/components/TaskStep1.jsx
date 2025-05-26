// src/components/TaskStep1.jsx
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../AuthContext';

export default function TaskStep1({ values = {}, onChange, onNext }) {
  const { user } = useContext(AuthContext);
  const {
    title = '',
    description = '',
    deadline = '',
    project_id = null,
    area_id = null
  } = values;

  const [isProject, setIsProject] = useState(false);
  const [isArea, setIsArea] = useState(false);

  useEffect(() => {
    setIsProject(!!project_id);
    setIsArea(!!area_id);
  }, [project_id, area_id]);

  const handleToggle = (type) => {
    if (type === 'project') {
      setIsProject(true);
      setIsArea(false);
      onChange({ project_id: null, area_id: null });
    } else if (type === 'area') {
      setIsArea(true);
      setIsProject(false);
      onChange({ project_id: null, area_id: null });
    }
  };

  const handleNext = () => {
    onNext({
      needsProjectSelect: isProject,
      needsAreaSelect: isArea
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>Step 1: Details & Schedule</h2>

      <div>
        <label>Title</label>
        <input
          type="text"
          value={title}
          readOnly
          style={{
            width: '100%',
            padding: '0.5rem',
            background: '#eee',
            cursor: 'not-allowed'
          }}
        />
      </div>

      <div>
        <label>Description</label>
        <textarea
          value={description}
          onChange={e => onChange({ description: e.target.value })}
          rows={3}
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>

      <div>
        <label>
          Deadline <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={e => onChange({ deadline: e.target.value })}
          required
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>

      {(user.role === 'manager' || user.role === 'team_lead' || user.role === 'hr') && (
        <div>
          <label>
            {user.role === 'manager'
              ? 'Is this task part of a project or area?'
              : user.role === 'team_lead'
              ? 'Is this task part of a project?'
              : 'Is this task part of an area?'}
          </label>

          {user.role === 'manager' ? (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label>
                <input
                  type="checkbox"
                  checked={isProject}
                  onChange={() => handleToggle('project')}
                />
                Project
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={isArea}
                  onChange={() => handleToggle('area')}
                />
                Area
              </label>
            </div>
          ) : (
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={user.role === 'team_lead' ? isProject : isArea}
                  onChange={() =>
                    handleToggle(user.role === 'team_lead' ? 'project' : 'area')
                  }
                />
                {user.role === 'team_lead' ? 'Yes (Project)' : 'Yes (Area)'}
              </label>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={!deadline}
        style={{ alignSelf: 'flex-end', padding: '0.5rem 1rem' }}
      >
        Next →
      </button>
    </div>
  );
}
