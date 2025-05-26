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
import DelegateModal from './DelegateModal';
import TaskDetailsModal from './TaskDetailsModal';

export default function TaskCard({
  task,
  viewingUserId,
  isArchived = false,
  wasExpired = false,
  onStatusChange
}) {
  const { user: authUser } = useContext(AuthContext);
  const isAuthOwner = authUser.user_id === task.owner_id;

  const [assignees, setAssignees] = useState([]);
  useEffect(() => {
    if (getTaskColor(task.importance, task.urgency) === 'delegate') {
      getAssignees(task.task_id).then(setAssignees).catch(console.error);
    }
  }, [task.task_id]);

  const viewIsOwner = viewingUserId === task.owner_id;
  const viewIsAssignee = assignees.some(a => a.user_id === viewingUserId);

  const type = getTaskColor(task.importance, task.urgency);
  const defaultBorder = borderColors[type];
  const defaultInterior = interiorColors[type];

  let cardBg = defaultInterior;
  if (type === 'delegate' && viewIsAssignee) {
    cardBg = interiorColors['do'];
  }

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

  let tagStyle = null;
  if (type === 'delegate' && !isArchived) {
    const col = assignees.length > 0 ? borderColors['do'] : defaultBorder;
    tagStyle = {
      background: 'transparent',
      border: `1px solid ${col}`,
      borderRadius: '12px',
      padding: '0.25rem 0.75rem',
      fontSize: '0.75rem',
      lineHeight: '1rem',
      fontWeight: 'bold',
      cursor: isAuthOwner ? 'pointer' : 'default',
      color: col
    };
  }

  const canOwnerToggleActive = !isArchived && isAuthOwner && viewingUserId === authUser.user_id;
  const canOwnerToggleArchive = isArchived && isAuthOwner && viewingUserId === authUser.user_id && task.status !== 'completed';
  const canAssigneeToggle = !isArchived && viewIsAssignee && authUser.user_id === viewingUserId;

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
  const [showDetails, setShowDetails] = useState(false);

  const scopeTag = task.project_id
    ? 'project'
    : task.area_id
    ? 'area'
    : null;

  return (
    <>
      <div
        onClick={() => setShowDetails(true)}
        style={{
          border: `2px solid ${defaultBorder}`,
          background: cardBg,
          color: '#000',
          padding: '0.75rem 1rem',
          marginBottom: '0.5rem',
          borderRadius: '6px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          cursor: 'pointer',
          gap: '1rem'
        }}
      >
        {/* Left column: checkbox + title + owner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flex: 3,
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <input
            type="checkbox"
            checked={task.status === 'completed'}
            onChange={handleComplete}
            onClick={(e) => e.stopPropagation()}
            disabled={!(canOwnerToggleActive || canOwnerToggleArchive || canAssigneeToggle)}
          />
          <span style={{
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '40%'
          }}>
            {task.title}
          </span>
          <span style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: '0.85rem',
            color: '#555',
            maxWidth: '30%'
          }}>
            {task.owner_name}
          </span>
        </div>

        {/* Center column: tag */}
        <div style={{
          flex: 1,
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center'
        }}>
          {scopeTag && (
  <span style={{
    background:   'transparent',
    border:       '1px solid #555',
    borderRadius: '12px',
    padding:      '0.25rem 0.75rem',
    fontSize:     '0.75rem',
    lineHeight:   '1rem',
    fontWeight:   'bold',
    color:        '#555'
  }}>
    {scopeTag}
  </span>
)}

        </div>

        {/* Right column: delegate, badge, time, delete */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          justifyContent: 'flex-end',
          flex: 2
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
              display: 'inline-block',
              background: 'transparent',
              border: `1px solid ${archiveBadge.color}`,
              borderRadius: '12px',
              padding: '0.2rem 0.5rem',
              color: archiveBadge.color,
              fontSize: '0.75rem'
            }}>
              {archiveBadge.text}
            </span>
          )}

          <span style={{
            fontWeight: 'bold',
            minWidth: '4ch',
            textAlign: 'right'
          }}>
            {new Date(task.deadline).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>

          <button
            onClick={handleDelete}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.2rem',
              cursor: isAuthOwner ? 'pointer' : 'default'
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
