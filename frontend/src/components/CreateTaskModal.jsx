// src/components/CreateTaskModal.jsx
import React, { useState, useEffect } from 'react';
import { createTask } from '../api/tasks';
import TaskStep1 from './TaskStep1';
import TaskStep2 from './TaskStep2';
import TaskStepProjectSelect from './TaskStepProjectSelect';
import TaskStepAreaSelect from './TaskStepAreaSelect';

export default function CreateTaskModal({
  visible,
  onClose,
  ownerId,
  initialTitle = ''
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: initialTitle,
    description: '',
    deadline: '',
    importance: 3,
    urgency: 3,
    project_id: null,
    area_id: null,
    needsProjectSelect: false,
    needsAreaSelect: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStep(1);
    setForm({
      title: initialTitle,
      description: '',
      deadline: '',
      importance: 3,
      urgency: 3,
      project_id: null,
      area_id: null,
      needsProjectSelect: false,
      needsAreaSelect: false
    });
  }, [visible, initialTitle]);

  if (!visible) return null;

  const confirm = async () => {
    setLoading(true);
    try {
      await createTask({ ...form, owner_id: ownerId });
      onClose();
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
            onNext={(updatedFlags) => {
              setForm(v => {
                const updatedForm = { ...v, ...updatedFlags };
                if (updatedForm.needsProjectSelect || updatedForm.needsAreaSelect) {
                  setStep(2);
                } else {
                  setStep(3);
                }
                return updatedForm;
              });
            }}
          />
        )}

        {step === 2 && (
          form.needsProjectSelect ? (
            <TaskStepProjectSelect
              values={form}
              onChange={f => setForm(v => ({ ...v, ...f }))}
              onNext={() => setStep(3)}
            />
          ) : form.needsAreaSelect ? (
            <TaskStepAreaSelect
              values={form}
              onChange={f => setForm(v => ({ ...v, ...f }))}
              onNext={() => setStep(3)}
            />
          ) : null
        )}

        {step === 3 && (
          <TaskStep2
            values={form}
            onChange={f => setForm(v => ({ ...v, ...f }))}
            onBack={() => {
              if (form.needsProjectSelect || form.needsAreaSelect) {
                setStep(2);
              } else {
                setStep(1);
              }
            }}
            onConfirm={confirm}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modal = {
  position: 'relative',
  background: '#cccccc',
  padding: '2rem',
  borderRadius: '8px',
  width: '400px',
  boxSizing: 'border-box'
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
