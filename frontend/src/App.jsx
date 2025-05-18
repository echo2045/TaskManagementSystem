// frontend/src/App.jsx
import React, { useState } from 'react';
import PeopleList from './components/PeopleList';
import TaskBoard from './components/TaskBoard';
import ArchiveBoard from './components/ArchiveBoard';
import Notifications from './components/Notifications';
import SupervisorAllocation from './components/SupervisorAllocation';
import AddUser from './components/AddUser';

// Demo User with the correct ID
const currentUser = {
  user_id:   2,
  full_name: 'Demo User',
  avatar_url: null
};

export default function App() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [view, setView] = useState('tasks');

  const renderMain = () => {
    switch (view) {
      case 'tasks':
        return (
          <TaskBoard
            filterUser={selectedUser}
            currentUser={currentUser}    // ← now ID = 2
          />
        );
      case 'archive':
        return <ArchiveBoard filterUser={selectedUser} />;
      case 'allocate':
        return <SupervisorAllocation currentUser={currentUser} />;
      case 'addUser':
        return <AddUser />;
      default:
        return null;
    }
  };

  const links = [
    { key: 'tasks',    label: 'Tasks' },
    { key: 'archive',  label: 'Archive' },
    { key: 'allocate', label: 'Allocate Supervisor' },
    { key: 'addUser',  label: 'Add User' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: 'sans-serif'
    }}>
      {/* NAV BAR */}
      <nav style={{
        background: '#FFFFFF',
        color:      '#000000',
        padding:    '1rem 2rem',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid #CCCCCC'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>
          Task Management System
        </h1>
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           '0.5rem'
        }}>
          <img
            src={currentUser.avatar_url || 'https://www.gravatar.com/avatar/?d=mp&s=80'}
            alt="Avatar"
            style={{
              width:        48,
              height:       48,
              borderRadius: '50%',
              objectFit:    'cover',
              background:   '#fff'
            }}
          />
          <span style={{ fontSize: '1rem', color: '#000' }}>
            {currentUser.full_name}
          </span>
        </div>
      </nav>

      {/* BODY */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <PeopleList
          selectedUserId={selectedUser?.user_id}
          onSelectUser={setSelectedUser}
        />
        <main style={{
          flex:           1,
          display:        'flex',
          flexDirection:  'column',
          overflow:       'hidden',
          background:     '#FFFFFF',
          color:          '#000000',
          padding:        '1rem 2rem',
          boxSizing:      'border-box'
        }}>
          {renderMain()}
        </main>
        <aside style={{
          width:        '250px',
          padding:      '1rem',
          background:   '#FFFFFF',
          display:      'flex',
          flexDirection:'column',
          overflow:     'hidden'
        }}>
          <Notifications />
          <nav style={{
            marginTop:     '1rem',
            display:       'flex',
            flexDirection: 'column',
            gap:           '0.5rem'
          }}>
            {links.map(l => (
              <div
                key={l.key}
                onClick={() => setView(l.key)}
                style={{
                  cursor:      'pointer',
                  padding:     '0.5rem 1rem',
                  borderRadius:'4px',
                  background:  view === l.key ? '#666666' : 'transparent',
                  color:       view === l.key ? '#fff' : '#000',
                  fontWeight:  view === l.key ? 'bold' : 'normal',
                  textAlign:   'left'
                }}
              >
                {l.label}
              </div>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}
