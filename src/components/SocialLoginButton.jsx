import { useState, useEffect } from 'react'
import { signInWithSocial, isAuthenticated, getUserProfile, signOutUser, isSocialLoginConfigured } from '../services/authService'
import './SocialLoginButton.css'

function SocialLoginButton() {
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(false)

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

  const handleSocialLogin = async (provider) => {
    setLoading(true)
    try {
      await signInWithSocial(provider)
    } catch (error) {
      console.error('Social login error:', error)

      // Check if the error is because provider is not configured
      if (error.message && error.message.includes('not available')) {
        alert(
          `${provider} login is not configured yet.\n\n` +
          `To enable ${provider} login, you need to:\n` +
          `1. Create a ${provider} OAuth app\n` +
          `2. Configure it in AWS Cognito\n\n` +
          `See SOCIAL_LOGIN_SETUP.md for detailed instructions.`
        )
      } else {
        alert(
          `Social login with ${provider} failed.\n\n` +
          `This usually means the ${provider} identity provider hasn't been configured in Cognito yet.\n\n` +
          `Please use email/password login or contact your administrator.`
        )
      }
      setLoading(false)
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

  // Don't show anything if social login is not configured
  if (!isSocialLoginConfigured()) {
    return null
  }

  return (
    <div className="social-login-banner">
      <div className="social-login-content">
        {!isUserAuthenticated ? (
          <>
            <div className="social-login-text">
              <span className="social-login-icon">🔐</span>
              <span>Sign in to auto-fill your information</span>
            </div>
            <div className="social-login-buttons">
              <button
                className="social-btn google-btn"
                onClick={() => handleSocialLogin('Google')}
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64,9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209,1.125-.843,2.078-1.796,2.717v2.258h2.908C16.658,14.137,17.64,11.939,17.64,9.2z"/>
                  <path fill="#34A853" d="M9,18c2.43,0,4.467-.806,5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86c-2.344,0-4.328-1.584-5.036-3.711H.957v2.332C2.438,15.983,5.482,18,9,18z"/>
                  <path fill="#FBBC05" d="M3.964,10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347,6.175,0,7.55,0,9s.348,2.825.957,4.039L3.964,10.707z"/>
                  <path fill="#EA4335" d="M9,3.58c1.321,0,2.508.454,3.44,1.345l2.582-2.58C13.463.891,11.426,0,9,0C5.482,0,2.438,2.017.957,4.961L3.964,7.293C4.672,5.163,6.656,3.58,9,3.58z"/>
                </svg>
                Google
              </button>

              <button
                className="social-btn facebook-btn"
                onClick={() => handleSocialLogin('Facebook')}
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
              
            </div>
          </>
        ) : (
          <div className="social-login-authenticated">
            <div className="social-login-user-info">
              <span className="social-login-icon">👤</span>
              <span>Signed in as <strong>{userName || 'User'}</strong></span>
            </div>
            <button className="sign-out-btn" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SocialLoginButton
