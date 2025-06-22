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
import { FiHelpCircle } from 'react-icons/fi';
import EisenhowerHelpModal from './EisenhowerHelpModal';

export default function DelegateModal({ taskId, onClose }) {
  const { user } = useContext(AuthContext);
  const [assignees, setAssignees] = useState([]);
  const [available, setAvailable] = useState([]);
  const [pendingAssign, setPendingAssign] = useState({});
  const [showHelp, setShowHelp] = useState(false);

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

  const handleAddClick = (u) => {
    setPendingAssign(prev => ({
      ...prev,
      [u.user_id]: { importance: 5, urgency: 5 }
    }));
  };

  const handleSliderChange = (userId, key, value) => {
    setPendingAssign(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [key]: value
      }
    }));
  };

  const handleConfirmAssign = async (u) => {
    const { importance, urgency } = pendingAssign[u.user_id];
    await addAssignee(taskId, u.user_id, importance, urgency);
    setPendingAssign(prev => {
      const updated = { ...prev };
      delete updated[u.user_id];
      return updated;
    });
    fetchAssignees();
  };

  const handleRemove = async u => {
    await removeAssignee(taskId, u.user_id);
    fetchAssignees();
  };

  const modalBg = interiorColors['delegate'];

  return (
    <div style={overlay}>
      <div style={{ ...modalContent, background: modalBg }}>
        <button onClick={onClose} style={closeBtn}>×</button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Delegate Task</h2>
          <button onClick={() => setShowHelp(true)} style={helpBtn}>
            <FiHelpCircle size={22} />
          </button>
        </div>

        <h3 style={{ marginTop: '1rem' }}>Current Assignees</h3>
        <div style={scrollContainer}>
          {assignees.length === 0 ? (
            <p>No one assigned yet.</p>
          ) : (
            assignees.map(u => (
              <div key={u.user_id} style={assignedRow}>
                <span>{u.full_name}</span>
                <span style={scoreBox}>
                  {(u.importance ?? '—')} / {(u.urgency ?? '—')}
                </span>
                <button
                  onClick={() => handleRemove(u)}
                  style={removeBtn}
                >
                  −
                </button>
              </div>
            ))
          )}
        </div>

        <hr style={{ margin: '1rem 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h3>Available to Assign</h3>
          <button onClick={() => setShowHelp(true)} style={helpBtnInline}>
            <FiHelpCircle size={18} />
          </button>
        </div>

        <div style={scrollContainer}>
          {available.length === 0 ? (
            <p>None available.</p>
          ) : available.map(u => (
            <div key={u.user_id} style={{ marginBottom: '1rem' }}>
              <div style={item}>
                <span>{u.full_name}</span>
                {pendingAssign[u.user_id] ? null : (
                  <button
                    onClick={() => handleAddClick(u)}
                    style={addBtn}
                  >
                    ＋
                  </button>
                )}
              </div>

              {pendingAssign[u.user_id] && (
                <div style={sliderBox}>
                  <label>
                    Importance: {pendingAssign[u.user_id].importance}
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={pendingAssign[u.user_id].importance}
                      onChange={e =>
                        handleSliderChange(u.user_id, 'importance', Number(e.target.value))
                      }
                    />
                  </label>
                  <label>
                    Urgency: {pendingAssign[u.user_id].urgency}
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={pendingAssign[u.user_id].urgency}
                      onChange={e =>
                        handleSliderChange(u.user_id, 'urgency', Number(e.target.value))
                      }
                    />
                  </label>
                  <button
                    onClick={() => handleConfirmAssign(u)}
                    style={confirmBtn}
                  >
                    Confirm
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reusable Eisenhower Modal */}
        {showHelp && (
          <EisenhowerHelpModal visible={true} onClose={() => setShowHelp(false)} />
        )}
      </div>
    </div>
  );
}

// Styles
const overlay = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalContent = {
  position: 'relative',
  padding: '1.5rem',
  borderRadius: '8px',
  width: '480px',
  maxHeight: '80vh',
  overflow: 'hidden',
  boxSizing: 'border-box'
};

const closeBtn = {
  position: 'absolute',
  top: '0.5rem',
  right: '0.5rem',
  background: 'transparent',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer'
};

const helpBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#333'
};

const helpBtnInline = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  margin: 0
};

const item = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const addBtn = {
  background: '#81C784',
  borderRadius: '4px',
  border: 'none',
  color: '#fff',
  padding: '0.25rem 0.6rem',
  cursor: 'pointer'
};

const removeBtn = {
  background: '#E57373',
  borderRadius: '4px',
  border: 'none',
  color: '#fff',
  padding: '0.25rem 0.6rem',
  cursor: 'pointer'
};

const scrollContainer = {
  maxHeight: '180px',
  overflowY: 'auto',
  paddingRight: '5px'
};

const sliderBox = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  padding: '0.5rem 0'
};

const confirmBtn = {
  background: '#64B5F6',
  borderRadius: '4px',
  border: 'none',
  color: '#fff',
  padding: '0.3rem 0.6rem',
  cursor: 'pointer',
  alignSelf: 'flex-start'
};

const assignedRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.4rem 0'
};

const scoreBox = {
  flex: '0 0 80px',
  textAlign: 'center',
  fontWeight: 'bold'
};
