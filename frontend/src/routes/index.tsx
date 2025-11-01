import { Navigate, useRoutes } from 'react-router-dom';
import Login from '../pages/Login.js';
import MyPlace from '../pages/MyPlace.js';
import Admin from '../pages/Admin.js';
import AppLayout from '../components/Layout.js';
import { useAuth } from '../context/AuthContext.js';

const ProtectedRoute = () => {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
};

const AppRoutes = () => {
  const { token } = useAuth();

  const element = useRoutes([
    {
      path: '/login',
      element: token ? <Navigate to="/" replace /> : <Login />,
    },
    {
      path: '/',
      element: <ProtectedRoute />,
      children: [
        { index: true, element: <MyPlace /> },
        { path: 'admin', element: <Admin /> },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ]);

  return element;
};

export default AppRoutes;
