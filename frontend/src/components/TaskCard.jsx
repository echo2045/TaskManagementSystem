// src/components/TaskCard.jsx
import React, { useState, useContext } from 'react';
import { getTaskColor, borderColors, interiorColors } from '../utils/getTaskColor';
import DelegateModal from './DelegateModal';
import { updateTask, deleteTask } from '../api/tasks';
import { AuthContext } from '../AuthContext';

export default function TaskCard({
  task,
  isArchived = false,
  wasExpired = false,
  onStatusChange
}) {
  const { user } = useContext(AuthContext);
  const isOwner = user.user_id === task.owner_id;

  const type       = getTaskColor(task.importance, task.urgency);
  const border     = borderColors[type];
  const background = interiorColors[type];
  const textColor  = '#000';

  const [showDelegate, setShowDelegate] = useState(false);

  const handleComplete = async e => {
    // only the owner may actually mark complete
    if (!isOwner) return;

    try {
      await updateTask(task.task_id, {
        status: e.target.checked ? 'completed' : 'pending'
      });
      onStatusChange?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(task.task_id);
      onStatusChange?.();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div style={{
        border:        `2px solid ${border}`,
        background:     background,
        color:          textColor,
        padding:        '0.75rem 1rem',
        marginBottom:   '0.5rem',
        borderRadius:   '6px',
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center'
      }}>
        {/* Left: checkbox + title + owner */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '0.75rem',
          flex:         1,
          overflow:     'hidden'
        }}>
          <input
            type="checkbox"
            checked={task.status === 'completed'}
            onChange={handleComplete}
            disabled={!isOwner}
          />
          <span style={{
            fontWeight:    'bold',
            whiteSpace:    'nowrap',
            overflow:      'hidden',
            textOverflow:  'ellipsis',
            maxWidth:      '40%'
          }}>
            {task.title}
          </span>
          <span style={{
            whiteSpace:    'nowrap',
            overflow:      'hidden',
            textOverflow:  'ellipsis',
            fontSize:      '0.85rem',
            maxWidth:      '30%'
          }}>
            {task.owner_name}
          </span>
        </div>

        {/* Right: delegate button, time, delete */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '1rem'
        }}>
          {type === 'delegate' && (
            <button
              onClick={() => setShowDelegate(true)}
              style={{
                background:   'transparent',
                border:       `1px solid ${border}`,
                borderRadius: '12px',
                padding:      '0.25rem 0.75rem',
                fontWeight:   'bold',
                cursor:       'pointer',
                color:        border
              }}
            >
              Delegate
            </button>
          )}
          <span style={{
            fontWeight: 'bold',
            minWidth:   '4ch',
            textAlign:  'right'
          }}>
            {new Date(task.deadline).toLocaleTimeString([], {
              hour:   '2-digit',
              minute: '2-digit'
            })}
          </span>
          <button
            onClick={handleDelete}
            style={{
              background: 'transparent',
              border:     'none',
              fontSize:   '1.2rem',
              color:      textColor,
              cursor:     'pointer'
            }}
          >
            🗑
          </button>
        </div>
      </div>

      {showDelegate && (
        <DelegateModal
          taskId={task.task_id}
          onClose={() => setShowDelegate(false)}
        />
      )}
    </>
  );
}
