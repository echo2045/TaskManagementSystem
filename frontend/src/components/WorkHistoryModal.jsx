// src/components/WorkHistoryModal.jsx
import React from 'react';

export default function WorkHistoryModal({ history, onClose }) {

    const calculateTotalHours = (sessions) => {
        return sessions.reduce((acc, session) => acc + (session.hours_spent ? parseFloat(session.hours_spent) : 0), 0).toFixed(2);
    };

    const calculateTimeDifference = (estimated, spent) => {
        if (estimated === null || spent === null) return 'N/A';
        const difference = estimated - spent;
        return difference.toFixed(2);
    };

    return (
        <div style={overlay}>
            <div style={modal}>
                <button onClick={onClose} style={closeBtn}>×</button>
                <h2>Work History</h2>
                <div style={scrollContainer}>
                    {history.length > 0 ? (
                        <table style={table}>
                            <thead>
                                <tr>
                                    <th style={th}>Task</th>
                                    <th style={th}>Start Time</th>
                                    <th style={th}>End Time</th>
                                    <th style={th}>Duration (hours)</th>
                                    <th style={th}>Estimated (hours)</th>
                                    <th style={th}>Difference</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(session => (
                                    <tr key={session.session_id}>
                                        <td style={td}>{session.title}</td>
                                        <td style={td}>{new Date(session.start_time).toLocaleString()}</td>
                                        <td style={td}>{session.end_time ? new Date(session.end_time).toLocaleString() : 'In Progress'}</td>
                                        <td style={td}>{session.hours_spent ? parseFloat(session.hours_spent).toFixed(2) : '-'}</td>
                                        <td style={td}>{session.time_estimate || 'N/A'}</td>
                                        <td style={td}>{calculateTimeDifference(session.time_estimate, session.hours_spent)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="3" style={{...td, textAlign: 'right', fontWeight: 'bold'}}>Total Hours:</td>
                                    <td style={{...td, fontWeight: 'bold'}}>{calculateTotalHours(history)}</td>
                                    <td colSpan="2"></td>
                                </tr>
                            </tfoot>
                        </table>
                    ) : (
                        <p>No work history found.</p>
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
    background: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    width: '80%',
    maxWidth: '800px',
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

const scrollContainer = {
    overflowY: 'auto'
};

const table = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem'
};

const th = {
    borderBottom: '2px solid #ddd',
    padding: '0.75rem',
    textAlign: 'left',
    backgroundColor: '#f7f7f7'
};

const td = {
    borderBottom: '1px solid #ddd',
    padding: '0.75rem',
    textAlign: 'left'
};
