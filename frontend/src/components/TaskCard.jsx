// src/components/TaskCard.jsx
import React, { useState } from 'react';
import { getTaskColor, borderColors, interiorColors } from '../utils/getTaskColor';
import { updateTask, deleteTask } from '../api/tasks';
import DelegateModal from './DelegateModal';
import TaskDetailsModal from './TaskDetailsModal';

export default function TaskCard({
  task,
  isArchived = false,
  wasExpired = false,
  onStatusChange
}) {
  const [showDelegate, setShowDelegate] = useState(false);
  const [showDetails, setShowDetails]   = useState(false);

  const type       = getTaskColor(task.importance, task.urgency);
  const border     = borderColors[type];
  const background = interiorColors[type];
  const textColor  = '#000';

  // Mark complete (only if not already completed)
  const handleComplete = async e => {
    e.stopPropagation();
    if (task.status === 'completed') return;
    await updateTask(task.task_id, { status: 'completed' });
    onStatusChange?.();
  };

  // Delete task
  const handleDelete = async e => {
    e.stopPropagation();
    if (!window.confirm('Delete this task?')) return;
    await deleteTask(task.task_id);
    onStatusChange?.();
  };

  // Determine archive badge
  let badge = null;
  if (isArchived) {
    if (task.status === 'completed') {
      badge = wasExpired
        ? { text: 'Late',   color: '#FFB74D' }
        : { text: 'Complete', color: '#4caf50' };
    } else {
      badge = { text: 'Incomplete', color: '#E57373' };
    }
  }

  return (
    <>
      <div
        onClick={() => setShowDetails(true)}
        style={{
          position:       'relative',
          border:         `2px solid ${border}`,
          background:     background,
          color:          textColor,
          padding:        '0.75rem 1rem',
          marginBottom:   '0.5rem',
          borderRadius:   '6px',
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          cursor:         'pointer'
        }}
      >
        {/* Left: checkbox, title, owner */}
        <div
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '0.75rem',
            flex:       1,
            overflow:   'hidden'
          }}
        >
          <input
            type="checkbox"
            checked={task.status === 'completed'}
            disabled={task.status === 'completed'}
            onClick={handleComplete}
          />
          <span style={{
            fontWeight:   'bold',
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            maxWidth:     '40%'
          }}>
            {task.title}
          </span>
          <span style={{
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            fontSize:     '0.85rem',
            maxWidth:     '30%'
          }}>
            {task.owner_name}
          </span>
        </div>

        {/* Right: delegate/time/delete + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!isArchived && type === 'delegate' && (
            <button
              onClick={e => { e.stopPropagation(); setShowDelegate(true); }}
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

          {isArchived && badge && (
            <span style={{
              background:   'transparent',
              border:       `1px solid ${badge.color}`,
              borderRadius: '12px',
              padding:      '0.25rem 0.75rem',
              fontWeight:   'bold',
              color:        badge.color
            }}>
              {badge.text}
            </span>
          )}

          <span style={{ fontWeight: 'bold', minWidth: '4ch', textAlign: 'right' }}>
            {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

      {/* Delegate modal */}
      {showDelegate && (
        <DelegateModal
          taskId={task.task_id}
          onClose={() => setShowDelegate(false)}
        />
      )}

      {/* Details modal */}
      {showDetails && (
        <TaskDetailsModal
          task={task}
          isArchived={isArchived}
          wasExpired={wasExpired}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}
