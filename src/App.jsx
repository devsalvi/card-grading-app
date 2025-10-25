import { useState } from 'react'
import './App.css'
import CardSubmissionForm from './components/CardSubmissionForm'
import SubmissionSummary from './components/SubmissionSummary'

function App() {
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
    <div className="app">
      <header className="app-header">
        <h1>Card Grading Submission Portal</h1>
        <p>Submit your collector cards to professional grading companies</p>
      </header>

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

export default App
