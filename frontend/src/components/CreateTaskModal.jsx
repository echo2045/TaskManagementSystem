// src/components/CreateTaskModal.jsx
import React, { useState } from 'react';
import TaskStep1 from './TaskStep1';
import TaskStep2 from './TaskStep2';
import { createTask } from '../api/tasks';

export default function CreateTaskModal({
  visible,
  onClose,
  onCreated,
  ownerId,
  initialTitle = ''
}) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    title:       initialTitle,
    description: '',
    deadlineDate:'',
    deadlineTime:'',
    importance:  3,
    urgency:     3
  });

  const handleNext = step1Data => {
    setData(d => ({ ...d, ...step1Data, title: initialTitle }));
    setStep(2);
  };

  const handleBack = () => setStep(1);

  const handleSubmit = async step2Data => {
    const combined = { ...data, ...step2Data };
    const dt = new Date(`${combined.deadlineDate}T${combined.deadlineTime}`);
    try {
      await createTask({
        title:       combined.title,
        description: combined.description,
        deadline:    dt.toISOString(),
        importance:  combined.importance,
        urgency:     combined.urgency,
        owner_id:    ownerId
      });
      onCreated();
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  if (!visible) return null;

  return (
    <div style={{
      position:'fixed', top:0, left:0, right:0, bottom:0,
      background:'rgba(0,0,0,0.5)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:1000
    }}>
      <div style={{
        position:'relative',
        background:'#cccccc',
        padding:'2rem',
        borderRadius:'8px',
        width:'400px',
        boxSizing:'border-box'
      }}>
        <button
          onClick={onClose}
          style={{
            position:'absolute', top:'0.5rem', right:'0.5rem',
            background:'transparent', border:'none',
            fontSize:'1.5rem', cursor:'pointer'
          }}
          aria-label="Close"
        >×</button>

        {step === 1 ? (
          <TaskStep1
            defaultData={data}
            onNext={handleNext}
          />
        ) : (
          <TaskStep2
            defaultData={data}
            onBack={handleBack}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
