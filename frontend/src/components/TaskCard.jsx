// src/components/TaskCard.jsx
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import {
  getTaskColor,
  borderColors,
  interiorColors
} from '../utils/getTaskColor';
import {
  getAssignees,
  updateTask,
  deleteTask
} from '../api/tasks';
import DelegateModal      from './DelegateModal';
import TaskDetailsModal   from './TaskDetailsModal';

export default function TaskCard({
  task,
  viewingUserId,
  isArchived = false,
  wasExpired = false,
  onStatusChange
}) {
  const { user: authUser } = useContext(AuthContext);
  const isAuthOwner        = authUser.user_id === task.owner_id;

  // Load assignees for delegate logic
  const [assignees, setAssignees] = useState([]);
  useEffect(() => {
    if (getTaskColor(task.importance, task.urgency) === 'delegate') {
      getAssignees(task.task_id).then(setAssignees).catch(console.error);
    }
  }, [task.task_id]);

  // Perspective flags
  const viewIsOwner    = viewingUserId === task.owner_id;
  const viewIsAssignee = assignees.some(a => a.user_id === viewingUserId);

  // Base colors
  const type           = getTaskColor(task.importance, task.urgency);
  const defaultBorder  = borderColors[type];
  const defaultInterior= interiorColors[type];

  // Determine card background under viewingUserId perspective
  let cardBg = defaultInterior;
  if (type === 'delegate' && viewIsAssignee) {
    // assigned user sees Do‐red interior
    cardBg = interiorColors['do'];
  }

  // Archive badge data
  let archiveBadge = null;
  if (isArchived) {
    if (task.status === 'completed') {
      archiveBadge = wasExpired
        ? { text: 'Late', color: '#FFB74D' }
        : { text: 'Complete', color: '#4caf50' };
    } else {
      archiveBadge = { text: 'Incomplete', color: '#E57373' };
    }
  }

  // Delegate tag style under perspective
  let tagStyle = null;
  if (type === 'delegate' && !isArchived) {
    if (viewIsOwner) {
      const col = assignees.length > 0
        ? borderColors['do']
        : defaultBorder;
      tagStyle = {
        background:   'transparent',
        border:       `1px solid ${col}`,
        borderRadius: '12px',
        padding:      '0.25rem 0.75rem',
        fontWeight:   'bold',
        cursor:       isAuthOwner ? 'pointer' : 'default',
        color:        col
      };
    } else {
      tagStyle = {
        background:   'transparent',
        border:       `1px solid ${defaultBorder}`,
        borderRadius: '12px',
        padding:      '0.25rem 0.75rem',
        fontWeight:   'bold',
        color:        defaultBorder
      };
    }
  }

  // Can toggle completion?
  let canToggle = false;
  if (!isArchived) {
    // in active view, only owner on own tasks
    canToggle = isAuthOwner && viewingUserId === authUser.user_id;
  } else {
    // in archive, only owner on own incomplete tasks
    canToggle = isAuthOwner
      && viewingUserId === authUser.user_id
      && task.status !== 'completed';
  }

  const [showDelegate, setShowDelegate] = useState(false);
  const [showDetails,  setShowDetails]  = useState(false);

  const handleComplete = async e => {
    e.stopPropagation();
    if (!canToggle) return;
    await updateTask(task.task_id, {
      status: e.target.checked ? 'completed' : 'pending'
    });
    onStatusChange?.();
  };

  const handleDelete = async e => {
    e.stopPropagation();
    if (!isAuthOwner) return;
    if (!window.confirm('Delete this task?')) return;
    await deleteTask(task.task_id);
    onStatusChange?.();
  };

  return (
    <>
      <div
        onClick={() => setShowDetails(true)}
        style={{
          border:        `2px solid ${defaultBorder}`,
          background:     cardBg,
          color:          '#000',
          padding:        '0.75rem 1rem',
          marginBottom:   '0.5rem',
          borderRadius:   '6px',
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          cursor:         'pointer'
        }}
      >
        {/* Left: checkbox + title (wider) + owner */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '0.75rem',
          flex:       1,
          overflow:   'hidden'
        }}>
          <input
            type="checkbox"
            checked={task.status === 'completed'}
            onChange={handleComplete}
            disabled={!canToggle}
          />
          <span style={{
            fontWeight:   'bold',
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            maxWidth:     '60%'
          }}>
            {task.title}
          </span>
          <span style={{
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            fontSize:     '0.85rem',
            maxWidth:     '25%'
          }}>
            {task.owner_name}
          </span>
        </div>

        {/* Right: delegate tag, time, archive badge, delete */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '0.75rem'
        }}>
          {tagStyle && (
            isAuthOwner
              ? <button
                  onClick={e => { e.stopPropagation(); setShowDelegate(true); }}
                  style={tagStyle}
                >
                  Delegate
                </button>
              : <span style={tagStyle}>Delegate</span>
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
          {archiveBadge && (
            <span style={{
              display:      'inline-block',
              background:   'transparent',
              border:       `1px solid ${archiveBadge.color}`,
              borderRadius: '12px',
              padding:      '0.2rem 0.5rem',
              color:        archiveBadge.color,
              fontSize:     '0.75rem'
            }}>
              {archiveBadge.text}
            </span>
          )}
          <button
            onClick={handleDelete}
            style={{
              background:'transparent',
              border:'none',
              fontSize:'1.2rem',
              cursor:isAuthOwner ? 'pointer' : 'default'
            }}
          >
            🗑
          </button>
        </div>
      </div>

      {showDelegate && (
        <DelegateModal
          taskId={task.task_id}
          onClose={() => {
            setShowDelegate(false);
            getAssignees(task.task_id).then(setAssignees);
          }}
        />
      )}

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
