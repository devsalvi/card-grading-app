import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CardSubmissionForm from '../components/CardSubmissionForm'
import SubmissionSummary from '../components/SubmissionSummary'
import SocialLoginButton from '../components/SocialLoginButton'
import MySubmissions from '../components/MySubmissions'
import './MainPage.css'

function MainPage() {
  const [submissions, setSubmissions] = useState([])
  const [showSummary, setShowSummary] = useState(false)
  const [activeTab, setActiveTab] = useState('submit') // 'submit' or 'history'
  const navigate = useNavigate()

  const handleSubmission = (submissionData) => {
    setSubmissions([...submissions, { ...submissionData, id: Date.now() }])
    setShowSummary(true)
  }

  const handleNewSubmission = () => {
    setShowSummary(false)
  }

  const handleBackToHome = () => {
    navigate('/')
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setShowSummary(false) // Reset summary when switching tabs
  }

  return (
    <div className="main-page">
      <header className="app-header">
        <div className="header-content">
          <button onClick={handleBackToHome} className="back-to-home-button">
            ← Back to Home
          </button>
          <div>
            <h1>Collectbl Submission Portal</h1>
            <p>Submit your collector cards to professional grading companies</p>
          </div>
        </div>
      </header>

      <SocialLoginButton />

      <main className="app-main">
        <div className="main-content-container">
          {/* Tab Navigation */}
          <div className="tabs-container">
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'submit' ? 'active' : ''}`}
                onClick={() => handleTabChange('submit')}
              >
                Submit Cards
              </button>
              <button
                className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => handleTabChange('history')}
              >
                My History
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'submit' && (
              <>
                {!showSummary ? (
                  <CardSubmissionForm onSubmit={handleSubmission} />
                ) : (
                  <SubmissionSummary
                    submissions={submissions}
                    onNewSubmission={handleNewSubmission}
                  />
                )}
              </>
            )}

            {activeTab === 'history' && (
              <MySubmissions />
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2025 Collectbl. Professional card grading submission platform.</p>
      </footer>
    </div>
  )
}

export default MainPage
