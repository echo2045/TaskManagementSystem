// src/App.jsx
import React, { useContext, useState } from 'react';
import { AuthContext } from './AuthContext';
import Login from './components/Login';
import PeopleList from './components/PeopleList';
import TaskBoard from './components/TaskBoard';
import ArchiveBoard from './components/ArchiveBoard';
import SupervisorAllocation from './components/SupervisorAllocation';
import AddUser from './components/AddUser';
import ChangePassword from './components/ChangePassword';
import Notifications from './components/Notifications';
import Projects from './components/Projects';
import Areas from './components/Areas';
import DeleteUser from './components/DeleteUser';
import UpdateUser from './components/UpdateUser';

export default function App() {
  const { user, logout } = useContext(AuthContext);
  const [selectedUser, setSelectedUser] = useState(null);
  const [view, setView] = useState('tasks');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return <Login />;

  const renderMain = () => {
    switch (view) {
      case 'tasks': return <TaskBoard filterUser={selectedUser} currentUser={user} />;
      case 'archive': return <ArchiveBoard filterUser={selectedUser} currentUser={user} />;
      case 'allocate': return <SupervisorAllocation currentUser={user} />;
      case 'addUser': return <AddUser />;
      case 'deleteUser': return <DeleteUser />;
      case 'updateUser': return <UpdateUser currentUser={user} />;
      case 'changePassword': return <ChangePassword userId={user.user_id} />;
      case 'projects': return <Projects />;
      case 'areas': return <Areas />;
      default: return null;
    }
  };

  const links = [
    { key: 'tasks', label: 'Tasks' },
    { key: 'archive', label: 'Archive' },
    { key: 'projects', label: 'Projects' },
    { key: 'areas', label: 'Areas' },
    ...(user.role === 'manager' || user.role === 'hr'
      ? [
          { key: 'allocate', label: 'Allocate Supervisor' },
          { key: 'addUser', label: 'Add User' },
          { key: 'deleteUser', label: 'Delete User' }
        ]
      : []),
    { key: 'updateUser', label: 'Update User Info' },
    { key: 'changePassword', label: 'Change Password' }
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
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid #CCCCCC'
      }}>
        <h1
          style={{ margin: 0, fontSize: '2rem', cursor: 'pointer', color: '#000' }}
          onClick={() => {
            setSelectedUser(null);
            setView('tasks');
          }}
        >
          Task Management System
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Notifications />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => {
              setSelectedUser(null);
              setView('tasks');
            }}
          >
            <img
              src={user.avatar_url || 'https://www.gravatar.com/avatar/?d=mp&s=80'}
              alt="Avatar"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
            <span style={{ fontSize: '1rem', color: '#000' }}>
              {user.full_name}
            </span>
          </div>
        </div>
      </nav>

      {/* BODY */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* LEFT: People List (Toggleable) */}
        <div style={{
          width: sidebarOpen ? '200px' : '0px',
          transition: 'width 0.3s ease',
          overflow: 'hidden'
        }}>
          {sidebarOpen && (
            <PeopleList
              currentUserId={user.user_id}
              selectedUserId={selectedUser?.user_id}
              onSelectUser={u => {
                setSelectedUser(u);
                setView('tasks');
              }}
            />
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          style={{
            position: 'absolute',
            top: '50%',
            left: sidebarOpen ? '200px' : '0px',
            transform: 'translateY(-50%)',
            width: '32px',
            height: '64px',
            background: '#2E2E2E',
            color: '#FFF',
            border: 'none',
            borderRadius: sidebarOpen ? '0 8px 8px 0' : '0 8px 8px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 8px rgba(0,0,0,0.2)',
            zIndex: 2,
            transition: 'left 0.3s ease, background 0.2s ease'
          }}
          title={sidebarOpen ? 'Collapse People' : 'Expand People'}
          onMouseEnter={e => e.currentTarget.style.background = '#444'}
          onMouseLeave={e => e.currentTarget.style.background = '#2E2E2E'}
        >
          <span style={{ fontSize: '1.25rem' }}>
            {sidebarOpen ? '◀' : '▶'}
          </span>
        </button>

        {/* CENTER */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          background: '#FAFAFA',
          padding: '1rem 2rem',
          boxSizing: 'border-box',
          height: '100%',
          transition: 'margin-left 0.3s ease'
        }}>
          {renderMain()}
        </main>

        {/* RIGHT: Links & Logout */}
        <aside style={{
          width: '250px',
          padding: '1rem',
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-2px 0 4px rgba(0,0,0,0.1)'
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {links.map(l => (
              <div
                key={l.key}
                onClick={() => setView(l.key)}
                style={{
                  cursor: 'pointer',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  background: view === l.key ? '#666666' : 'transparent',
                  color: view === l.key ? '#fff' : '#000',
                  fontWeight: view === l.key ? 'bold' : 'normal'
                }}
              >
                {l.label}
              </div>
            ))}
          </nav>
          <div style={{ flex: 1 }} />
          <button
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #555',
              borderRadius: '4px',
              background: 'transparent',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </aside>
      </div>
    </div>
  );
}
