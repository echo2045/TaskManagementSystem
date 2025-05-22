// src/components/Notifications.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Bell, X }         from 'lucide-react';
import { AuthContext }     from '../AuthContext';
import {
  getNotificationsForUser,
  deleteNotification
} from '../api/notifications';

export default function Notifications() {
  const { user } = useContext(AuthContext);
  const [notes,           setNotes]           = useState([]);
  const [open,            setOpen]            = useState(false);
  const [lastSeenId,      setLastSeenId]      = useState(0);
  const [preOpenSeenId,   setPreOpenSeenId]   = useState(0);
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
        (max,n) => n.notification_id > max ? n.notification_id : max,
        lastSeenId
      );
      setPreOpenSeenId(lastSeenId);
      setLastSeenId(maxId);
      localStorage.setItem(storageKey, maxId);
    }
    setOpen(o => !o);
  };

  // 5) Dismiss a notification
  const handleDelete = async id => {
    try {
      await deleteNotification(id);
      setNotes(n => n.filter(x => x.notification_id !== id));
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
            : notes.map(n => {
              const isNew = n.notification_id > preOpenSeenId;
              return (
                <div key={n.notification_id} style={{
                  background:    '#FFF3E0',
                  border:        isNew
                    ? '3px solid #E57373'
                    : '1px solid #FFB74D',
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
              );
            })
          }
        </div>
      )}
    </div>
  );
}
