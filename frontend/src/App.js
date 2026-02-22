import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from './store/authSlice.js';
import Layout from './components/Layout.js';
import Dashboard from './pages/Dashboard.js';
import Flights from './pages/Flights.js';
import Weather from './pages/Weather.js';
import Notams from './pages/Notams.js';
import Dispatch from './pages/Dispatch.js';
import Login from './pages/Login.js';

function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="flights" element={<Flights />} />
          <Route path="weather" element={<Weather />} />
          <Route path="notams" element={<Notams />} />
          <Route path="dispatch" element={<Dispatch />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
