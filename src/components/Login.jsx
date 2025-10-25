import { useState } from 'react'
import {
  signInUser,
  signUpUser,
  confirmSignUpUser,
  isAuthConfigured,
  isSocialLoginConfigured,
  signInWithSocial
} from '../services/authService'
import './Login.css'

function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('signin') // 'signin', 'signup', 'confirm'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmationCode: '',
    company: '',
    adminCode: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')

  // Check if auth is configured
  if (!isAuthConfigured()) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Authentication Not Configured</h2>
          <p>Authentication is not currently configured. Please set up Cognito credentials in your .env file.</p>
        </div>
      </div>
    )
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('') // Clear error on input change
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signInUser(formData.email, formData.password)

      if (result.isSignedIn) {
        // Successfully signed in
        if (onLoginSuccess) {
          onLoginSuccess()
        }
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError(err.message || 'Failed to sign in. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signUpUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        company: formData.company,
        adminCode: formData.adminCode
      })

      if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
        setPendingEmail(formData.email)
        setMode('confirm')
        setError('') // Clear any existing errors
      } else if (result.isSignUpComplete) {
        // Auto-confirm is enabled, proceed to sign in
        setMode('signin')
        setError('Account created! Please sign in.')
      }
    } catch (err) {
      console.error('Sign up error:', err)
      setError(err.message || 'Failed to sign up. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await confirmSignUpUser(pendingEmail, formData.confirmationCode)

      if (result.isSignUpComplete) {
        setMode('signin')
        setError('') // Clear any existing errors
        setFormData({ ...formData, confirmationCode: '' })
      }
    } catch (err) {
      console.error('Confirmation error:', err)
      setError(err.message || 'Invalid confirmation code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider) => {
    try {
      await signInWithSocial(provider)
      // User will be redirected to social provider
      // After successful login, they'll be redirected back to the app
    } catch (err) {
      console.error('Social login error:', err)

      // Provide helpful error message
      if (err.message && err.message.includes('not available')) {
        setError(
          `${provider} login is not configured yet. ` +
          `Please use email/password login or see SOCIAL_LOGIN_SETUP.md for configuration instructions.`
        )
      } else {
        setError(
          `Social login with ${provider} failed. ` +
          `The ${provider} identity provider may not be configured in Cognito yet. ` +
          `Please use email/password login instead.`
        )
      }
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>
          {mode === 'signin' && 'Admin Sign In'}
          {mode === 'signup' && 'Create Admin Account'}
          {mode === 'confirm' && 'Confirm Your Email'}
        </h2>

        {error && <div className="error-message">{error}</div>}

        {mode === 'signin' && (
          <form onSubmit={handleSignIn}>
            {isSocialLoginConfigured() && (
              <>
                <div className="social-login-section">
                  <button
                    type="button"
                    className="social-button google-button"
                    onClick={() => handleSocialLogin('Google')}
                    disabled={loading}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92a8.78 8.78 0 0 0 2.68-6.61z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.02-3.71H.98v2.33A9 9 0 0 0 9 18z"/>
                      <path fill="#FBBC05" d="M3.98 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.98a9 9 0 0 0 0 8.08l2.99-2.33z"/>
                      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 8.997 8.997 0 0 0 .98 4.96l2.99 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <button
                    type="button"
                    className="social-button facebook-button"
                    onClick={() => handleSocialLogin('Facebook')}
                    disabled={loading}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Continue with Facebook
                  </button>
                </div>

                <div className="divider">
                  <span>or</span>
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <p className="mode-switch">
              Don't have an account?{' '}
              <button type="button" onClick={() => setMode('signup')} disabled={loading}>
                Sign Up
              </button>
            </p>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                minLength={8}
              />
              <small>Minimum 8 characters, must include uppercase, lowercase, and number</small>
            </div>

            <div className="admin-signup-section">
              <h3 className="admin-section-title">Admin Signup (Optional)</h3>
              <p className="admin-section-description">
                If you're an admin for a grading company, select your company and enter the admin code provided to you.
              </p>

              <div className="form-group">
                <label htmlFor="company">Grading Company</label>
                <select
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Regular User (No admin access)</option>
                  <option value="psa">PSA (Professional Sports Authenticator)</option>
                  <option value="bgs">BGS (Beckett Grading Services)</option>
                  <option value="sgc">SGC (Sportscard Guaranty)</option>
                  <option value="cgc">CGC (Certified Guaranty Company)</option>
                  <option value="super">Super Admin (All Companies)</option>
                </select>
              </div>

              {formData.company && (
                <div className="form-group">
                  <label htmlFor="adminCode">Admin Code</label>
                  <input
                    type="password"
                    id="adminCode"
                    name="adminCode"
                    value={formData.adminCode}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="Enter admin code for your company"
                  />
                  <small>Contact your company administrator to get the admin code</small>
                </div>
              )}
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>

            <p className="mode-switch">
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('signin')} disabled={loading}>
                Sign In
              </button>
            </p>
          </form>
        )}

        {mode === 'confirm' && (
          <form onSubmit={handleConfirmSignUp}>
            <p className="info-message">
              Please check your email ({pendingEmail}) for a confirmation code.
            </p>

            <div className="form-group">
              <label htmlFor="confirmationCode">Confirmation Code</label>
              <input
                type="text"
                id="confirmationCode"
                name="confirmationCode"
                value={formData.confirmationCode}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="Enter 6-digit code"
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Confirming...' : 'Confirm Email'}
            </button>

            <p className="mode-switch">
              <button type="button" onClick={() => setMode('signin')} disabled={loading}>
                Back to Sign In
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default Login
