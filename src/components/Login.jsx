import { useState } from 'react'
import {
  signInUser,
  signUpUser,
  confirmSignUpUser,
  isAuthConfigured
} from '../services/authService'
import './Login.css'

function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('signin') // 'signin', 'signup', 'confirm'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
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
        phone: formData.phone,
        address: formData.address,
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
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="+1234567890 (with country code)"
              />
              <small>Optional: Include country code (e.g., +1 for US)</small>
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={loading}
                rows="3"
                placeholder="Street, City, State, ZIP"
              />
              <small>Optional: Your address will be used to pre-fill submission forms</small>
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
              <h3 className="admin-section-title">Account Type</h3>
              <p className="admin-section-description">
                Most users should keep the default "Regular User" option. Only select a company if you have an admin code.
              </p>

              <div className="form-group">
                <label htmlFor="company">I am a:</label>
                <select
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Regular User (Submit cards for grading)</option>
                  <option value="psa">PSA Admin (Requires admin code)</option>
                  <option value="bgs">BGS Admin (Requires admin code)</option>
                  <option value="sgc">SGC Admin (Requires admin code)</option>
                  <option value="cgc">CGC Admin (Requires admin code)</option>
                  <option value="super">Super Admin (Requires admin code)</option>
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
