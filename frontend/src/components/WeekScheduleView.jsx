import React, { useState, useRef, useEffect } from 'react';
import { getTaskColor, borderColors, interiorColors } from '../utils/getTaskColor';
import TaskSessionDetailsModal from './TaskSessionDetailsModal';

export default function WeekScheduleView({ sessions, selectedDate, allTasks }) {
    const HOUR_HEIGHT = 60; // Height of one hour in pixels

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const [selectedSession, setSelectedSession] = useState(null);
    const weekScheduleRef = useRef(null); // Ref for the main scrollable area
    const timeColumnInnerRef = useRef(null); // Ref for the inner time column

    const getTaskDetails = (taskId) => allTasks.find(task => task.task_id === taskId);

    const getSessionsForDay = (dayIndex) => {
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay()); // Go to Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        const targetDay = new Date(startOfWeek);
        targetDay.setDate(startOfWeek.getDate() + dayIndex);

        const nextDay = new Date(targetDay);
        nextDay.setDate(targetDay.getDate() + 1);

        return sessions.filter(session => {
            const sessionStart = new Date(session.start_time);
            const sessionEnd = session.end_time ? new Date(session.end_time) : new Date();
            return sessionStart < nextDay && sessionEnd > targetDay;
        });
    };

    useEffect(() => {
        if (weekScheduleRef.current) {
            // Scroll to 9 AM
            weekScheduleRef.current.scrollTop = HOUR_HEIGHT * 9;
        }
    }, [selectedDate]);

    const handleWeekScheduleScroll = () => {
        if (weekScheduleRef.current && timeColumnInnerRef.current) {
            timeColumnInnerRef.current.scrollTop = weekScheduleRef.current.scrollTop;
        }
    };

    return (
        <div style={weekScheduleContainer}>
            <div style={{ ...weekHeaderRow, display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)' }}>
                <div></div> {/* Empty div for alignment with time column */}
                {daysOfWeek.map((dayName, dayIndex) => (
                    <div key={dayIndex} style={dayHeader}>{dayName}</div>
                ))}
            </div>
            <div style={{ ...weekContentRow, height: HOUR_HEIGHT * 6, overflowY: 'scroll' }} ref={weekScheduleRef} onScroll={handleWeekScheduleScroll}> {/* Main scrollable area */}
                <div style={{ display: 'flex', width: '100%' }}>
                    <div style={{ ...timeColumn, height: HOUR_HEIGHT * 24 }} ref={timeColumnInnerRef}> {/* Inner div for time labels */}
                        {hours.map(hour => (
                            <div key={hour} style={{ ...hourLabel, height: HOUR_HEIGHT }}>
                                {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}
                            </div>
                        ))}
                    </div>
                    {daysOfWeek.map((dayName, dayIndex) => (
                        <div key={dayIndex} style={dayColumn}>
                            <div style={{ ...scheduleColumn, height: HOUR_HEIGHT * 24, overflowY: 'hidden' }}> {/* Individual day content */}
                                {hours.map(hour => (
                                    <div key={hour} style={{ ...hourSlot, height: HOUR_HEIGHT }}>
                                        <div style={halfHourLine}></div>
                                        <div style={halfHourLine}></div>
                                    </div>
                                ))}
                                {getSessionsForDay(dayIndex).map(session => {
                                    const task = getTaskDetails(session.task_id);
                                    if (!task) return null;

                                    const sessionStart = new Date(session.start_time);
                                    const sessionEnd = session.end_time ? new Date(session.end_time) : new Date();

                                    const startOfWeek = new Date(selectedDate);
                                    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
                                    startOfWeek.setHours(0, 0, 0, 0);

                                    const currentDay = new Date(startOfWeek);
                                    currentDay.setDate(startOfWeek.getDate() + dayIndex);

                                    const nextDay = new Date(currentDay);
                                    nextDay.setDate(currentDay.getDate() + 1);

                                    const segmentStart = sessionStart > currentDay ? sessionStart : currentDay;
                                    const segmentEnd = sessionEnd < nextDay ? sessionEnd : nextDay;

                                    const startHour = segmentStart.getHours();
                                    const startMinutes = segmentStart.getMinutes();

                                    const topPosition = (startHour * 60 + startMinutes) / 60 * HOUR_HEIGHT;

                                    const durationMinutes = (segmentEnd.getTime() - segmentStart.getTime()) / (1000 * 60);
                                    const height = durationMinutes / 60 * HOUR_HEIGHT;

                                    if (height <= 0) return null;

                                    const taskColorType = getTaskColor(task.importance, task.urgency);
                                    const backgroundColor = interiorColors[taskColorType];
                                    const borderColor = borderColors[taskColorType];

                                    return (
                                        <div
                                            key={`${session.session_id}-${dayIndex}`}
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
                    ))}
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

const weekScheduleContainer = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden'
};

const weekHeaderRow = {
    display: 'flex',
    width: '100%',
    borderBottom: '1px solid #ddd',
    backgroundColor: '#f0f0f0'
};

const timeColumnHeader = {
    width: '60px',
    borderRight: '1px solid #ddd',
};

const weekContentRow = {
    display: 'flex',
    flex: 1,
    width: '100%',
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
    borderBottom: '1px solid #eee'
};

const dayColumn = {
    flex: 1,
    borderRight: '1px solid #ddd',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative'
};

const dayHeader = {
    flex: 1,
    padding: '5px',
    textAlign: 'center',
    fontWeight: 'bold',
    borderRight: '1px solid #ddd',
    boxSizing: 'border-box'
};

const scheduleColumn = {
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'hidden'
};

const hourSlot = {
    borderBottom: '1px solid #ddd',
    position: 'relative',
    boxSizing: 'border-box'
};

const halfHourLine = {
    position: 'absolute',
    width: '100%',
    borderBottom: '1px dotted #eee',
    top: '50%',
    transform: 'translateY(-50%)'
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