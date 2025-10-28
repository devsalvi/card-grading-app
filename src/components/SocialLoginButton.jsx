import { useState, useEffect } from 'react'
import { isAuthenticated, getUserProfile, signOutUser } from '../services/authService'
import './SocialLoginButton.css'

function SocialLoginButton() {
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const authenticated = await isAuthenticated()
    setIsUserAuthenticated(authenticated)

    if (authenticated) {
      const profile = await getUserProfile()
      if (profile && profile.name) {
        setUserName(profile.name)
      }
    }
  }

  const handleSignOut = async () => {
    try {
      await signOutUser()
      setIsUserAuthenticated(false)
      setUserName('')
      window.location.reload()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Only show if user is authenticated
  if (!isUserAuthenticated) {
    return null
  }

  return (
    <div className="social-login-banner">
      <div className="social-login-content">
        <div className="social-login-authenticated">
          <div className="social-login-user-info">
            <span className="social-login-icon">👤</span>
            <span>Signed in as <strong>{userName || 'User'}</strong></span>
          </div>
          <button className="sign-out-btn" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default SocialLoginButton
