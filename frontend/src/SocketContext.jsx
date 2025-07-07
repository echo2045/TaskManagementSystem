
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:5000');
    setSocket(newSocket);

    const onConnect = () => {
      if (user) {
        newSocket.emit('join_room', user.user_id);
      }
    };

    newSocket.on('connect', onConnect);

    return () => {
      newSocket.off('connect', onConnect);
      newSocket.close();
    };
  }, [user]); // Depend on user to re-run when user logs in/out

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
