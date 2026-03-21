import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import FieldDetail from './pages/FieldDetail'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import History from './pages/History'
import IrrigationPlan from './pages/IrrigationPlan'
import Alerts from './pages/Alerts'
import Compare from './pages/Compare'
import ProtectedRoute from './components/ProtectedRoute'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Защищённые маршруты */}
        <Route path="/" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/field/:id" element={
          <ProtectedRoute><FieldDetail /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute><History /></ProtectedRoute>
        } />
        <Route path="/irrigation" element={
          <ProtectedRoute><IrrigationPlan /></ProtectedRoute>
        } />
        <Route path="/alerts" element={
          <ProtectedRoute><Alerts /></ProtectedRoute>
        } />
        <Route path="/compare" element={
          <ProtectedRoute><Compare /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
