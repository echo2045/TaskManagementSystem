// src/App.jsx
import React, { useContext } from 'react';
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

export default function App() {
  const { user, logout } = useContext(AuthContext);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [view, setView] = React.useState('tasks');

  if (!user) {
    return <Login />;
  }

  const renderMain = () => {
    switch (view) {
      case 'tasks':
        return <TaskBoard filterUser={selectedUser} currentUser={user} />;
      case 'archive':
        return <ArchiveBoard filterUser={selectedUser} currentUser={user} />;
      case 'allocate':
        return <SupervisorAllocation currentUser={user} />;
      case 'addUser':
        return <AddUser />;
      case 'changePassword':
        return <ChangePassword userId={user.user_id} />;
      case 'projects':
        return <Projects />;
      case 'areas':
        return <Areas />;
      default:
        return null;
    }
  };

  // Full list of links with role-based condition for allocate/addUser
  const links = [
    { key: 'tasks', label: 'Tasks' },
    { key: 'archive', label: 'Archive' },
    { key: 'projects', label: 'Projects' },
    { key: 'areas', label: 'Areas' },
    ...(user.role === 'manager' || user.role === 'hr'
      ? [
          { key: 'allocate', label: 'Allocate Supervisor' },
          { key: 'addUser', label: 'Add User' }
        ]
      : []),
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
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT: People */}
        <PeopleList
          currentUserId={user.user_id}
          selectedUserId={selectedUser?.user_id}
          onSelectUser={u => {
            setSelectedUser(u);
            setView('tasks');
          }}
        />

        {/* CENTER */}
        <main style={{
          flex: 2,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          background: '#FAFAFA',
          padding: '1rem 2rem',
          boxSizing: 'border-box',
          height: '100%'
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
