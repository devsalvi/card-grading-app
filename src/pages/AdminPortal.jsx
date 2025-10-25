import { useState, useEffect } from 'react'
import Login from '../components/Login'
import AdminDashboard from '../components/AdminDashboard'
import { isAuthenticated } from '../services/authService'
import { useNavigate } from 'react-router-dom'
import './AdminPortal.css'

function AdminPortal() {
  const [currentView, setCurrentView] = useState('login') // 'login' or 'dashboard'
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    const authenticated = await isAuthenticated()
    setIsUserAuthenticated(authenticated)

    // If authenticated, show dashboard
    if (authenticated) {
      setCurrentView('dashboard')
    }
  }

  const handleLoginSuccess = () => {
    setIsUserAuthenticated(true)
    setCurrentView('dashboard')
  }

  const handleLogout = () => {
    setIsUserAuthenticated(false)
    setCurrentView('login')
  }

  const handleBackToMain = () => {
    navigate('/')
  }

  return (
    <div className="admin-portal">
      {currentView === 'login' && (
        <>
          <div className="back-button-container">
            <button onClick={handleBackToMain} className="back-button">
              ← Back to Home
            </button>
          </div>
          <Login onLoginSuccess={handleLoginSuccess} />
        </>
      )}

      {currentView === 'dashboard' && (
        <AdminDashboard onLogout={handleLogout} />
      )}
    </div>
  )
}

export default AdminPortal
