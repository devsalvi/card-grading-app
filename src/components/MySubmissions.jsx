import { useState, useEffect } from 'react';
import { getMySubmissions } from '../services/userSubmissionService';
import { isAuthenticated } from '../services/authService';
import './MySubmissions.css';

function MySubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    setError(null);

    try {
      const isAuth = await isAuthenticated();
      setAuthenticated(isAuth);

      if (isAuth) {
        const data = await getMySubmissions();
        setSubmissions(data);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubmissionDetails = (submissionId) => {
    setExpandedSubmission(expandedSubmission === submissionId ? null : submissionId);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCompanyName = (companyId) => {
    const companies = {
      psa: 'PSA',
      bgs: 'BGS',
      sgc: 'SGC',
      cgc: 'CGC'
    };
    return companies[companyId] || companyId.toUpperCase();
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      processing: 'status-processing',
      completed: 'status-completed'
    };
    return statusClasses[status] || 'status-pending';
  };

  if (!authenticated) {
    return (
      <div className="my-submissions-section">
        <h3>My Submissions</h3>
        <div className="not-authenticated">
          <p>Sign in to view your submission history</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="my-submissions-section">
        <h3>My Submissions</h3>
        <div className="loading">Loading your submissions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-submissions-section">
        <h3>My Submissions</h3>
        <div className="error-message">
          {error}
          <button onClick={loadSubmissions} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="my-submissions-section">
        <h3>My Submissions</h3>
        <div className="no-submissions">
          <p>You haven't submitted any cards yet.</p>
          <p>Submit your first card to see your submission history here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-submissions-section">
      <div className="submissions-header">
        <h3>My Recent Submissions</h3>
        <span className="submissions-count">({submissions.length} submission{submissions.length !== 1 ? 's' : ''})</span>
      </div>

      <div className="submissions-list">
        {submissions.map((submission) => (
          <div key={submission.submissionId} className="submission-card">
            <div
              className="submission-summary"
              onClick={() => toggleSubmissionDetails(submission.submissionId)}
            >
              <div className="submission-header">
                <div className="submission-id">
                  <strong>ID:</strong> {submission.submissionId}
                </div>
                <div className={`submission-status ${getStatusBadge(submission.status)}`}>
                  {submission.status}
                </div>
              </div>

              <div className="submission-info">
                <div className="info-item">
                  <span className="info-label">Company:</span>
                  <span className="info-value">{getCompanyName(submission.gradingCompany)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Cards:</span>
                  <span className="info-value">{submission.totalCards}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Total Value:</span>
                  <span className="info-value">${submission.totalDeclaredValue?.toLocaleString()}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Submitted:</span>
                  <span className="info-value">{formatDate(submission.submittedAt)}</span>
                </div>
              </div>

              <div className="expand-indicator">
                {expandedSubmission === submission.submissionId ? '▼' : '▶'} View Details
              </div>
            </div>

            {expandedSubmission === submission.submissionId && (
              <div className="submission-details">
                <h4>Cards in this Submission:</h4>
                <div className="cards-grid">
                  {submission.cards.map((card, index) => (
                    <div key={index} className="card-detail">
                      {card.imageUrl && (
                        <div className="card-image-container">
                          <img
                            src={card.imageUrl}
                            alt={card.playerName}
                            className="card-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="card-info">
                        <div className="card-name">{card.playerName}</div>
                        <div className="card-meta">
                          {card.year} • {card.manufacturer || 'Unknown'}
                        </div>
                        <div className="card-meta">
                          {card.cardType} {card.sport && `• ${card.sport}`}
                        </div>
                        <div className="card-condition">
                          Condition: {card.estimatedCondition}
                        </div>
                        <div className="card-value">
                          Value: ${parseFloat(card.declaredValue).toLocaleString()}
                        </div>
                        {card.imageMetadata?.totalCardsInImage > 1 && (
                          <div className="multi-card-indicator">
                            Card {card.imageMetadata.detectedCardNumber} of {card.imageMetadata.totalCardsInImage} in image
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MySubmissions;
