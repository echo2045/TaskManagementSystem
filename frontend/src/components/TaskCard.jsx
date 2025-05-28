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
import DelegateModal from './DelegateModal';
import TaskDetailsModal from './TaskDetailsModal';

export default function TaskCard({
  task,
  viewingUserId,
  isArchived = false,
  wasExpired = false,
  onStatusChange,
  showProjectNameInstead = false,
  showAreaNameInstead = false
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

  const truncate = (text, max = 20) =>
    text.length > max ? text.slice(0, max - 3) + '...' : text;

  const extraName = showProjectNameInstead && task.project_name
    ? task.project_name
    : showAreaNameInstead && task.area_name
    ? task.area_name
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
        {/* Left Column */}
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
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', width: '100%' }}>
            <span style={{
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '180px'
            }}>
              {task.title}
            </span>
            <span style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.85rem',
              color: '#555',
              width: '130px'
            }}>
              {task.owner_name}
            </span>
            {extraName && (
              <span style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '0.8rem',
                color: '#777',
                width: '130px'
              }}>
                {truncate(extraName, 22)}
              </span>
            )}
          </div>
        </div>

        {/* Center Tag */}
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center'
        }}>
          {!showProjectNameInstead && !showAreaNameInstead && scopeTag && (
            <span style={{
              fontSize: '0.7rem',
              background: '#eee',
              color: '#555',
              padding: '0.2rem 0.5rem',
              borderRadius: '8px'
            }}>
              {scopeTag}
            </span>
          )}
        </div>

        {/* Right Column */}
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
      >
        Delegate
      </button>
    : <span style={tagStyle}>
        Delegated by: {task.owner_name}
      </span>
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
