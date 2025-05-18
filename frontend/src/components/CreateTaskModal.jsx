// src/components/CreateTaskModal.jsx
import React, { useState } from 'react';
import TaskStep1 from './TaskStep1';
import TaskStep2 from './TaskStep2';
import { createTask } from '../api/tasks';  // ← was './api/tasks'

export default function CreateTaskModal({ onClose, taskTitle }) {
  const [step, setStep]     = useState(1);
  const [formData, setFormData] = useState({
    title:        taskTitle,
    description:  '',
    deadlineDate: '',
    deadlineTime: '',
    importance:   3,
    urgency:      3,
  });

  const handleNext = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(2);
  };

  const handleSubmit = async (data) => {
    const finalTask = { ...formData, ...data };
    const deadline = new Date(`${finalTask.deadlineDate}T${finalTask.deadlineTime}:00`);
    try {
      await createTask({
        title:       finalTask.title,
        description: finalTask.description,
        deadline:    deadline.toISOString(),
        importance:  finalTask.importance,
        urgency:     finalTask.urgency,
        owner_id:    1  // demo user; adjust as needed
      });
    } catch (err) {
      console.error('Error creating task:', err.message);
    }
    onClose();  // parent will re-fetch tasks
  };

  return (
    <div style={{
      position:'fixed', top:0, left:0, right:0, bottom:0,
      background:'rgba(0,0,0,0.5)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:1000
    }}>
      <div style={{
        background:'#cccccc',
        color:'#000',
        padding:'2rem',
        borderRadius:'8px',
        width:'500px'
      }}>
        {step === 1
          ? <TaskStep1 onNext={handleNext} defaultData={formData}/>
          : <TaskStep2 onSubmit={handleSubmit} defaultData={formData}/>
        }
      </div>
    </div>
  );
}
