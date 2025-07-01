import React, { useState, useRef, useEffect } from 'react';
import { getTaskColor, borderColors, interiorColors } from '../utils/getTaskColor';
import TaskSessionDetailsModal from './TaskSessionDetailsModal';

export default function DayScheduleView({ sessions, selectedDate, allTasks }) {
    const HOUR_HEIGHT = 60; // Height of one hour in pixels

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const [selectedSession, setSelectedSession] = useState(null);
    const scheduleRef = useRef(null);

    const getTaskDetails = (taskId) => allTasks.find(task => task.task_id === taskId);

    const sessionsForDay = sessions.filter(session => {
        const sessionStart = new Date(session.start_time);
        return sessionStart.toDateString() === selectedDate.toDateString();
    });

    useEffect(() => {
        if (scheduleRef.current) {
            // Scroll to 9 AM (9 hours into the 24-hour schedule)
            scheduleRef.current.scrollTop = HOUR_HEIGHT * 9;
        }
    }, [selectedDate]);

    return (
        <div style={dayScheduleContainer}>
            <div style={{ ...timeColumn, height: HOUR_HEIGHT * 6, overflowY: 'hidden' }}>
                <div style={{ height: HOUR_HEIGHT * 24 }}>
                    {hours.map(hour => (
                        <div key={hour} style={{ ...hourLabel, height: HOUR_HEIGHT }}>
                            {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ ...scheduleColumn, height: HOUR_HEIGHT * 6, overflowY: 'scroll' }} ref={scheduleRef}>
                <div style={{ height: HOUR_HEIGHT * 24, position: 'relative' }}>
                    {hours.map(hour => (
                        <div key={hour} style={{ ...hourSlot, height: HOUR_HEIGHT }}>
                            <div style={halfHourLine}></div>
                        </div>
                    ))}
                    {sessionsForDay.map(session => {
                        const task = getTaskDetails(session.task_id);
                        if (!task) return null;

                        const start = new Date(session.start_time);
                        const end = session.end_time ? new Date(session.end_time) : new Date();

                        const startHour = start.getHours();
                        const startMinutes = start.getMinutes();
                        const endHour = end.getHours();
                        const endMinutes = end.getMinutes();

                        const topPosition = (startHour * 60 + startMinutes) / 60 * HOUR_HEIGHT; // Pixels from top
                        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
                        const height = durationMinutes / 60 * HOUR_HEIGHT; // Pixels

                        const taskColorType = getTaskColor(task.importance, task.urgency);
                        const backgroundColor = interiorColors[taskColorType];
                        const borderColor = borderColors[taskColorType];

                        return (
                            <div
                                key={session.session_id}
                                style={{
                                    ...taskBlock,
                                    top: `${topPosition}px`,
                                    height: `${height}px`,
                                    backgroundColor: backgroundColor,
                                    border: `1px solid ${borderColor}`,
                                }}
                                onClick={() => setSelectedSession({ session, task })}
                            >
                                {task.title}
                            </div>
                        );
                    })}
                </div>
            </div>
            {selectedSession && (
                <TaskSessionDetailsModal
                    session={selectedSession.session}
                    task={selectedSession.task}
                    onClose={() => setSelectedSession(null)}
                />
            )}
        </div>
    );
}

const dayScheduleContainer = {
    display: 'flex',
    height: '100%',
    width: '100%',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #ddd' // Re-add the main container border
};

const timeColumn = {
    width: '60px',
    borderRight: '1px solid #ddd',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f9f9f9'
};

const hourLabel = {
    display: 'flex',
    alignItems: 'flex-start',
    paddingLeft: '5px',
    fontSize: '0.75rem',
    color: '#555',
    boxSizing: 'border-box',
    borderBottom: '1px solid #eee',
    paddingTop: '2px'
};

const scheduleColumn = {
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    borderRight: 'none' // Ensure no vertical lines within the schedule
};

const hourSlot = {
    borderBottom: '1px solid #ddd',
    position: 'relative',
    boxSizing: 'border-box'
};

const halfHourLine = {
    position: 'absolute',
    width: '100%',
    borderBottom: '1px dotted #ccc',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1
};

const taskBlock = {
    position: 'absolute',
    width: 'calc(100% - 4px)',
    left: '2px',
    borderRadius: '4px',
    padding: '2px 5px',
    fontSize: '0.7rem',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    boxSizing: 'border-box',
    cursor: 'pointer',
    zIndex: 10
};