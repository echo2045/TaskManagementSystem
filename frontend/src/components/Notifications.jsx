import React, { useState, useEffect, useContext } from 'react';
import { Bell, X } from 'lucide-react';
import { AuthContext } from '../AuthContext';
import { getNotificationsForUser, deleteNotification } from '../api/notifications';
import { updateTaskRequest } from '../api/requests';
import CreateTaskModal from './CreateTaskModal';
import { useSocket } from '../SocketContext';

export default function Notifications() {
  const { user } = useContext(AuthContext);
  const socket = useSocket();
  const [notes, setNotes] = useState([]);
  const [open, setOpen] = useState(false);
  const [lastSeenId, setLastSeenId] = useState(0);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const storageKey = `lastSeenNotif_${user?.user_id}`;

  // 1) On mount, load persisted lastSeenId and fetch initial notifications
  useEffect(() => {
    if (!user) return;
    const stored = parseInt(localStorage.getItem(storageKey), 10);
    const initialLastSeenId = isNaN(stored) ? 0 : stored;
    setLastSeenId(isNaN(stored) ? 0 : stored);
    console.log('Notifications: Initial lastSeenId from localStorage:', initialLastSeenId);

    const fetchInitialNotes = async () => {
      try {
        const data = await getNotificationsForUser(user.user_id);
        // Filter out already seen notifications
        const unseenNotifications = data.filter(n => n.notification_id > lastSeenId);
        setNotes(unseenNotifications);
      } catch (err) {
        console.error('Error fetching initial notifications', err);
      }
    };
    fetchInitialNotes();
  }, [user, storageKey]);

  // 2) Listen for new notifications via socket
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (notification) => {
      if (notification.user_id === user.user_id && notification.notification_id > lastSeenId) {
        setNotes((prevNotes) => {
          // Prevent duplicates if the notification already exists
          if (!prevNotes.some(n => n.notification_id === notification.notification_id)) {
            return [notification, ...prevNotes];
          }
          return prevNotes;
        });
      }
    };

    socket.on('new_notification', handleNewNotification); // Use the named function

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, user]);

  // 3) Compute badge count: any IDs greater than lastSeenId
  const unseenCount = notes.filter(n => n.notification_id > lastSeenId).length;

  // 4) Toggle panel open/close
  const togglePanel = () => {
    if (!open) {
      setOpen(true); // Open instantly
    } else {
      // When closing, update lastSeenId and persist to localStorage
      const maxId = notes.reduce(
        (max, n) => n.notification_id > max ? n.notification_id : max,
        lastSeenId
      );
      setLastSeenId(maxId);
      localStorage.setItem(storageKey, maxId);
      setOpen(false); // Close instantly
    }
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

  // 5) Dismiss a notification
  const handleDelete = async id => {
    try {
      await deleteNotification(id);
      setNotes(n => {
        const updatedNotes = n.filter(x => x.notification_id !== id);
        // If the deleted notification was the highest ID, update lastSeenId
        if (id === notes.reduce((max, note) => Math.max(max, note.notification_id), 0)) {
          const newMaxId = updatedNotes.reduce((max, note) => Math.max(max, note.notification_id), 0);
          setLastSeenId(newMaxId);
          localStorage.setItem(storageKey, newMaxId);
        }
        return updatedNotes;
      });
      console.log('Notifications: Deleted notification. New lastSeenId:', lastSeenId);
    } catch (err) {
      console.error('Error deleting notification', err);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell + badge */}
      <button
        onClick={togglePanel}
        style={{
          background: 'transparent',
          border:     'none',
          cursor:     'pointer',
          position:   'relative',
          fontSize:   '1.5rem'
        }}
        aria-label="Toggle notifications"
      >
        <Bell color="#000" size={24} />
        {unseenCount > 0 && (
          <span style={{
            position:    'absolute',
            top:         '-4px',
            right:       '-4px',
            background:  '#E57373',
            color:       '#fff',
            borderRadius:'50%',
            padding:     '0 6px',
            fontSize:    '0.75rem',
            lineHeight:  1
          }}>
            {unseenCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position:     'absolute',
          top:          '2.5rem',
          right:        0,
          width:        '320px',
          height:       '400px',
          background:   '#FFE0B2',
          borderRadius: '8px',
          boxShadow:    '0 2px 8px rgba(0,0,0,0.2)',
          overflowY:    'auto',
          zIndex:       1000,
          padding:      '0.5rem'
        }}>
          {notes.length === 0
            ? <div style={{ padding:'1rem', color:'#333' }}>No notifications.</div>
            : (
                <>
                  {notes.map(n => (
                    <div key={n.notification_id} style={{
                      background:    '#FFF3E0',
                      border:        '1px solid #FFB74D',
                      borderRadius:  '4px',
                      padding:       '0.75rem',
                      marginBottom:  '0.5rem',
                      display:       'flex',
                      justifyContent:'space-between',
                      alignItems:    'flex-start'
                    }}>
                      <div style={{ fontSize:'0.9rem', color:'#000', flex:1 }}>
                        {n.message}
                        <div style={{
                          fontSize:   '0.75rem',
                          color:      '#555',
                          marginTop:  '0.25rem'
                        }}>
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                        {n.type === 'task_request' && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <button onClick={() => handleAccept(n.metadata)}>Accept</button>
                            <button onClick={() => handleDeny(n.metadata.request_id)}>Deny</button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(n.notification_id)}
                        style={{
                          background: 'transparent',
                          border:     'none',
                          cursor:     'pointer',
                          fontSize:   '1.2rem',
                          lineHeight: '1'
                        }}
                        aria-label="Dismiss"
                      >
                        <X size={16} color="#555" />
                      </button>
                    </div>
                  ))}
                </>
              )
          }
        </div>
      )}
      <CreateTaskModal
        visible={createTaskModalOpen}
        onClose={() => setCreateTaskModalOpen(false)}
        ownerId={user.user_id}
        request={selectedRequest}
      />
    </div>
  );
}