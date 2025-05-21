// src/components/DelegateModal.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { getSupervisees, getUsers } from '../api/users';
import {
  getAssignees,
  addAssignee,
  removeAssignee
} from '../api/tasks';
import { interiorColors } from '../utils/getTaskColor';

export default function DelegateModal({ taskId, onClose }) {
  const { user } = useContext(AuthContext);
  const [assignees, setAssignees] = useState([]);
  const [available, setAvailable] = useState([]);

  // load current assignees & available users
  useEffect(() => {
    fetchAssignees();
  }, [taskId]);

  const fetchAssignees = async () => {
    const list = await getAssignees(taskId);
    setAssignees(list);
    fetchAvailable(list);
  };

  const fetchAvailable = async (assignedList) => {
    const loader = (user.role === 'manager' || user.role === 'hr')
      ? getUsers
      : () => getSupervisees(user.user_id);
    const all = await loader();
    const assignedIds = new Set(assignedList.map(a => a.user_id));
    setAvailable(all.filter(u => !assignedIds.has(u.user_id)));
  };

  const handleAdd = async u => {
    await addAssignee(taskId, u.user_id);
    fetchAssignees();
  };

  const handleRemove = async u => {
    await removeAssignee(taskId, u.user_id);
    fetchAssignees();
  };

  // modal uses delegate interior color (#E1F5FE)
  const modalBg = interiorColors['delegate'];

  return (
    <div style={overlay}>
      <div style={{ ...modalContent, background: modalBg }}>
        <button onClick={onClose} style={closeBtn}>×</button>
        <h2>Delegate Task</h2>

        <h3 style={{ marginTop: '1rem' }}>Current Assignees</h3>
        {assignees.length === 0 ? (
          <p>No one assigned yet.</p>
        ) : (
          assignees.map(u => (
            <div key={u.user_id} style={item}>
              <span>{u.full_name}</span>
              <button
                onClick={() => handleRemove(u)}
                style={removeBtn}
              >
                −
              </button>
            </div>
          ))
        )}

        <hr style={{ margin: '1rem 0' }} />

        <h3>Available to Assign</h3>
        {available.length === 0 ? (
          <p>None available.</p>
        ) : available.map(u => (
          <div key={u.user_id} style={item}>
            <span>{u.full_name}</span>
            <button
              onClick={() => handleAdd(u)}
              style={addBtn}
            >
              ＋
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// overlay dims the background
const overlay = {
  position:       'fixed',
  top:            0,
  left:           0,
  right:          0,
  bottom:         0,
  background:     'rgba(0,0,0,0.5)',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  zIndex:         1000
};

// modalContent uses the delegate interior color
const modalContent = {
  position:     'relative',
  padding:      '1.5rem',
  borderRadius: '8px',
  width:        '400px',
  maxHeight:    '80vh',
  overflowY:    'auto',
  boxSizing:    'border-box'
};

const closeBtn = {
  position:    'absolute',
  top:         '0.5rem',
  right:       '0.5rem',
  background:  'transparent',
  border:      'none',
  fontSize:    '1.5rem',
  cursor:      'pointer'
};

const item = {
  display:        'flex',
  justifyContent: 'space-between',
  alignItems:     'center',
  padding:        '0.5rem 0'
};

// remove (−) button styling
const removeBtn = {
  background:   '#E57373',
  borderRadius: '4px',
  border:       'none',
  color:        '#fff',
  padding:      '0.25rem 0.6rem',
  cursor:       'pointer'
};

// add (+) button now green, same size as remove
const addBtn = {
  background:   '#81C784',
  borderRadius: '4px',
  border:       'none',
  color:        '#fff',
  padding:      '0.25rem 0.6rem',
  cursor:       'pointer'
};
