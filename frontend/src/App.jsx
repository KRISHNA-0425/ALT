import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import LoginForm from './components/LoginForm'
import HomePage from './components/HomePage'
import { useAuthStore } from './store/useAuthStore'

export const apiInstance = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

const App = () => {
  const token = useAuthStore((state) => state.token);

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/"
          element={token ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/login"
          element={!token ? <LoginForm /> : <Navigate to="/" replace />}
        />
        <Route
          path="*"
          element={<Navigate to={token ? "/" : "/login"} replace />}
        />
      </Routes>
    </>
  )
}

export default App