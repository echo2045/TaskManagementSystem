// src/components/TaskDetailsModal.jsx
import React, { useState, useEffect, useContext } from 'react';
import { getTaskColor, borderColors, interiorColors } from '../utils/getTaskColor';
import { getAssignees, markAssigneeComplete, getWorkHistory } from '../api/tasks';
import DelegateModal from './DelegateModal';
import EditTaskModal from './EditTaskModal';
import { AuthContext } from '../AuthContext';

export default function TaskDetailsModal({
  task,
  isArchived = false,
  wasExpired = false,
  onClose
}) {
  const { user } = useContext(AuthContext);
  const isOwner = user.user_id === task.owner_id;
  const [taskState, setTaskState] = useState(task);
  const [assignees, setAssignees] = useState([]);
  const assigneeEntry = assignees.find(a => a.user_id === user.user_id);
  const [showDelegate, setShowDelegate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [totalHoursSpent, setTotalHoursSpent] = useState(0);

  useEffect(() => {
    if (getTaskColor(taskState.importance, taskState.urgency) === 'delegate') {
      getAssignees(taskState.task_id)
        .then(setAssignees)
        .catch(console.error);
    }
    const fetchTotalHours = async () => {
      try {
        const history = await getWorkHistory(user.user_id);
        const taskSessions = history.filter(session => session.task_id === taskState.task_id);
        const total = taskSessions.reduce((sum, session) => sum + (parseFloat(session.hours_spent) || 0), 0);
        setTotalHoursSpent(total);
      } catch (error) {
        console.error("Error fetching total hours spent:", error);
      }
    };
    fetchTotalHours();
  }, [taskState, user.user_id]);

  const handleToggleComplete = async (userId, checked) => {
    try {
      await markAssigneeComplete(taskState.task_id, userId, checked);
      setAssignees(prev =>
        prev.map(a =>
          a.user_id === userId ? { ...a, is_completed: checked } : a
        )
      );
    } catch (err) {
      console.error('Error updating completion status:', err);
    }
  };

  const type = getTaskColor(taskState.importance, taskState.urgency);
  const bgColor = interiorColors[type];
  const defaultBorder = borderColors[type];
  const effectiveBorder = (isOwner && assignees.length > 0 && type === 'delegate')
    ? '#E57373'
    : defaultBorder;

  let badge = null;
  if (isArchived) {
    if (taskState.status === 'completed') {
      badge = wasExpired
        ? { text: 'Late', color: '#FFB74D' }
        : { text: 'Complete', color: '#4caf50' };
    } else {
      badge = { text: 'Incomplete', color: '#E57373' };
    }
  }

  const timeDifference = (
    (type === 'delegate' && assigneeEntry && assigneeEntry.assigned_time_estimate !== null)
      ? (assigneeEntry.assigned_time_estimate - (parseFloat(assigneeEntry.total_hours_spent) || 0)).toFixed(2)
      : (taskState.time_estimate !== null ? (taskState.time_estimate - totalHoursSpent).toFixed(2) : 'N/A')
  );

  const effectiveTimeEstimate = (
    (type === 'delegate' && assigneeEntry && assigneeEntry.assigned_time_estimate !== null)
      ? assigneeEntry.assigned_time_estimate
      : taskState.time_estimate
  );

  const effectiveTotalHoursSpent = (
    (type === 'delegate' && assigneeEntry && assigneeEntry.total_hours_spent !== null)
      ? parseFloat(assigneeEntry.total_hours_spent)
      : totalHoursSpent
  );

  return (
    <div style={overlay}>
      <div style={{ ...modal, background: '#f0f0f0', border: 'none' }}>
        <button onClick={onClose} style={{ ...closeBtn, color: '#000' }}>×</button>
        {isOwner && (
          <button
            onClick={() => setShowEdit(true)}
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '2.5rem',
              background: '#000',
              color: '#fff',
              border: 'none',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ✎ Edit
          </button>
        )}

        <h2 style={{ marginTop: 0 }}>{taskState.title}</h2>
        <span style={{
          display: 'inline-block',
          background: interiorColors[type],
          border: `2px solid ${borderColors[type]}`,
          borderRadius: '16px',
          padding: '0.5rem 1rem',
          color: borderColors[type],
          fontWeight: 'bold',
          marginBottom: '1rem',
          textTransform: 'capitalize'
        }}>
          {type}
        </span>
        <p style={{ margin: '0.5rem 0' }}>
          <strong>Deadline:</strong> {new Date(taskState.deadline).toLocaleString()}
        </p>
        <p style={{ margin: '0.5rem 0' }}>
          <strong>Start Date:</strong> {taskState.start_date ? new Date(taskState.start_date).toLocaleDateString('en-CA') : '—'}
        </p>
        {effectiveTimeEstimate !== null && (
          <p style={{ margin: '0.5rem 0' }}>
            <strong>Estimated Time:</strong> {effectiveTimeEstimate} hours
          </p>
        )}
        {(taskState.status === 'completed' || (type === 'delegate' && assigneeEntry?.is_completed)) && (
          <p style={{ margin: '0.5rem 0' }}>
            <strong>Total Hours Spent:</strong> {effectiveTotalHoursSpent.toFixed(2)} hours
          </p>
        )}
        {(taskState.status === 'completed' || (type === 'delegate' && assigneeEntry?.is_completed)) && effectiveTimeEstimate !== null && (
          <p style={{ margin: '0.5rem 0' }}>
            <strong>Time Difference (Est - Spent):</strong> {timeDifference} hours
          </p>
        )}

        {badge && (
          <span style={{
            display: 'inline-block',
            background: 'transparent',
            border: `1px solid ${badge.color}`,
            borderRadius: '12px',
            padding: '0.25rem 0.75rem',
            color: badge.color,
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}>
            {badge.text}
          </span>
        )}

        <div style={{ margin: '0.5rem 0' }}>
          <strong>Description:</strong>
          <div style={{
            background: '#fff',
            borderRadius: '4px',
            padding: '0.5rem',
            minHeight: '100px',
            whiteSpace: 'pre-wrap'
          }}>
            {taskState.description || '—'}
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
                    disabled={a.user_id !== user.user_id}
                    onChange={(e) =>
                      handleToggleComplete(a.user_id, e.target.checked)
                    }
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{
                    flex: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {a.full_name}
                  </span>
                  <span style={{ marginLeft: '1rem', fontSize: '0.85rem' }}>
                    {a.start_date ? new Date(a.start_date).toLocaleDateString('en-CA') : '—'}
                  </span>
                  <span style={{ marginLeft: '1rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    {a.importance ?? '—'} / {a.urgency ?? '—'}
                  </span>
                </div>
              ))}
            </div>

            {isOwner && (
              <button
                onClick={() => setShowDelegate(true)}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  border: `1px solid ${effectiveBorder}`,
                  borderRadius: '4px',
                  background: 'transparent',
                  color: '#000',
                  cursor: 'pointer'
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

        {showEdit && (
          <EditTaskModal
            task={taskState}
            onClose={() => setShowEdit(false)}
            onDone={() => {
              setShowEdit(false);
              onClose(); // Optional: close details modal
            }}
            onUpdate={(updated) => setTaskState(updated)}
          />
        )}
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modal = {
  position: 'relative',
  width: '500px',
  maxHeight: '80%',
  overflowY: 'auto',
  padding: '1.5rem',
  borderRadius: '8px',
  boxSizing: 'border-box',
  background: '#f0f0f0'
};

const closeBtn = {
  position: 'absolute',
  top: '0.5rem',
  right: '0.5rem',
  border: 'none',
  background: 'transparent',
  fontSize: '1.5rem',
  cursor: 'pointer'
};

const assigneeList = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  marginTop: '0.5rem'
};

const assigneeItem = {
  display: 'flex',
  alignItems: 'center'
};
