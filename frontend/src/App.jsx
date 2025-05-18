// src/App.jsx
import React, { useState } from 'react';
import PeopleList from './components/PeopleList';
import TaskBoard from './components/TaskBoard';
import ArchiveBoard from './components/ArchiveBoard';
import Notifications from './components/Notifications';
import SupervisorAllocation from './components/SupervisorAllocation';
import AddUser from './components/AddUser';

// Example current user (replace with real auth user later)
const currentUser = {
  user_id: 1,
  full_name: 'Demo User',
  avatar_url: null // or a real URL
};

export default function App() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [view, setView] = useState('tasks');

  const renderMain = () => {
    switch (view) {
      case 'tasks':
        return <TaskBoard filterUser={selectedUser} />;
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
        background:      '#FFFFFF',
        color:           '#000000',
        padding:         '1rem 2rem',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        borderBottom:    '2px solid #CCCCCC',
        boxShadow:       '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Left: Title */}
        <h1 style={{ margin: 0, fontSize: '2rem' }}>
          Task Management System
        </h1>

        {/* Right: User Avatar + Name */}
        <div style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            '0.5rem'
        }}>
          <img
            src={currentUser.avatar_url || 'https://www.gravatar.com/avatar/?d=mp&s=80'}
            alt="User Avatar"
            style={{
              width:         48,
              height:        48,
              borderRadius:  '50%',
              objectFit:     'cover',
              background:    '#fff'
            }}
          />
          <span style={{ fontSize: '1rem', color: '#000' }}>
            {currentUser.full_name}
          </span>
        </div>
      </nav>

      {/* BODY */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT: People */}
        <PeopleList
          selectedUserId={selectedUser?.user_id}
          onSelectUser={setSelectedUser}
        />

        {/* CENTER */}
        <main style={{
          flex:             1,
          display:          'flex',
          flexDirection:    'column',
          overflow:         'hidden',
          background:       '#FFFFFF',
          color:            '#000000',
          padding:          '1rem 2rem',
          boxSizing:        'border-box'
        }}>
          {renderMain()}
        </main>

        {/* RIGHT: Notifications + Links */}
        <aside style={{
          width:          '250px',
          padding:        '1rem',
          boxSizing:      'border-box',
          background:     '#FFFFFF',
          display:        'flex',
          flexDirection:  'column',
          overflow:       'hidden',
          boxShadow:      '-2px 0 4px rgba(0,0,0,0.1)'
        }}>
          <Notifications />

          <nav style={{
            marginTop:      '1rem',
            display:        'flex',
            flexDirection:  'column',
            gap:            '0.5rem'
          }}>
            {links.map(link => (
              <div
                key={link.key}
                onClick={() => setView(link.key)}
                style={{
                  cursor:      'pointer',
                  padding:     '0.5rem 1rem',
                  borderRadius:'4px',
                  background:  view === link.key ? '#666666' : 'transparent',
                  color:       view === link.key ? '#fff' : '#000',
                  fontWeight:  view === link.key ? 'bold' : 'normal',
                  textAlign:   'left'
                }}
              >
                {link.label}
              </div>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}
