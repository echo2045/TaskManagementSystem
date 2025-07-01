// src/components/UserStatus.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getCurrentTask, getWorkHistory } from '../api/tasks';
import WorkHistoryModal from './WorkHistoryModal';

export default function UserStatus({ userId }) {
    const [currentTask, setCurrentTask] = useState(null);
    const [workHistory, setWorkHistory] = useState([]);
    const [isHistoryVisible, setHistoryVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        try {
            setIsLoading(true);
            const task = await getCurrentTask(userId);
            setCurrentTask(task);
        } catch (error) {
            console.error("Error fetching user status:", error);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const handleShowHistory = async () => {
        try {
            const history = await getWorkHistory(userId);
            setWorkHistory(history);
            setHistoryVisible(true);
        } catch (error) {
            console.error("Error fetching work history:", error);
        }
    };

    if (isLoading) {
        return <div>Loading status...</div>;
    }

    return (
        <div style={statusContainer}>
            <div style={statusText}>
                <strong>Current Status:</strong>
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
