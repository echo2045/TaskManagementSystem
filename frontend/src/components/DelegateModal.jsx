// src/components/DelegateModal.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { getSupervisees, getUsers, getUserById } from '../api/users';
import {
  getAssignees,
  addAssignee,
  removeAssignee,
  updateTask,
  getTask
} from '../api/tasks';
import { interiorColors } from '../utils/getTaskColor';
import { FiHelpCircle } from 'react-icons/fi';
import EisenhowerHelpModal from './EisenhowerHelpModal';

export default function DelegateModal({ taskId, onClose, requesterId }) {
  const isRequestDelegation = !!requesterId;
  console.log('[DelegateModal] - Render', { taskId, requesterId });
  const { user } = useContext(AuthContext);
  const [task, setTask] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [available, setAvailable] = useState([]);
  const [pendingAssign, setPendingAssign] = useState({});
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTaskDetails = async () => {
        const taskDetails = await getTask(taskId);
        setTask(taskDetails);
    };
    fetchTaskDetails();
    fetchAssignees();
  }, [taskId]);

  const fetchAssignees = async () => {
    const list = await getAssignees(taskId);
    setAssignees(list);
    fetchAvailable(list);
  };

  const fetchAvailable = async (assignedList) => {
    if (requesterId) {
      const user = await getUserById(requesterId);
      setAvailable([user]);
    } else {
      const loader = (user.role === 'manager' || user.role === 'hr')
        ? getUsers
        : () => getSupervisees(user.user_id);
      const all = await loader();
      const assignedIds = new Set(assignedList.map(a => a.user_id));
      setAvailable(
        all.filter(u => !assignedIds.has(u.user_id) && u.user_id !== user.user_id)
      );
    }
  };

  const handleAddClick = (u) => {
    const today = new Date().toLocaleDateString('en-CA');
    setPendingAssign(prev => ({
      ...prev,
      [u.user_id]: { importance: 5, urgency: 5, start_date: today, time_estimate: task ? task.time_estimate : '' }
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

  const handleDateChange = (userId, value) => {
    setPendingAssign(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        start_date: value
      }
    }));
  };

  const handleTimeEstimateChange = (userId, value) => {
    setPendingAssign(prev => ({
        ...prev,
        [userId]: {
            ...prev[userId],
            time_estimate: value
        }
    }));
  };

  const toUtcIsoDate = (dateStr) => {
    if (!dateStr) return null;
    const localDate = new Date(dateStr);
    localDate.setUTCHours(0, 0, 0, 0);
    return localDate.toISOString();
  };

  const handleConfirmAssign = async (u) => {
    const { importance, urgency, start_date, time_estimate } = pendingAssign[u.user_id];
    if (!start_date) return alert('Start date required');
    if (!time_estimate) return alert('Time estimate is required');
    const isoDate = toUtcIsoDate(start_date);
    await addAssignee(taskId, u.user_id, importance, urgency, isoDate, time_estimate ? Number(time_estimate) : null);
    setPendingAssign(prev => {
      const updated = { ...prev };
      delete updated[u.user_id];
      return updated;
    });
    // Remove the assigned user from the available list
    setAvailable(prev => prev.filter(user => user.user_id !== u.user_id));
    fetchAssignees();
    onClose(); // Close the modal after successful assignment
  };

  const handleRemove = async u => {
    await removeAssignee(taskId, u.user_id);
    fetchAssignees();
  };

  const filteredAvailable = available.filter(u =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const modalBg = interiorColors['delegate'];

  return (
    <div style={overlay}>
      <div style={{ ...modalContent, background: modalBg }}>
        <button onClick={() => { console.log('[DelegateModal] - onClose clicked'); onClose(); }} style={closeBtn}>×</button>
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
                <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                  {u.start_date ? new Date(u.start_date).toLocaleDateString('en-CA') : '—'}
                </span>
                <button onClick={() => handleRemove(u)} style={removeBtn}>−</button>
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

        {isRequestDelegation ? null : (
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={searchInput}
          />
        )}

        <div style={scrollContainer}>
          {filteredAvailable.length === 0 ? (
            <p>No matching users found.</p>
          ) : filteredAvailable.map(u => (
            <div key={u.user_id} style={{ marginBottom: '1rem' }}>
              <div style={item}>
                <span>{u.full_name}</span>
                {pendingAssign[u.user_id] ? null : (
                  <button onClick={() => handleAddClick(u)} style={addBtn}>＋</button>
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
                      onChange={e => handleSliderChange(u.user_id, 'importance', Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Urgency: {pendingAssign[u.user_id].urgency}
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={pendingAssign[u.user_id].urgency}
                      onChange={e => handleSliderChange(u.user_id, 'urgency', Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Start Date:
                    <input
                      type="date"
                      value={pendingAssign[u.user_id].start_date}
                      onChange={e => handleDateChange(u.user_id, e.target.value)}
                      style={{ marginLeft: '0.5rem' }}
                    />
                  </label>
                  <label>
                    Time Estimate (hours):
                    <input
                      type="number"
                      value={pendingAssign[u.user_id].time_estimate}
                      onChange={e => handleTimeEstimateChange(u.user_id, e.target.value)}
                      placeholder="e.g., 4.5"
                      style={{ marginLeft: '0.5rem' }}
                      required
                    />
                  </label>
                  <button onClick={() => handleConfirmAssign(u)} style={confirmBtn}>Confirm</button>
                </div>
              )}
            </div>
          ))}
        </div>

        <EisenhowerHelpModal visible={showHelp} onClose={() => setShowHelp(false)} />
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
  width: '520px',
  maxHeight: '85vh',
  overflow: 'hidden',
  boxSizing: 'border-box',
  background: '#f0f0f0'
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

const closeBtn = {
  position: 'absolute',
  top: '0.5rem',
  right: '0.5rem',
  background: 'transparent',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer'
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

const searchInput = {
  width: '100%',
  padding: '0.4rem 0.5rem',
  marginBottom: '0.8rem',
  borderRadius: '4px',
  border: '1px solid #ccc'
};