// src/components/Notifications.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { AuthContext } from '../AuthContext';
import { getNotificationsForUser } from '../api/notifications';
import { updateTaskRequest } from '../api/requests';
import AcceptTaskRequestModal from './AcceptTaskRequestModal';
import DelegateModal from './DelegateModal';

export default function Notifications() {
  const { user } = useContext(AuthContext);
  const [notes, setNotes] = useState([]);
  const [open, setOpen] = useState(false);
  const [lastSeenId, setLastSeenId] = useState(0);
  const [preOpenSeenId, setPreOpenSeenId] = useState(0);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const storageKey = `lastSeenNotif_${user?.user_id}`;

  // 1) On mount, load persisted lastSeenId
  useEffect(() => {
    if (!user) return;
    const stored = parseInt(localStorage.getItem(storageKey), 10);
    setLastSeenId(isNaN(stored) ? 0 : stored);
    setPreOpenSeenId(isNaN(stored) ? 0 : stored);
  }, [user, storageKey]);

  // 2) Poll for notifications every 30s
  useEffect(() => {
    if (!user) return;
    const fetchNotes = async () => {
      try {
        const data = await getNotificationsForUser(user.user_id);
        setNotes(data);
      } catch (err) {
        console.error('Error fetching notifications', err);
      }
    };
    fetchNotes();
    const id = setInterval(fetchNotes, 30000);
    return () => clearInterval(id);
  }, [user]);

  // 3) Compute badge count: any IDs greater than lastSeenId
  const unseenCount = notes.filter(n => n.notification_id > lastSeenId).length;

  // 4) Toggle panel open/close
  const togglePanel = () => {
    if (!open) {
      // Opening: capture preOpenSeenId, then update lastSeenId
      const maxId = notes.reduce(
        (max, n) => n.notification_id > max ? n.notification_id : max,
        lastSeenId
      );
      setPreOpenSeenId(lastSeenId);
      setLastSeenId(maxId);
      localStorage.setItem(storageKey, maxId);
    }
    setOpen(o => !o);
  };

  const handleAccept = (request) => {
    setSelectedRequest(request);
    setCreateTaskModalOpen(true);
  };

  const handleDeny = async (requestId) => {
    try {
      await updateTaskRequest(requestId, 'denied');
      setNotes(notes.filter(n => n.metadata?.request_id !== requestId));
    } catch (err) {
      console.error('Error denying task request:', err);
    }
  };

  const handleCloseAllModals = () => {
    setCreateTaskModalOpen(false);
    // After handling, filter out the original notification
    if (selectedRequest) {
      setNotes(notes.filter(n => n.metadata?.request_id !== selectedRequest.request_id));
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell + badge */}
      <button
        onClick={togglePanel}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          fontSize: '1.5rem'
        }}
        aria-label="Toggle notifications"
      >
        <Bell color="#000" size={24} />
        {unseenCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#E57373',
            color: '#fff',
            borderRadius: '50%',
            padding: '0 6px',
            fontSize: '0.75rem',
            lineHeight: 1
          }}>
            {unseenCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '2.5rem',
          right: 0,
          width: '320px',
          height: '400px',
          background: '#FFE0B2',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          overflowY: 'auto',
          zIndex: 1000,
          padding: '0.5rem'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #FFCC80',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>Notifications</h3>
            <button onClick={togglePanel} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="#555" /></button>
          </div>
          {notes.length === 0
            ? <div style={{ padding: '1rem', color: '#333' }}>No notifications.</div>
            : notes.map(n => {
              const isNew = n.notification_id > preOpenSeenId;
              return (
                <div key={n.notification_id} style={{
                  background: '#FFF3E0',
                  border: isNew
                    ? '3px solid #E57373'
                    : '1px solid #FFB74D',
                  borderRadius: '4px',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#000', flex: 1 }}>
                    {n.message}
                    {n.type === 'task_request' && n.metadata && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleAccept(typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata)}
                          style={{
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer'
                          }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeny(n.metadata.request_id)}
                          style={{
                            background: '#F44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer'
                          }}
                        >
                          Deny
                        </button>
                      </div>
                    )}
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#555',
                      marginTop: '0.25rem'
                    }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      {createTaskModalOpen && selectedRequest && (
        console.log('[Notifications Render] - AcceptTaskRequestModal condition', { createTaskModalOpen, selectedRequest }),
        <AcceptTaskRequestModal
          visible={createTaskModalOpen}
          onClose={handleCloseAllModals}
          request={selectedRequest}
        />
      )}
    </div>
  );
}