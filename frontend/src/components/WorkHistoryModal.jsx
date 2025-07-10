import React, { useState, useEffect, useCallback } from 'react';
import { getWorkHistory, getTasksForUser, getArchivedTasksForUser } from '../api/tasks';
import { getUsers } from '../api/users';
import { getTaskColor } from '../utils/getTaskColor';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import DayScheduleView from './DayScheduleView';
import WeekScheduleView from './WeekScheduleView';

export default function WorkHistoryModal({ userId, onClose, currentView, onCurrentViewChange, initialHistoryDate }) {
    const [workSessions, setWorkSessions] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedDate, setSelectedDate] = useState(
        initialHistoryDate && !isNaN(initialHistoryDate.getTime())
            ? initialHistoryDate
            : new Date()
    );
    console.log('WorkHistoryModal: Initial selectedDate from prop:', initialHistoryDate);
    console.log('WorkHistoryModal: selectedDate state after useState:', selectedDate);
    const [taskTypeFilter, setTaskTypeFilter] = useState('');
    const [taskStatusFilter, setTaskStatusFilter] = useState('all'); // 'all', 'pending', 'completed', 'late', 'incomplete'

    const fetchWorkData = useCallback(async () => {
        try {
            const history = await getWorkHistory(userId);
            setWorkSessions(history);
            console.log('WorkHistoryModal: Fetched work history:', history);
            
            // Fetch both active and archived tasks and combine them
            const activeTasks = await getTasksForUser();
            const archivedTasks = await getArchivedTasksForUser(userId);
            
            // Combine and create a unique list of tasks
            const combinedTasks = [...activeTasks, ...archivedTasks];
            const uniqueTasks = Array.from(new Map(combinedTasks.map(task => [task.task_id, task])).values());
            
            setAllTasks(uniqueTasks);
            
            const userList = await getUsers();
            setUsers(userList);
        } catch (error) {
            console.error("Error fetching work history or tasks:", error);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            fetchWorkData();
        }
    }, [fetchWorkData, userId]);

    useEffect(() => {
        setSelectedDate(initialHistoryDate);
    }, [initialHistoryDate]);

    const filteredSessions = React.useMemo(() => {
            let filtered = workSessions;

            // Filter by date
            if (currentView === 'day') {
                const startOfDay = new Date(selectedDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(selectedDate);
                endOfDay.setHours(23, 59, 59, 999);

                filtered = filtered.filter(session => {
                    const sessionStart = new Date(session.start_time);
                    const sessionEnd = session.end_time ? new Date(session.end_time) : new Date();
                    return sessionStart <= endOfDay && sessionEnd >= startOfDay;
                });
            } else { // week view
                const startOfWeek = new Date(selectedDate);
                startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay()); // Go to Sunday
                startOfWeek.setHours(0, 0, 0, 0);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 7);
                endOfWeek.setHours(0, 0, 0, 0);

                filtered = filtered.filter(session => {
                    const sessionStart = new Date(session.start_time);
                    const sessionEnd = session.end_time ? new Date(session.end_time) : new Date();
                    return sessionStart < endOfWeek && sessionEnd > startOfWeek;
                });
            }

        // Filter by task type (Eisenhower matrix type)
        if (taskTypeFilter) {
            filtered = filtered.filter(session => {
                const task = allTasks.find(t => t.task_id === session.task_id);
                return task && getTaskColor(task.importance, task.urgency) === taskTypeFilter;
            });
        }

        // Filter by task status
        if (taskStatusFilter !== 'all') {
            filtered = filtered.filter(session => {
                const task = allTasks.find(t => t.task_id === session.task_id);
                if (!task) return false;

                if (taskStatusFilter === 'completed') return task.status === 'completed';
                if (taskStatusFilter === 'pending') return task.status === 'pending';
                
                // For 'late' and 'incomplete', we need more logic
                const now = new Date();
                const deadline = new Date(task.deadline);

                if (taskStatusFilter === 'late') {
                    return task.status === 'completed' && deadline < new Date(session.end_time);
                }
                if (taskStatusFilter === 'incomplete') {
                    return task.status === 'pending' && deadline < now;
                }
                return true;
            });
        }

        return filtered;
    }, [workSessions, selectedDate, currentView, taskTypeFilter, taskStatusFilter, allTasks]);

    const navigateDate = (direction) => {
        const newDate = new Date(selectedDate);
        if (currentView === 'day') {
            newDate.setDate(newDate.getDate() + direction);
        } else {
            newDate.setDate(newDate.getDate() + (direction * 7));
        }
        setSelectedDate(newDate);
    };

    const getDisplayDate = () => {
        if (currentView === 'day') {
            return selectedDate.toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } else {
            const startOfWeek = new Date(selectedDate);
            startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return `${startOfWeek.toLocaleDateString('en-CA')} - ${endOfWeek.toLocaleDateString('en-CA')}`;
        }
    };

    return (
        <div style={overlay}>
            <div style={modal}>
                <button onClick={onClose} style={closeBtn}>×</button>
                <h2>Work History</h2>

                <div style={controlsContainer}>
                    <div style={dateNavigation}>
                        <button onClick={() => navigateDate(-1)} style={navButton}><FaChevronLeft /></button>
                        <input
                            type={currentView === 'day' ? 'date' : 'text'}
                            value={currentView === 'day' ? selectedDate.toISOString().split('T')[0] : getDisplayDate()}
                            onChange={(e) => {
                                if (currentView === 'day') setSelectedDate(new Date(e.target.value));
                            }}
                            style={dateInput}
                            readOnly={currentView === 'week'}
                        />
                        <button onClick={() => navigateDate(1)} style={navButton}><FaChevronRight /></button>
                    </div>

                    <div style={viewToggle}>
                        <button
                            onClick={() => onCurrentViewChange('day')}
                            style={{ ...toggleButton, background: currentView === 'day' ? '#007bff' : '#ccc' }}
                        >
                            Day
                        </button>
                        <button
                            onClick={() => onCurrentViewChange('week')}
                            style={{ ...toggleButton, background: currentView === 'week' ? '#007bff' : '#ccc' }}
                        >
                            Week
                        </button>
                    </div>
                </div>

                <div style={filtersContainer}>
                    <select value={taskTypeFilter} onChange={e => setTaskTypeFilter(e.target.value)} style={filterSelect}>
                        <option value="">All Types</option>
                        <option value="do">Do</option>
                        <option value="schedule">Schedule</option>
                        <option value="delegate">Delegate</option>
                        <option value="eliminate">Eliminate</option>
                    </select>
                    <select value={taskStatusFilter} onChange={e => setTaskStatusFilter(e.target.value)} style={filterSelect}>
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="late">Late</option>
                        <option value="incomplete">Incomplete</option>
                    </select>
                </div>

                <div style={scheduleContainer}>
                    {currentView === 'day' ? (
                        <DayScheduleView
                            sessions={filteredSessions}
                            selectedDate={selectedDate}
                            allTasks={allTasks}
                            users={users}
                            viewingUserId={userId}
                        />
                    ) : (
                        <WeekScheduleView
                            sessions={filteredSessions}
                            selectedDate={selectedDate}
                            allTasks={allTasks}
                            users={users}
                            viewingUserId={userId}
                        />
                    )}
                </div>

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
    zIndex: 1001
};

const modal = {
    position: 'relative',
    background: '#f0f0f0',
    padding: '2rem',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '1000px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column'
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

const controlsContainer = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    gap: '1rem'
};

const dateNavigation = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
};

const navButton = {
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const dateInput = {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    textAlign: 'center'
};

const viewToggle = {
    display: 'flex',
    gap: '0.5rem'
};

const toggleButton = {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: 'white'
};

const filtersContainer = {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem'
};

const filterSelect = {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc'
};

const scheduleContainer = {
    flex: 1,
    overflowY: 'auto',
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '1rem',
    backgroundColor: '#f9f9f9'
};