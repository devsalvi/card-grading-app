import { useState } from 'react'
import CardSubmissionForm from '../components/CardSubmissionForm'
import SubmissionSummary from '../components/SubmissionSummary'
import SocialLoginButton from '../components/SocialLoginButton'
import './MainPage.css'

function MainPage() {
  const [submissions, setSubmissions] = useState([])
  const [showSummary, setShowSummary] = useState(false)

  const handleSubmission = (submissionData) => {
    setSubmissions([...submissions, { ...submissionData, id: Date.now() }])
    setShowSummary(true)
  }

  const handleNewSubmission = () => {
    setShowSummary(false)
  }

  return (
    <div className="main-page">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>Card Grading Submission Portal</h1>
            <p>Submit your collector cards to professional grading companies</p>
          </div>
        </div>
      </header>

      <SocialLoginButton />

      <main className="app-main">
        {!showSummary ? (
          <CardSubmissionForm onSubmit={handleSubmission} />
        ) : (
          <SubmissionSummary
            submissions={submissions}
            onNewSubmission={handleNewSubmission}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>© 2024 Card Grading Submission Portal. For demonstration purposes only.</p>
      </footer>
    </div>
  )
}

export default MainPage
