import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { isNativePlatform, isAndroid, isIOS } from '../utils/platform'
import { isAuthenticated, signOutUser } from '../services/authService'
import Login from '../components/Login'
import './LandingPage.css'

function LandingPage() {
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(false)
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false)

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const authenticated = await isAuthenticated()
    setIsUserAuthenticated(authenticated)
  }

  const handleGetStarted = () => {
    navigate('/submit')
  }

  const handleAdminPortal = () => {
    navigate('/admin')
  }

  const handleSignIn = () => {
    setShowLogin(true)
  }

  const handleLoginSuccess = async () => {
    setShowLogin(false)
    await checkAuth()
  }

  const handleSignOut = async () => {
    await signOutUser()
    setIsUserAuthenticated(false)
    window.location.reload()
  }

  return (
    <div className="landing-page">
      {/* Navigation Header */}
      <nav className="landing-nav">
        <div className="nav-content">
          <div className="nav-brand" onClick={() => navigate('/')}>
            <h1>Collectbl</h1>
          </div>
          <div className="nav-links">
            {isUserAuthenticated ? (
              <>
                <button className="nav-link" onClick={handleGetStarted}>
                  Submit Cards
                </button>
                <button className="nav-link" onClick={handleAdminPortal}>
                  Admin
                </button>
                <button className="nav-button-primary" onClick={handleSignOut}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button className="nav-link" onClick={handleAdminPortal}>
                  Admin Portal
                </button>
                <button className="nav-button-primary" onClick={handleSignIn}>
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showLogin && (
        <div className="login-modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLogin(false)}>
              ×
            </button>
            <Login onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="logo">
            <h1 className="brand-name">Collectbl</h1>
            <p className="tagline">Professional Card Grading Made Simple</p>
          </div>

          <p className="hero-description">
            Submit your trading cards for professional grading from PSA, BGS, SGC, and CGC.
            Fast, secure, and powered by AI for accurate card recognition.
          </p>

          <div className="cta-buttons">
            <button className="cta-primary" onClick={handleGetStarted}>
              Get Started
            </button>
            <button className="cta-secondary" onClick={handleAdminPortal}>
              Admin Portal
            </button>
          </div>

          {isNativePlatform() && (
            <div className="platform-badge">
              <span className="badge">
                {isAndroid() ? '📱 Android App' : isIOS() ? '📱 iOS App' : '📱 Mobile App'}
              </span>
            </div>
          )}
        </div>

        <div className="hero-visual">
          <div className="card-stack">
            <div className="demo-card card-1"></div>
            <div className="demo-card card-2"></div>
            <div className="demo-card card-3"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why Choose Collectbl?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3>AI-Powered Recognition</h3>
            <p>Upload card photos and let our AI automatically identify player names, years, manufacturers, and conditions.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Value Estimation</h3>
            <p>Get instant estimated values based on card details and condition to help you make informed grading decisions.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Multi-Company Support</h3>
            <p>Submit to PSA, BGS, SGC, or CGC all from one platform. Compare prices and turnaround times easily.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Cross-Platform</h3>
            <p>Access from any device - web browser, Android app, or iOS app. Your submissions sync everywhere.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Easy Tracking</h3>
            <p>Track your submissions with unique IDs. Print or share submission details for physical mail.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure & Private</h3>
            <p>Your card data and personal information are encrypted and secure. Optional authentication available.</p>
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="platforms">
        <h2>Available on All Your Devices</h2>
        <div className="platforms-grid">
          <div className="platform-option">
            <div className="platform-icon">🌐</div>
            <h3>Web App</h3>
            <p>Access from any browser on desktop or mobile. No installation required.</p>
            <button className="platform-button" onClick={handleGetStarted}>
              Launch Web App
            </button>
          </div>

          <div className="platform-option">
            <div className="platform-icon">🤖</div>
            <h3>Android App</h3>
            <p>Native Android experience with camera integration and offline access.</p>
            <button className="platform-button" disabled>
              Download from Play Store
              <span className="coming-soon">Coming Soon</span>
            </button>
          </div>

          <div className="platform-option">
            <div className="platform-icon">🍎</div>
            <h3>iOS App</h3>
            <p>Native iPhone and iPad app with seamless photo library integration.</p>
            <button className="platform-button" disabled>
              Download from App Store
              <span className="coming-soon">Coming Soon</span>
            </button>
          </div>
        </div>
      </section>

      {/* Grading Companies Section */}
      <section className="companies">
        <h2>Supported Grading Companies</h2>
        <div className="companies-grid">
          <div className="company-badge">
            <h4>PSA</h4>
            <p>Professional Sports Authenticator</p>
          </div>
          <div className="company-badge">
            <h4>BGS</h4>
            <p>Beckett Grading Services</p>
          </div>
          <div className="company-badge">
            <h4>SGC</h4>
            <p>Sportscard Guaranty</p>
          </div>
          <div className="company-badge">
            <h4>CGC</h4>
            <p>Certified Guaranty Company</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta">
        <h2>Ready to Grade Your Collection?</h2>
        <p>Start submitting your cards today and unlock their true value</p>
        <button className="cta-large" onClick={handleGetStarted}>
          Submit Your First Card
        </button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Collectbl</h3>
            <p>Professional card grading submission platform</p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); handleGetStarted(); }}>Submit Cards</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleAdminPortal(); }}>Admin Portal</a>
            </div>

            <div className="footer-column">
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Contact Us</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 Collectbl. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
