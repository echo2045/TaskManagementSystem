// src/components/TaskDetailsModal.jsx
import React, { useState, useEffect, useContext } from 'react';
import { getTaskColor, borderColors, interiorColors } from '../utils/getTaskColor';
import { getAssignees } from '../api/tasks';
import DelegateModal    from './DelegateModal';
import { AuthContext }  from '../AuthContext';

export default function TaskDetailsModal({
  task,
  isArchived = false,
  wasExpired = false,
  onClose
}) {
  const { user } = useContext(AuthContext);
  const isOwner   = user.user_id === task.owner_id;
  const [assignees, setAssignees]     = useState([]);
  const [showDelegate, setShowDelegate] = useState(false);

  useEffect(() => {
    if (getTaskColor(task.importance, task.urgency) === 'delegate') {
      getAssignees(task.task_id)
        .then(setAssignees)
        .catch(console.error);
    }
  }, [task]);

  const type              = getTaskColor(task.importance, task.urgency);
  const bgColor           = interiorColors[type];
  const defaultBorder     = borderColors[type];
  // Supervisor sees red border once someone is assigned
  const effectiveBorder   = (isOwner && assignees.length > 0 && type === 'delegate')
    ? '#E57373'
    : defaultBorder;

  // Archive badge logic
  let badge = null;
  if (isArchived) {
    if (task.status === 'completed') {
      badge = wasExpired
        ? { text: 'Late', color: '#FFB74D' }
        : { text: 'Complete', color: '#4caf50' };
    } else {
      badge = { text: 'Incomplete', color: '#E57373' };
    }
  }

  return (
    <div style={overlay}>
      <div style={{ ...modal, background: bgColor, border: `2px solid ${effectiveBorder}` }}>
        <button onClick={onClose} style={{ ...closeBtn, color: '#000' }}>×</button>

        <h2 style={{ marginTop: 0 }}>{task.title}</h2>
        <p style={{ margin: '0.5rem 0' }}>
          <strong>Deadline:</strong> {new Date(task.deadline).toLocaleString()}
        </p>

        {badge && (
          <span style={{
            display:      'inline-block',
            background:   'transparent',
            border:       `1px solid ${badge.color}`,
            borderRadius: '12px',
            padding:      '0.25rem 0.75rem',
            color:        badge.color,
            fontWeight:   'bold',
            marginBottom: '1rem'
          }}>
            {badge.text}
          </span>
        )}

        <div style={{ margin: '0.5rem 0' }}>
          <strong>Description:</strong>
          <div style={{
            background:  '#fff',
            borderRadius:'4px',
            padding:     '0.5rem',
            minHeight:   '100px',
            whiteSpace:  'pre-wrap'
          }}>
            {task.description || '—'}
          </div>
        </div>


        {type === 'delegate' && (
          <>
            <h3 style={{ margin: '1rem 0 0.5rem' }}>Assignees</h3>
            <div style={assigneeList}>
              {assignees.map(a => (
                <div key={a.user_id} style={assigneeItem}>
                  <input
                    type="checkbox"
                    checked={a.is_completed}
                    disabled
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{
                    flex:            1,
                    whiteSpace:      'nowrap',
                    overflow:        'hidden',
                    textOverflow:    'ellipsis'
                  }}>
                    {a.full_name}
                  </span>
                  <span style={{ marginLeft: '1rem', fontSize: '0.85rem' }}>
                    {a.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Only the owner (supervisor) may add/unassign */}
            {isOwner && (
              <button
                onClick={() => setShowDelegate(true)}
                style={{
                  marginTop:    '1rem',
                  padding:      '0.5rem 1rem',
                  border:       `1px solid ${effectiveBorder}`,
                  borderRadius: '4px',
                  background:   'transparent',
                  color:        '#000',
                  cursor:       'pointer'
                }}
              >
                ＋ Add Assignee
              </button>
            )}

            {showDelegate && (
              <DelegateModal
                taskId={task.task_id}
                onClose={() => {
                  setShowDelegate(false);
                  getAssignees(task.task_id).then(setAssignees);
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

const overlay = {
  position:       'fixed',
  top:            0,
  left:           0,
  right:          0,
  bottom:         0,
  background:     'rgba(0,0,0,0.5)',
  display:        'flex',
  justifyContent: 'center',
  alignItems:     'center',
  zIndex:         1000
};

const modal = {
  position:     'relative',
  width:        '500px',
  maxHeight:    '80%',
  overflowY:    'auto',
  padding:      '1.5rem',
  borderRadius: '8px',
  boxSizing:    'border-box'
};

const closeBtn = {
  position:    'absolute',
  top:         '0.5rem',
  right:       '0.5rem',
  border:      'none',
  background:  'transparent',
  fontSize:    '1.5rem',
  cursor:      'pointer'
};

const assigneeList = {
  display:       'flex',
  flexDirection: 'column',
  gap:           '0.5rem',
  marginTop:     '0.5rem'
};

const assigneeItem = {
  display:    'flex',
  alignItems: 'center'
};
