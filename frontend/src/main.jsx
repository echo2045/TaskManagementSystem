import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider, AuthContext } from './AuthContext';
import Login from './components/Login';

function Root() {
  const { user } = React.useContext(AuthContext);
  return user ? <App /> : <Login />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <Root />
  </AuthProvider>
);
