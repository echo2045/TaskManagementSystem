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
  updateAssignee,
  deleteTask
} from '../api/tasks';
import DelegateModal    from './DelegateModal';
import TaskDetailsModal from './TaskDetailsModal';

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

  // Colors
  const type            = getTaskColor(task.importance, task.urgency);
  const defaultBorder   = borderColors[type];
  const defaultInterior = interiorColors[type];

  // Card background (assigned user sees “Do” red interior)
  let cardBg = defaultInterior;
  if (type === 'delegate' && viewIsAssignee) {
    cardBg = interiorColors['do'];
  }

  // Archive badge
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

  // Delegate tag style (owner vs viewer)
  let tagStyle = null;
  if (type === 'delegate' && !isArchived) {
    if (viewIsOwner) {
      const col = assignees.length > 0 ? borderColors['do'] : defaultBorder;
      tagStyle = {
        background:   'transparent',
        border:       `1px solid ${col}`,
        borderRadius: '12px',
        padding:      '0.25rem 0.75rem',
        fontSize:     '0.75rem',
        lineHeight:   '1rem',
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
        fontSize:     '0.75rem',
        lineHeight:   '1rem',
        fontWeight:   'bold',
        color:        defaultBorder
      };
    }
  }

  // Who can toggle which checkbox?
  const canOwnerToggleActive  = !isArchived && isAuthOwner && viewingUserId === authUser.user_id;
  const canOwnerToggleArchive = isArchived && isAuthOwner && viewingUserId === authUser.user_id && task.status !== 'completed';
  const canAssigneeToggle     = !isArchived && viewIsAssignee && authUser.user_id === viewingUserId;

  // Handlers
  const handleComplete = async e => {
    e.stopPropagation();
    if (canOwnerToggleActive || canOwnerToggleArchive) {
      await updateTask(task.task_id, { status: e.target.checked ? 'completed' : 'pending' });
    } else if (canAssigneeToggle) {
      await updateAssignee(task.task_id, authUser.user_id, e.target.checked);
    } else {
      return;
    }
    onStatusChange?.();
  };

  const handleDelete = async e => {
    e.stopPropagation();
    if (!isAuthOwner) return;
    if (!window.confirm('Delete this task?')) return;
    await deleteTask(task.task_id);
    onStatusChange?.();
  };

  const [showDelegate, setShowDelegate] = useState(false);
  const [showDetails,  setShowDetails]  = useState(false);

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
        {/* Left: Checkbox, Title, Owner */}
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
            onClick={(e) => e.stopPropagation()} 
            disabled={!(canOwnerToggleActive || canOwnerToggleArchive || canAssigneeToggle)}
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

        {/* Right: Delegate tag, Badge, Time, Delete */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '0.75rem'
        }}>
          {tagStyle && (
            viewIsOwner
              ? <button
                  onClick={e => { e.stopPropagation(); setShowDelegate(true); }}
                  style={tagStyle}
                >Delegate</button>
              : <span style={tagStyle}>Delegate</span>
          )}

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

          <span style={{
            fontWeight:'bold',
            minWidth:'4ch',
            textAlign:'right'
          }}>
            {new Date(task.deadline).toLocaleTimeString([], {
              hour:   '2-digit',
              minute: '2-digit'
            })}
          </span>

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
