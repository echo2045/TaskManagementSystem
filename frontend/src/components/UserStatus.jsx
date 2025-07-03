import React, { useState, useEffect, useCallback, useContext } from 'react';
import { getCurrentTask, getWorkHistory } from '../api/tasks';
import { getSupervisees } from '../api/users';
import WorkHistoryModal from './WorkHistoryModal';
import { useSocket } from '../SocketContext'; // Import useSocket
import { AuthContext } from '../AuthContext'; // Import AuthContext

export default function UserStatus({ selectedUser, currentUser }) {
    const { user: authUser } = useContext(AuthContext);
    const socket = useSocket();
    const [currentTask, setCurrentTask] = useState(null);
    const [workHistory, setWorkHistory] = useState([]);
    const [isHistoryVisible, setHistoryVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(true);
    const [displayUserId, setDisplayUserId] = useState(currentUser.user_id);
    const [historyView, setHistoryView] = useState('day'); // State to control the view in WorkHistoryModal
    const [initialHistoryDate, setInitialHistoryDate] = useState(new Date()); // State to control the initial date for WorkHistoryModal

    useEffect(() => {
        const checkAccess = async () => {
            if (!selectedUser) {
                setDisplayUserId(currentUser.user_id);
                setHasAccess(true);
                return;
            }

            if (currentUser.user_id === selectedUser.user_id) {
                setDisplayUserId(currentUser.user_id);
                setHasAccess(true);
                return;
            }

            if (currentUser.role === 'manager' || currentUser.role === 'hr') {
                setDisplayUserId(selectedUser.user_id);
                setHasAccess(true);
                return;
            }

            if (currentUser.role === 'team_lead') {
                try {
                    const supervisees = await getSupervisees(currentUser.user_id);
                    const isSupervisee = supervisees.some(s => s.user_id === selectedUser.user_id);
                    if (isSupervisee) {
                        setDisplayUserId(selectedUser.user_id);
                        setHasAccess(true);
                    } else {
                        setHasAccess(false);
                    }
                } catch (error) {
                    console.error("Error fetching supervisees:", error);
                    setHasAccess(false);
                }
                return;
            }

            setHasAccess(false);
        };

        checkAccess();
    }, [selectedUser, currentUser]);

    const fetchStatus = useCallback(async () => {
        if (!hasAccess || !displayUserId) {
            setIsLoading(false);
            setCurrentTask(null);
            return;
        }
        try {
            setIsLoading(true);
            console.log(`UserStatus: Fetching current task for displayUserId: ${displayUserId}`);
            const task = await getCurrentTask(displayUserId);
            console.log('UserStatus: Received current task:', task);
            setCurrentTask(task);
        } catch (error) {
            console.error("Error fetching user status:", error);
        } finally {
            setIsLoading(false);
        }
    }, [hasAccess, displayUserId]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    useEffect(() => {
        if (!socket) return;

        const handleWorkSessionUpdate = ({ userId }) => {
            console.log(`UserStatus: Received workSessionUpdate for userId: ${userId}, current displayUserId: ${displayUserId}`);
            if (userId === displayUserId) {
                fetchStatus();
            }
        };

        socket.on('workSessionUpdate', handleWorkSessionUpdate);

        return () => {
            socket.off('workSessionUpdate', handleWorkSessionUpdate);
        };
    }, [socket, displayUserId, fetchStatus]);

    const handleShowHistory = async () => {
        if (!hasAccess || !displayUserId) return;
        try {
            console.log(`UserStatus: Fetching work history for displayUserId: ${displayUserId}`);
            const history = await getWorkHistory(displayUserId);
            console.log('UserStatus: Received work history:', history);
            setWorkHistory(history);
            let calculatedInitialHistoryDate;
            try {
                if (currentTask && typeof currentTask.start_time === 'string' && currentTask.start_time.length > 0) {
                    // Attempt to parse as UTC by replacing space with 'T' and appending 'Z'
                    calculatedInitialHistoryDate = new Date(currentTask.start_time.replace(' ', 'T') + 'Z');
                    // Validate if the date is actually valid after parsing
                    if (isNaN(calculatedInitialHistoryDate.getTime())) {
                        throw new RangeError("Invalid Date after parsing");
                    }
                } else {
                    calculatedInitialHistoryDate = new Date();
                }
            } catch (error) {
                console.error('UserStatus: Error parsing currentTask.start_time:', currentTask?.start_time, 'Error:', error);
                calculatedInitialHistoryDate = new Date(); // Fallback to current date to prevent crash
            }
            console.log('UserStatus: currentTask.start_time:', currentTask?.start_time);
            console.log('UserStatus: Calculated initialHistoryDate:', calculatedInitialHistoryDate);
            setInitialHistoryDate(calculatedInitialHistoryDate);
            setHistoryVisible(true);
        } catch (error) {
            console.error("Error fetching work history:", error);
        }
    };

    if (!hasAccess) {
        return (
            <div style={statusContainer}>
                <div style={statusText}>
                    <strong>Access Denied:</strong> You do not have permission to view this user's activity status.
                </div>
            </div>
        );
    }

    if (isLoading) {
        return <div>Loading status...</div>;
    }

    return (
        <div style={statusContainer}>
            <div style={statusText}>
                <strong>Current Status for {selectedUser ? selectedUser.full_name : 'You'}:</strong>
                {currentTask ? (
                    <span> Working on: <em>{currentTask.title}</em> (since {new Date(currentTask.start_time).toLocaleTimeString()})</span>
                ) : (
                    <span> Currently not working on any task.</span>
                )}
            </div>
            <button onClick={handleShowHistory} style={historyButton}>View History</button>

            {isHistoryVisible && displayUserId && (
                <WorkHistoryModal
                    userId={displayUserId}
                    onClose={() => setHistoryVisible(false)}
                    currentView={historyView}
                    onCurrentViewChange={setHistoryView}
                    initialHistoryDate={initialHistoryDate}
                />
            )}
        </div>
    );
}

const statusContainer = {
    padding: '1rem',
    backgroundColor: '#f0f0f0',
    borderRadius: '8px',
    margin: '1rem 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

const statusText = {
    fontSize: '1rem'
};

const historyButton = {
    padding: '0.5rem 1rem',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
};
