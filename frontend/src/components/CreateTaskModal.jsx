// frontend/src/components/CreateTaskModal.jsx
import React, { useState } from 'react';
import TaskStep1 from './TaskStep1';
import TaskStep2 from './TaskStep2';
import { createTask } from '../api/tasks';

export default function CreateTaskModal({ onClose, taskTitle, ownerId }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title:        taskTitle,
    description:  '',
    deadlineDate: '',
    deadlineTime: '',
    importance:   3,
    urgency:      3
  });

  const handleNext = data => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(2);
  };

  const handleSubmit = async data => {
    const all = { ...formData, ...data };
    const iso = new Date(`${all.deadlineDate}T${all.deadlineTime}:00`).toISOString();

    const payload = {
      title:       all.title,
      description: all.description,
      deadline:    iso,
      importance:  all.importance,
      urgency:     all.urgency,
      owner_id:    ownerId              // ← 2
    };

    console.log('📝 Creating task payload:', payload);
    try {
      await createTask(payload);
      onClose();
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Failed to create task—see console.');
    }
  };

  return (
    <div style={{
      position:'fixed', top:0, left:0, right:0, bottom:0,
      background:'rgba(0,0,0,0.5)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:1000
    }}>
      <div style={{
        background:'#cccccc',
        padding:'2rem',
        borderRadius:'8px',
        width:'500px',
        boxSizing:'border-box'
      }}>
        {step === 1
          ? <TaskStep1 onNext={handleNext} defaultData={formData}/>
          : <TaskStep2 onSubmit={handleSubmit} defaultData={formData}/>
        }
      </div>
    </div>
  );
}
