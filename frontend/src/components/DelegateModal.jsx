// src/components/DelegateModal.jsx
import React, { useState, useEffect } from 'react';
import { getUsers }                 from '../api/users';  // ← fixed path
import { getAssignees, addAssignee, removeAssignee } from '../api/tasks';

export default function DelegateModal({ taskId, onClose }) {
  const [allUsers,   setAllUsers]   = useState([]);
  const [assignees,  setAssignees]  = useState([]);

  useEffect(() => {
    getUsers().then(setAllUsers).catch(console.error);
    getAssignees(taskId).then(setAssignees).catch(console.error);
  }, [taskId]);

  const toggleUser = async (u) => {
    if (assignees.some(a => a.user_id === u.user_id)) {
      await removeAssignee(taskId, u.user_id);
    } else {
      await addAssignee(taskId, u.user_id);
    }
    setAssignees(await getAssignees(taskId));
  };

  return (
    <div style={{
      position:      'fixed',
      top:           0, left: 0, right: 0, bottom: 0,
      background:    'rgba(0,0,0,0.5)',
      display:       'flex',
      alignItems:    'center',
      justifyContent:'center',
      zIndex:        1000
    }}>
      <div style={{
        position:     'relative',
        background:   '#cccccc',
        padding:      '2rem',
        borderRadius: '8px',
        width:        '400px',
        maxHeight:    '80vh',
        overflowY:    'auto'
      }}>
        <button
          onClick={onClose}
          style={{
            position:   'absolute',
            top:        '0.5rem',
            right:      '0.5rem',
            background: 'transparent',
            border:     'none',
            fontSize:   '1.5rem',
            cursor:     'pointer',
            color:      '#000'
          }}
        >
          ×
        </button>
        <h3>Delegate Task</h3>

        <div>
          <h4>Current Assignees</h4>
          {assignees.map(u => (
            <div key={u.user_id} style={{
              display:       'flex',
              justifyContent:'space-between',
              alignItems:    'center',
              margin:        '0.5rem 0'
            }}>
              <span>{u.full_name}</span>
              <button onClick={() => toggleUser(u)} style={{
                border:       'none',
                background:   '#e57373',
                color:        '#fff',
                padding:      '0.3rem 0.6rem',
                borderRadius: '4px',
                cursor:       'pointer'
              }}>−</button>
            </div>
          ))}
        </div>

        <hr />

        <div>
          <h4>Available Users</h4>
          {allUsers.filter(u => !assignees.some(a => a.user_id === u.user_id))
            .map(u => (
            <div key={u.user_id} style={{
              display:       'flex',
              justifyContent:'space-between',
              alignItems:    'center',
              margin:        '0.5rem 0'
            }}>
              <span>{u.full_name}</span>
              <button onClick={() => toggleUser(u)} style={{
                border:       'none',
                background:   '#64b5f6',
                color:        '#fff',
                padding:      '0.3rem 0.6rem',
                borderRadius: '4px',
                cursor:       'pointer'
              }}>＋</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
