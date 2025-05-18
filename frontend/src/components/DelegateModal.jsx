// frontend/src/components/DelegateModal.jsx
import React, { useState, useEffect } from 'react';
import { getAssignees, addAssignee, removeAssignee } from '../api/tasks';

export default function DelegateModal({ taskId, onClose }) {
  const [assignees, setAssignees] = useState([]);
  const [newUserId, setNewUserId] = useState('');

  useEffect(() => {
    getAssignees(taskId).then(setAssignees).catch(console.error);
  }, [taskId]);

  const handleAdd = async () => {
    if (!newUserId) return;
    await addAssignee(taskId, +newUserId);
    setNewUserId('');
    const updated = await getAssignees(taskId);
    setAssignees(updated);
  };

  const handleRemove = async (userId) => {
    await removeAssignee(taskId, userId);
    setAssignees(prev => prev.filter(a => a.user_id !== userId));
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <button onClick={onClose} style={closeBtn}>×</button>
        <h3>Assignees</h3>
        <ul>
          {assignees.map(a => (
            <li key={a.user_id}>
              {a.full_name}
              <button onClick={() => handleRemove(a.user_id)} style={{ marginLeft:'1rem' }}>
                −
              </button>
            </li>
          ))}
        </ul>
        <div style={{ marginTop:'1rem' }}>
          <input
            placeholder="User ID"
            value={newUserId}
            onChange={e => setNewUserId(e.target.value)}
            style={{ width:'4ch', marginRight:'0.5rem' }}
          />
          <button onClick={handleAdd}>＋ Add</button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position:'fixed',top:0,left:0,right:0,bottom:0,
  background:'rgba(0,0,0,0.5)',display:'flex',
  alignItems:'center',justifyContent:'center',zIndex:1000
};
const modal = {
  background:'#cccccc',padding:'1.5rem',borderRadius:'8px',position:'relative'
};
const closeBtn = {
  position:'absolute',top:'0.5rem',right:'0.5rem',
  background:'transparent',border:'none',fontSize:'1.5rem',cursor:'pointer',color:'#000'
};
