import React, { useState, useEffect, useCallback } from 'react';
import { getCurrentTask, getWorkHistory } from '../api/tasks';
import { getSupervisees } from '../api/users';
import WorkHistoryModal from './WorkHistoryModal';

export default function UserStatus({ selectedUser, currentUser }) {
    const [currentTask, setCurrentTask] = useState(null);
    const [workHistory, setWorkHistory] = useState([]);
    const [isHistoryVisible, setHistoryVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(true);
    const [displayUserId, setDisplayUserId] = useState(currentUser.user_id);

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
            const task = await getCurrentTask(displayUserId);
            setCurrentTask(task);
        } catch (error) {
            console.error("Error fetching user status:", error);
        } finally {
            setIsLoading(false);
        }
    }, [hasAccess, displayUserId]);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const handleShowHistory = async () => {
        if (!hasAccess || !displayUserId) return;
        try {
            const history = await getWorkHistory(displayUserId);
            setWorkHistory(history);
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

            {isHistoryVisible && (
                <WorkHistoryModal
                    history={workHistory}
                    onClose={() => setHistoryVisible(false)}
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
