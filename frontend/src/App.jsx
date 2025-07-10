import React, { useContext, useState } from 'react';
import { AuthContext } from './AuthContext';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
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
import UserStatus from './components/UserStatus';
import EisenhowerHelpModal from './components/EisenhowerHelpModal';

export default function App() {
  const { user, logout } = useContext(AuthContext);
  const [selectedUser, setSelectedUser] = useState(null);
  const [view, setView] = useState('tasks');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHelpModalVisible, setHelpModalVisible] = useState(false);

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
    { key: 'projects', label: 'Projects' },
    { key: 'areas', label: 'Areas' },
    { key: 'archive', label: 'Archive' },
  ];

  const adminLinks = (user.role === 'manager' || user.role === 'hr') ? [
    { key: 'allocate', label: 'Allocate Teams' },
    { key: 'addUser', label: 'Add User' },
    { key: 'deleteUser', label: 'Delete User' }
  ] : [];

  const userSettingsLinks = [
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
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* PeopleList Drawer */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '200px',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          zIndex: 2
        }}>
          <PeopleList
            currentUserId={user.user_id}
            selectedUserId={selectedUser?.user_id}
            onSelectUser={u => {
              setSelectedUser(u);
              setView('tasks');
            }}
          />
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          style={{
            position: 'absolute',
            top: '50%',
            left: sidebarOpen ? '200px' : '0',
            transform: 'translateY(-50%)',
            width: '32px',
            height: '64px',
            background: '#2E2E2E',
            color: '#FFF',
            border: 'none',
            borderRadius: '0 8px 8px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 8px rgba(0,0,0,0.2)',
            zIndex: 3,
            transition: 'left 0.3s ease'
          }}
        >
          {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
        </button>

        {/* Main + Right Side */}
        <div style={{
          marginLeft: sidebarOpen ? '200px' : '0px',
          transition: 'margin-left 0.3s ease',
          flex: 1,
          display: 'flex',
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Center: Main Content */}
          <main style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            background: '#FAFAFA',
            padding: '1rem 2rem',
            boxSizing: 'border-box',
            height: '100%'
          }}>
            <UserStatus selectedUser={selectedUser} currentUser={user} />
            {renderMain()}
          </main>

          {/* Right Sidebar */}
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
              <hr style={{ margin: '0.5rem 0', borderTop: '1px solid #eee' }} />
              {adminLinks.length > 0 && (
                <>
                  {adminLinks.map(l => (
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
                  <hr style={{ margin: '0.5rem 0', borderTop: '1px solid #eee' }} />
                </>
              )}
              {userSettingsLinks.map(l => (
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
                background: '#dc3545', /* Red color */
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </aside>
        </div>
      </div>

      <div
        onClick={() => setHelpModalVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          backgroundColor: sidebarOpen ? 'white' : 'black',
          color: sidebarOpen ? 'black' : 'white',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '2rem',
          cursor: 'pointer',
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
          transition: 'left 0.3s ease, background-color 0.3s ease, color 0.3s ease'
        }}
      >
        ?
      </div>

      <EisenhowerHelpModal
        visible={isHelpModalVisible}
        onClose={() => setHelpModalVisible(false)}
      />
    </div>
  );
}