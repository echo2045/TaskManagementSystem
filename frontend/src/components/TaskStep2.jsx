import { useState } from 'react';

function TaskStep2({ onSubmit, defaultData }) {
  const [importance, setImportance] = useState(defaultData.importance);
  const [urgency, setUrgency] = useState(defaultData.urgency);

  const sliderWidth = '80%'; // consistent width for labels + slider

  return (
    <div>
      <h2>{defaultData.title}</h2>

      {/* Importance Slider */}
      <div style={{ marginBottom: '2rem' }}>
        <p>How Important is the task?</p>
        <div style={{ width: sliderWidth, margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            marginBottom: '0.25rem'
          }}>
            {[1, 2, 3, 4, 5].map(n => <span key={n}>{n}</span>)}
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={importance}
            onChange={(e) => setImportance(+e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Urgency Slider */}
      <div>
        <p>How Urgent is the task?</p>
        <div style={{ width: sliderWidth, margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            marginBottom: '0.25rem'
          }}>
            {[1, 2, 3, 4, 5].map(n => <span key={n}>{n}</span>)}
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={urgency}
            onChange={(e) => setUrgency(+e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <button onClick={() => onSubmit({ importance, urgency })} style={{ marginTop: '1rem' }}>
        Confirm
      </button>
    </div>
  );
}

export default TaskStep2;
