// src/components/TaskCard.jsx
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import { useSocket } from '../SocketContext'; // Import useSocket
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
  updateAssignmentStartDate,
  startWorkSession,
  stopWorkSession,
  getCurrentTask
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
  const socket = useSocket();
  const isAuthOwner = authUser.user_id === task.owner_id;

  const [assignees, setAssignees] = useState([]);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [completionState, setCompletionState] = useState(null);
  const [currentActiveTask, setCurrentActiveTask] = useState(null);
  const [isWorkingActionLoading, setIsWorkingActionLoading] = useState(false);

  useEffect(() => {
    getAssignees(task.task_id).then(setAssignees).catch(console.error);
  }, [task.task_id]);

  useEffect(() => {
    if (!socket) return;

    const handleWorkSessionUpdate = ({ userId, taskId, type }) => {
      if (userId === authUser.user_id) {
        if (type === 'start') {
          // If the update is for the current task, set it
          if (taskId === task.task_id) {
            setCurrentActiveTask(task);
          } else {
            // If another task was started, set currentActiveTask to that task
            // (This might require fetching the full task details if not already available)
            // For now, we'll just set it to a placeholder if it's not this task
            setCurrentActiveTask({ task_id: taskId });
          }
        } else if (type === 'stop') {
          setCurrentActiveTask(null);
        }
      }
    };

    socket.on('workSessionUpdate', handleWorkSessionUpdate);

    // Initial fetch of current active task
    const fetchCurrentActiveTask = async () => {
      try {
        const activeTask = await getCurrentTask(authUser.user_id);
        setCurrentActiveTask(activeTask);
      } catch (error) {
        console.error("Error fetching current active task:", error);
      }
    };
    fetchCurrentActiveTask();

    return () => {
      socket.off('workSessionUpdate', handleWorkSessionUpdate);
    };
  }, [socket, authUser.user_id, task]);

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

  const handleComplete = async e => {
    e.stopPropagation();
    const checked = e.target.checked;

    if (checked) {
      // If marking as complete, stop work session if active on this task
      if (isWorkingOnThisTask) {
        await stopWorkSession();
        const activeTask = await getCurrentTask(authUser.user_id);
        setCurrentActiveTask(activeTask);
      }
      setCompletionState({ checked });
      setIsConfirmModalVisible(true);
    } else {
      // Unchecking does not require confirmation, but assigned tasks cannot be unmarked
      if (viewIsAssignee && assigneeEntry?.is_completed) {
        alert('Completed assigned tasks cannot be unmarked.');
        return;
      }
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

  const handleStartWork = async (e) => {
    e.stopPropagation();
    setIsWorkingActionLoading(true);
    try {
      await startWorkSession(task.task_id);
      setCurrentActiveTask(task); // Optimistic update
      // Fetch actual current task in background to ensure consistency
      getCurrentTask(authUser.user_id).then(setCurrentActiveTask).catch(console.error);
    } catch (error) {
      console.error("Error starting work session:", error);
      alert(error.response?.data?.error || "Failed to start work session.");
    } finally {
      setIsWorkingActionLoading(false);
    }
  };

  const handleStopWork = async (e) => {
    e.stopPropagation();
    setIsWorkingActionLoading(true);
    try {
      await stopWorkSession();
      setCurrentActiveTask(null); // Optimistic update
      // Fetch actual current task in background to ensure consistency
      getCurrentTask(authUser.user_id).then(setCurrentActiveTask).catch(console.error);
    } catch (error) {
      console.error("Error stopping work session:", error);
      alert(error.response?.data?.error || "Failed to stop work session.");
    } finally {
      setIsWorkingActionLoading(false);
    }
  };

  const isCompleted = canOwnerToggleActive || canOwnerToggleArchive
    ? task.status === 'completed'
    : isAssigneeCompleted;

  const isWorkingOnThisTask = currentActiveTask && currentActiveTask.task_id === task.task_id;
  const isWorkingOnAnotherTask = currentActiveTask && currentActiveTask.task_id !== task.task_id;

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
              disabled={!(canOwnerToggleActive || canOwnerToggleArchive || canAssigneeToggle) || (viewIsAssignee && assigneeEntry?.is_completed)}
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
            {((viewIsAssignee && assigneeEntry?.assigned_time_estimate) || task.time_estimate) && (
              <span style={{
                fontSize: '1rem',
                color: '#555',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '135px'
              }}>
                Est: {viewIsAssignee && assigneeEntry?.assigned_time_estimate ? assigneeEntry.assigned_time_estimate : task.time_estimate}h
              </span>
            )}
            {isCompleted && viewIsAssignee && assigneeEntry?.time_difference !== undefined && (
              <span style={{
                fontSize: '1rem',
                color: assigneeEntry.time_difference >= 0 ? 'green' : 'red',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '135px'
              }}>
                Diff: {assigneeEntry.time_difference}h
              </span>
            )}
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
          {(isAuthOwner || viewIsAssignee) && authUser.user_id === viewingUserId && !isArchived && !isCompleted && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {!isWorkingOnThisTask && (
                <button
                  onClick={handleStartWork}
                  disabled={isWorkingOnAnotherTask || isWorkingActionLoading}
                  style={{
                    padding: '0.3rem 0.6rem',
                    backgroundColor: isWorkingOnAnotherTask ? '#ccc' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isWorkingOnAnotherTask ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Start Work
                </button>
              )}
              {isWorkingOnThisTask && (
                <button
                  onClick={handleStopWork}
                  disabled={isWorkingActionLoading}
                  style={{
                    padding: '0.3rem 0.6rem',
                    backgroundColor: '#F44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Stop Work
                </button>
              )}
            </div>
          )}
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

