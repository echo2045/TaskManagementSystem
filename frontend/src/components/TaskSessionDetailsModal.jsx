import React from 'react';
import { getTaskColor, borderColors, interiorColors } from '../utils/getTaskColor';

export default function TaskSessionDetailsModal({ session, task, owner, onClose }) {
    const sessionStart = new Date(session.start_time);
    const sessionEnd = session.end_time ? new Date(session.end_time) : null;

    const calculateSessionDuration = () => {
        if (!sessionEnd) {
            const now = new Date();
            const durationMs = now.getTime() - sessionStart.getTime();
            return (durationMs / (1000 * 60 * 60)).toFixed(2);
        } else {
            const durationMs = sessionEnd.getTime() - sessionStart.getTime();
            return (durationMs / (1000 * 60 * 60)).toFixed(2);
        }
    };

    const sessionDuration = calculateSessionDuration();

    const taskColorType = getTaskColor(task.importance, task.urgency);
    const backgroundColor = interiorColors[taskColorType];
    const borderColor = borderColors[taskColorType];

    const isCompleted = task.status === 'completed' || (session.is_completed);

    const effectiveTimeEstimate = task.assigned_time_estimate !== null ? task.assigned_time_estimate : task.time_estimate;
    const totalHoursSpent = task.total_hours_spent !== null ? parseFloat(task.total_hours_spent) : null;
    const timeDifference = task.time_difference !== null ? parseFloat(task.time_difference) : null;

    const timeRemaining = (effectiveTimeEstimate !== null && totalHoursSpent !== null && !isCompleted)
        ? (effectiveTimeEstimate - totalHoursSpent).toFixed(2)
        : 'N/A';

    return (
        <div style={overlay}>
            <div style={{ ...modal, background: backgroundColor, border: `2px solid ${borderColor}` }}>
                <button onClick={onClose} style={closeBtn}>×</button>
                <h2>{task.title}</h2>
                {owner && <p><strong>Task Owner:</strong> {owner.username}</p>}
                <p><strong>Start Time:</strong> {sessionStart.toLocaleString()}</p>
                <p><strong>End Time:</strong> {sessionEnd ? sessionEnd.toLocaleString() : 'In Progress'}</p>
                <p><strong>Session Duration:</strong> {sessionDuration} hours</p>
                <p><strong>Total Hours on Task:</strong> {totalHoursSpent !== null ? totalHoursSpent.toFixed(2) + ' hours' : 'N/A'}</p>
                <p><strong>Estimated Time:</strong> {effectiveTimeEstimate !== null ? effectiveTimeEstimate + ' hours' : 'N/A'}</p>
                {isCompleted ? (
                    <p><strong>Difference (Est - Spent):</strong> {timeDifference !== null ? timeDifference + ' hours' : 'N/A'}</p>
                ) : (
                    <p><strong>Time Remaining (Est - Spent):</strong> {timeRemaining} hours</p>
                )}
                <p><strong>Completed:</strong> <input type="checkbox" checked={isCompleted} disabled /></p>
            </div>
        </div>
    );
}

const overlay = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1002
};

const modal = {
    position: 'relative',
    padding: '2rem',
    borderRadius: '8px',
    width: '400px',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxSizing: 'border-box'
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