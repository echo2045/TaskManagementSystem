// src/App.jsx
import React, { useState } from 'react';
import PeopleList             from './components/PeopleList';
import TaskBoard              from './components/TaskBoard';
import ArchiveBoard           from './components/ArchiveBoard';
import SupervisorAllocation   from './components/SupervisorAllocation';
import AddUser                from './components/AddUser';
import ChangePassword         from './components/ChangePassword';
import Notifications          from './components/Notifications';

const currentUser = {
  user_id:   2,
  full_name: 'Demo User',
  avatar_url: null
};

export default function App() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [view, setView]                 = useState('tasks');
  const [showNotif, setShowNotif]       = useState(false);

  const renderMain = () => {
    switch (view) {
      case 'tasks':
        return <TaskBoard filterUser={selectedUser} currentUser={currentUser} />;
      case 'archive':
        return <ArchiveBoard filterUser={selectedUser} />;
      case 'allocate':
        return <SupervisorAllocation currentUser={currentUser} />;
      case 'addUser':
        return <AddUser />;
      case 'changePassword':
        return <ChangePassword userId={currentUser.user_id} />;
      default:
        return null;
    }
  };

  const links = [
    { key: 'tasks',          label: 'Tasks' },
    { key: 'archive',        label: 'Archive' },
    { key: 'allocate',       label: 'Allocate Supervisor' },
    { key: 'addUser',        label: 'Add User' },
    { key: 'changePassword', label: 'Change Password' }  // new link
  ];

  const handleLogout = () => {
    alert('Logged out');
  };

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      width:          '100vw',
      height:         '100vh',
      overflow:       'hidden',
      fontFamily:     'sans-serif'
    }}>
      {/* NAV BAR */}
      <nav style={{
        position:      'relative',
        background:    '#FFFFFF',
        padding:       '1rem 2rem',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'space-between',
        borderBottom:  '2px solid #CCCCCC'
      }}>
        <h1 style={{ margin:0, fontSize:'2rem' }}>
          Task Management System
        </h1>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button
            onClick={() => setShowNotif(v => !v)}
            style={{
              background:'transparent',
              border:'none',
              fontSize:'1.5rem',
              cursor:'pointer'
            }}
            aria-label="Toggle notifications"
          >
            🔔
          </button>
          <div style={{
            display:'flex', flexDirection:'column',
            alignItems:'center', gap:'0.5rem'
          }}>
            <img
              src={currentUser.avatar_url || 'https://www.gravatar.com/avatar/?d=mp&s=80'}
              alt="Avatar"
              style={{
                width:48, height:48,
                borderRadius:'50%', objectFit:'cover',
                background:'#fff'
              }}
            />
            <span style={{ fontSize:'1rem', color:'#000' }}>
              {currentUser.full_name}
            </span>
          </div>
        </div>

        {/* Notifications Overlay */}
        {showNotif && (
          <div style={{
            position:     'absolute',
            top:          '100%',
            right:        '2rem',
            width:        '300px',
            maxHeight:    '400px',
            background:   '#FFE0B2',
            boxShadow:    '0 2px 8px rgba(0,0,0,0.2)',
            borderRadius: '4px',
            overflowY:    'auto',
            zIndex:       1000
          }}>
            <Notifications />
          </div>
        )}
      </nav>

      {/* BODY */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* LEFT: People list */}
        <PeopleList
          selectedUserId={selectedUser?.user_id}
          onSelectUser={setSelectedUser}
        />

        {/* CENTER: main content */}
        <main style={{
          flex:1,
          display:'flex',
          flexDirection:'column',
          overflow:'hidden',
          background:'#FAFAFA',
          padding:'1rem 2rem',
          boxSizing:'border-box'
        }}>
          {renderMain()}
        </main>

        {/* RIGHT: Navigation links + logout */}
        <aside style={{
          width:'250px',
          padding:'1rem',
          background:'#FFFFFF',
          display:'flex',
          flexDirection:'column',
          boxShadow:'-2px 0 4px rgba(0,0,0,0.1)'
        }}>
          <nav style={{
            display:'flex',
            flexDirection:'column',
            gap:'0.5rem'
          }}>
            {links.map(l => (
              <div
                key={l.key}
                onClick={() => setView(l.key)}
                style={{
                  cursor:'pointer',
                  padding:'0.5rem 1rem',
                  borderRadius:'4px',
                  background: view===l.key ? '#666666' : 'transparent',
                  color:      view===l.key ? '#fff' : '#000',
                  fontWeight: view===l.key ? 'bold' : 'normal',
                  textAlign:  'left'
                }}
              >
                {l.label}
              </div>
            ))}
          </nav>
          <div style={{ flex:1 }} />
          <button
            onClick={handleLogout}
            style={{
              padding:'0.5rem 1rem',
              border:'1px solid #555',
              borderRadius:'4px',
              background:'transparent',
              cursor:'pointer'
            }}
          >
            Logout
          </button>
        </aside>
      </div>
    </div>
  );
}
