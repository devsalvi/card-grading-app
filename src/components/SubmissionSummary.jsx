import './SubmissionSummary.css'

const GRADING_COMPANIES = {
  psa: 'PSA (Professional Sports Authenticator)',
  bgs: 'BGS (Beckett Grading Services)',
  sgc: 'SGC (Sportscard Guaranty)',
  cgc: 'CGC (Certified Guaranty Company)'
}

function SubmissionSummary({ submissions, onNewSubmission }) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="submission-summary">
      <div className="summary-header">
        <h2>Submission Confirmation</h2>
        <p className="success-message">
          ✓ Your card submission has been successfully received!
        </p>
      </div>

      <div className="submissions-list">
        {submissions.map((submission) => (
          <div key={submission.submissionId} className="submission-group">
            <div className="submission-info">
              <h3>Submission #{submission.submissionId}</h3>
              <div className="submitter-details">
                <p><strong>Grading Company:</strong> {GRADING_COMPANIES[submission.gradingCompany]}</p>
                <p><strong>Submitter:</strong> {submission.submitterName}</p>
                <p><strong>Email:</strong> {submission.email}</p>
                {submission.phone && <p><strong>Phone:</strong> {submission.phone}</p>}
                {submission.address && <p><strong>Address:</strong> {submission.address}</p>}
                {submission.specialInstructions && (
                  <p><strong>Special Instructions:</strong> {submission.specialInstructions}</p>
                )}
              </div>
            </div>

            <h4 className="cards-header">
              {submission.cards.length} Card{submission.cards.length > 1 ? 's' : ''} Submitted
            </h4>

            <div className="cards-grid">
              {submission.cards.map((card, index) => (
                <div key={index} className="card-summary">
                  <div className="card-summary-header">
                    <h5>Card #{index + 1}</h5>
                  </div>

                  {card.image && (
                    <div className="card-summary-image">
                      <img src={card.image} alt={`${card.playerName} card`} />
                    </div>
                  )}

                  <div className="card-summary-details">
                    <div className="detail-row">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{card.playerName}</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Year:</span>
                      <span className="detail-value">{card.year}</span>
                    </div>

                    {card.manufacturer && (
                      <div className="detail-row">
                        <span className="detail-label">Manufacturer:</span>
                        <span className="detail-value">{card.manufacturer}</span>
                      </div>
                    )}

                    {card.cardNumber && (
                      <div className="detail-row">
                        <span className="detail-label">Card #:</span>
                        <span className="detail-value">{card.cardNumber}</span>
                      </div>
                    )}

                    <div className="detail-row">
                      <span className="detail-label">Type:</span>
                      <span className="detail-value">
                        {card.cardType}
                        {card.sport && ` - ${card.sport}`}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Condition:</span>
                      <span className="detail-value">{card.estimatedCondition}</span>
                    </div>

                    <div className="detail-row highlight">
                      <span className="detail-label">Declared Value:</span>
                      <span className="detail-value">
                        ${parseFloat(card.declaredValue).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="submission-total">
              <strong>Total Declared Value:</strong> $
              {submission.cards
                .reduce((sum, card) => sum + parseFloat(card.declaredValue), 0)
                .toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="print-notice">
        <p>
          <strong>📧 For Physical Mail Submission:</strong> Print this page and include it with your cards when shipping to the grading company.
          Your Submission ID is required for tracking.
        </p>
      </div>

      <div className="next-steps">
        <h3>What Happens Next?</h3>
        <ol>
          <li>You will receive a confirmation email with shipping instructions</li>
          <li>Package your cards securely and ship them to the grading company</li>
          <li>Track your submission status online using your submission ID</li>
          <li>Receive your graded cards back within the estimated turnaround time</li>
        </ol>
      </div>

      <div className="summary-actions">
        <button onClick={handlePrint} className="print-button">
          Print Submission
        </button>
        <button onClick={onNewSubmission} className="new-submission-button">
          Submit More Cards
        </button>
      </div>
    </div>
  )
}

export default SubmissionSummary
