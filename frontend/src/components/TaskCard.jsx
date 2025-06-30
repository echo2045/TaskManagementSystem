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
  deleteTask,
  markAssigneeComplete,
  updateAssignmentStartDate
} from '../api/tasks';
import DelegateModal from './DelegateModal';
import TaskDetailsModal from './TaskDetailsModal';
import ConfirmationModal from './ConfirmationModal';

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
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [completionState, setCompletionState] = useState(null);

  useEffect(() => {
    getAssignees(task.task_id).then(setAssignees).catch(console.error);
  }, [task.task_id]);

  const viewIsOwner = viewingUserId === task.owner_id;
  const viewIsAssignee = assignees.some(a => a.user_id === viewingUserId);
  const assigneeEntry = assignees.find(a => a.user_id === viewingUserId);

  const colorType = viewIsAssignee && assigneeEntry
    ? getTaskColor(assigneeEntry.importance, assigneeEntry.urgency)
    : getTaskColor(task.importance, task.urgency);

  const border = borderColors[colorType];
  let cardBg = interiorColors[colorType];

  if (task.importance === 0 && task.urgency === 0 && viewIsAssignee) {
    cardBg = interiorColors['do'];
  }

  let archiveBadge = null;
  if (isArchived) {
    archiveBadge =
      task.status === 'completed'
        ? wasExpired
          ? { text: 'Late', color: '#FFB74D' }
          : { text: 'Complete', color: '#4caf50' }
        : { text: 'Incomplete', color: '#E57373' };
  }

  const canOwnerToggleActive = !isArchived && isAuthOwner && viewingUserId === authUser.user_id;
  const canOwnerToggleArchive = isArchived && isAuthOwner && viewingUserId === authUser.user_id && task.status !== 'completed';
  const canAssigneeToggle = !isArchived && viewIsAssignee && authUser.user_id === viewingUserId;

  const handleComplete = e => {
    e.stopPropagation();
    const checked = e.target.checked;

    if (checked) {
      setCompletionState({ checked });
      setIsConfirmModalVisible(true);
    } else {
      // Unchecking does not require confirmation
      proceedWithCompletion(false);
    }
  };

  const proceedWithCompletion = async (checked) => {
    try {
      if (canOwnerToggleActive || canOwnerToggleArchive) {
        await updateTask(task.task_id, { status: checked ? 'completed' : 'pending' });
      } else if (canAssigneeToggle) {
        await markAssigneeComplete(task.task_id, authUser.user_id, checked);
        setAssignees(prev =>
          prev.map(a =>
            a.user_id === authUser.user_id ? { ...a, is_completed: checked } : a
          )
        );
      }
    } catch (err) {
      console.error('Error updating completion:', err);
      // Revert UI change on error
    } finally {
      setIsConfirmModalVisible(false);
      setCompletionState(null);
      onStatusChange?.();
    }
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

  const scopeTag = task.project_id ? 'project' : task.area_id ? 'area' : null;

  const truncate = (text, max = 20) =>
    text.length > max ? text.slice(0, max - 3) + '...' : text;

  const extraName =
    showProjectNameInstead && task.project_name
      ? task.project_name
      : showAreaNameInstead && task.area_name
      ? task.area_name
      : null;

  const delegateEntry = assignees.find(a => a.user_id === viewingUserId);
  const assignedByName = delegateEntry?.delegated_by || task.owner_name;

  const isDelegateTask = getTaskColor(task.importance, task.urgency) === 'delegate';
  const isAssigned = assignees.length > 0;

  const showDelegateTag = isDelegateTask && !isArchived && (viewIsOwner || viewIsAssignee);
  const delegateTagColor = viewIsOwner
    ? (isAssigned ? borderColors['do'] : borderColors['delegate'])
    : borderColors['do'];

  const delegateTagText = viewIsOwner
    ? 'Delegate'
    : `Delegated by: ${assignedByName}`;

  const isAssigneeCompleted = assigneeEntry?.is_completed ?? false;

  const getStartDate = () => {
    const raw = viewIsAssignee && assigneeEntry?.start_date
      ? assigneeEntry.start_date
      : task.start_date;
    if (!raw) return '';
    return new Date(raw).toLocaleDateString('en-CA');
  };

  const [localStartDate, setLocalStartDate] = useState(getStartDate());
  const isEditableStartDate = viewIsAssignee && delegateEntry?.delegated_by === authUser.full_name;

  const handleStartDateChange = async (e) => {
    const newDate = e.target.value;
    setLocalStartDate(newDate);
    try {
      await updateAssignmentStartDate(task.task_id, viewingUserId, newDate);
    } catch (err) {
      console.error('Failed to update start date:', err);
    }
  };

  const isCompleted = canOwnerToggleActive || canOwnerToggleArchive
    ? task.status === 'completed'
    : isAssigneeCompleted;

  return (
    <>
      <div
        onClick={() => setShowDetails(true)}
        className={`task-card ${isCompleted ? 'completed' : ''}`}
        style={{
          border: `2px solid ${border}`,
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flex: 3,
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <label className="custom-checkbox-container">
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={handleComplete}
              onClick={(e) => e.stopPropagation()}
              disabled={!(canOwnerToggleActive || canOwnerToggleArchive || canAssigneeToggle)}
              className="task-checkbox"
              title="Mark task as complete"
            />
            <span className="checkmark"></span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', width: '100%' }}>
            <span className="task-title" style={{
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
              fontSize: '1rem',
              color: '#555',
              width: '200px'
            }}>
              Owner: {task.owner_name}
            </span>
            <span style={{
              fontSize: '1rem',
              color: '#555',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '135px'
            }}>
              Start:{' '}
              {isEditableStartDate ? (
                <input
                  type="date"
                  value={localStartDate}
                  onChange={handleStartDateChange}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    fontSize: '0.95rem',
                    color: '#333',
                    border: '1px solid #aaa',
                    borderRadius: '4px',
                    padding: '2px 4px',
                    background: '#fff',
                    width: '125px'
                  }}
                />
              ) : (
                getStartDate()
              )}
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

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
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

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          justifyContent: 'flex-end',
          flex: 2
        }}>
          {showDelegateTag && (
            <span
              onClick={e => {
                e.stopPropagation();
                setShowDelegate(true);
              }}
              style={{
                border: `1px solid ${delegateTagColor}`,
                borderRadius: '12px',
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: delegateTagColor,
                cursor: 'pointer'
              }}
            >
              {delegateTagText}
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
          onClose={() => {
            setShowDetails(false);
            getAssignees(task.task_id).then(setAssignees);
          }}
        />
      )}

      <ConfirmationModal
        visible={isConfirmModalVisible}
        onClose={() => {
          setIsConfirmModalVisible(false);
          setCompletionState(null);
        }}
        onConfirm={() => proceedWithCompletion(completionState.checked)}
        title="Confirm Task Completion"
        message="Are you sure you want to mark this task as complete?"
      />
    </>
  );
}
