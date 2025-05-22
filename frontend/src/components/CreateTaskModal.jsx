// src/components/CreateTaskModal.jsx
import React, { useState, useEffect } from 'react';
import { createTask }                  from '../api/tasks';
import TaskStep1                       from './TaskStep1';
import TaskStep2                       from './TaskStep2';

export default function CreateTaskModal({
  visible,
  onClose,
  ownerId,
  initialTitle = ''
}) {
  const [step,   setStep] = useState(1);
  const [form,   setForm] = useState({
    title:       initialTitle,
    description: '',
    deadline:    '',
    importance:  3,
    urgency:     3
  });
  const [loading, setLoading] = useState(false);

  // ALWAYS reset step & form whenever `visible` toggles
  useEffect(() => {
    setStep(1);
    setForm({
      title:       initialTitle,
      description: '',
      deadline:    '',
      importance:  3,
      urgency:     3
    });
  }, [visible, initialTitle]);

  if (!visible) return null;

  const next    = () => setStep(s => Math.min(s + 1, 2));
  const back    = () => setStep(s => Math.max(s - 1, 1));
  const confirm = async () => {
    setLoading(true);
    try {
      await createTask({ ...form, owner_id: ownerId });
      onClose();               // ← closes the modal immediately
    } catch (err) {
      console.error('CreateTask error', err);
      alert('Could not create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <button onClick={onClose} style={closeBtn} aria-label="Close">×</button>

        {step === 1 && (
          <TaskStep1
            values={form}
            onChange={f => setForm(v => ({ ...v, ...f }))}
            onNext={next}
          />
        )}
        {step === 2 && (
          <TaskStep2
            values={form}
            onChange={f => setForm(v => ({ ...v, ...f }))}
            onBack={back}
            onConfirm={confirm}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

// Styles
const overlay = {
  position:    'fixed',
  top:         0,
  left:        0,
  right:       0,
  bottom:      0,
  background:  'rgba(0,0,0,0.5)',
  display:     'flex',
  justifyContent:'center',
  alignItems:  'center',
  zIndex:      1000
};
const modal = {
  position:    'relative',
  background:  '#cccccc',
  padding:     '2rem',
  borderRadius:'8px',
  width:       '400px',
  boxSizing:   'border-box'
};
const closeBtn = {
  position: 'absolute',
  top:      '0.5rem',
  right:    '0.5rem',
  border:   'none',
  background:'transparent',
  fontSize: '1.5rem',
  cursor:   'pointer'
};
