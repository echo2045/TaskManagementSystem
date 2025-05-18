import { useState } from 'react';

function TaskStep1({ onNext, defaultData }) {
  const [description, setDescription] = useState(defaultData.description);
  const [date, setDate] = useState(defaultData.deadlineDate);
  const [time, setTime] = useState(defaultData.deadlineTime);

  return (
    <div>
      <h2>{defaultData.title}</h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>

      <textarea
        rows={5}
        placeholder="Enter Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ width: '100%' }}
      />

      <button onClick={() => onNext({ description, deadlineDate: date, deadlineTime: time })}>
        Enter
      </button>
    </div>
  );
}

export default TaskStep1;
