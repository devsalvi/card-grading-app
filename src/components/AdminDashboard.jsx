import { useState, useEffect } from 'react'
import { getCurrentAuthUser, signOutUser, isAdmin, getAdminCompany } from '../services/authService'
import { getSubmissionById, listAllSubmissions } from '../services/adminService'
import ServiceTierManager from './ServiceTierManager'
import './AdminDashboard.css'

function AdminDashboard({ onLogout }) {
  const [user, setUser] = useState(null)
  const [searchId, setSearchId] = useState('')
  const [submission, setSubmission] = useState(null)
  const [recentSubmissions, setRecentSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isUserAdmin, setIsUserAdmin] = useState(false)
  const [companyInfo, setCompanyInfo] = useState({ isSuperAdmin: false, company: null, companyName: null })
  const [activeTab, setActiveTab] = useState('submissions') // 'submissions' or 'service-tiers'

  useEffect(() => {
    checkUserAndLoadData()
  }, [])

  const checkUserAndLoadData = async () => {
    try {
      const currentUser = await getCurrentAuthUser()
      setUser(currentUser)

      const adminStatus = await isAdmin()
      setIsUserAdmin(adminStatus)

      if (!adminStatus) {
        setError('Access Denied: You do not have admin privileges.')
        return
      }

      // Get company info
      const company = await getAdminCompany()
      setCompanyInfo(company)

      // Load recent submissions
      await loadRecentSubmissions()
    } catch (err) {
      console.error('Error loading user:', err)
      setError('Failed to load user information')
    }
  }

  const loadRecentSubmissions = async () => {
    try {
      const result = await listAllSubmissions(10)
      setRecentSubmissions(result.items || [])
    } catch (err) {
      console.error('Error loading recent submissions:', err)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchId.trim()) {
      setError('Please enter a submission ID')
      return
    }

    setLoading(true)
    setError('')
    setSubmission(null)

    try {
      const result = await getSubmissionById(searchId.trim())
      setSubmission(result)
    } catch (err) {
      console.error('Search error:', err)
      setError(err.message || 'Submission not found')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOutUser()
      if (onLogout) {
        onLogout()
      }
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isUserAdmin && user) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1>Access Denied</h1>
          <button onClick={handleSignOut} className="sign-out-button">Sign Out</button>
        </div>
        <div className="error-banner">
          You do not have admin privileges. Please contact an administrator.
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          {user && <p className="user-info">Signed in as: {user.username}</p>}
          {companyInfo.companyName && (
            <p className="company-info">
              {companyInfo.isSuperAdmin ? (
                <span className="super-admin-badge">Super Admin - {companyInfo.companyName}</span>
              ) : (
                <span className="company-badge">{companyInfo.companyName}</span>
              )}
            </p>
          )}
        </div>
        <button onClick={handleSignOut} className="sign-out-button">Sign Out</button>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          Submissions
        </button>
        <button
          className={`tab-button ${activeTab === 'service-tiers' ? 'active' : ''}`}
          onClick={() => setActiveTab('service-tiers')}
        >
          Service Tiers
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'submissions' && (
        <>
          {/* Search Section */}
          <div className="admin-section">
        <h2>Search Submission</h2>
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter submission ID (e.g., 1729123456789)"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !searchId.trim()}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {error && <div className="error-message">{error}</div>}

        {submission && (
          <div className="submission-details">
            <h3>Submission Details</h3>

            <div className="detail-row">
              <span className="label">Submission ID:</span>
              <span className="value">{submission.submissionId}</span>
            </div>

            <div className="detail-row">
              <span className="label">Status:</span>
              <span className={`value status-${submission.status}`}>
                {submission.status}
              </span>
            </div>

            <div className="detail-row">
              <span className="label">Grading Company:</span>
              <span className="value">{submission.gradingCompany?.toUpperCase()}</span>
            </div>

            <div className="detail-row">
              <span className="label">Submitter:</span>
              <span className="value">{submission.submitterName}</span>
            </div>

            <div className="detail-row">
              <span className="label">Email:</span>
              <span className="value">{submission.email}</span>
            </div>

            {submission.phone && (
              <div className="detail-row">
                <span className="label">Phone:</span>
                <span className="value">{submission.phone}</span>
              </div>
            )}

            {submission.address && (
              <div className="detail-row">
                <span className="label">Address:</span>
                <span className="value">{submission.address}</span>
              </div>
            )}

            <div className="detail-row">
              <span className="label">Submitted:</span>
              <span className="value">{formatDate(submission.submittedAt)}</span>
            </div>

            <div className="detail-row">
              <span className="label">Total Cards:</span>
              <span className="value">{submission.totalCards}</span>
            </div>

            <div className="detail-row">
              <span className="label">Total Declared Value:</span>
              <span className="value">${submission.totalDeclaredValue?.toLocaleString()}</span>
            </div>

            {/* Cards List */}
            <div className="cards-section">
              <h4>Cards ({submission.cards?.length || 0})</h4>
              {submission.cards?.map((card, index) => (
                <div key={index} className="card-item">
                  <div className="card-header">Card {index + 1}</div>
                  <div className="card-details">
                    <div><strong>Player:</strong> {card.playerName}</div>
                    <div><strong>Year:</strong> {card.year}</div>
                    {card.manufacturer && <div><strong>Manufacturer:</strong> {card.manufacturer}</div>}
                    {card.cardNumber && <div><strong>Card #:</strong> {card.cardNumber}</div>}
                    <div><strong>Type:</strong> {card.cardType}</div>
                    {card.sport && <div><strong>Sport:</strong> {card.sport}</div>}
                    <div><strong>Condition:</strong> {card.estimatedCondition}</div>
                    <div><strong>Declared Value:</strong> ${card.declaredValue}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Submissions */}
      <div className="admin-section">
        <h2>Recent Submissions</h2>
        {recentSubmissions.length > 0 ? (
          <div className="submissions-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Submitter</th>
                  <th>Email</th>
                  <th>Cards</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map((sub) => (
                  <tr key={sub.submissionId}>
                    <td className="mono">{sub.submissionId}</td>
                    <td>{sub.submitterName}</td>
                    <td>{sub.email}</td>
                    <td>{sub.totalCards}</td>
                    <td>
                      <span className={`status-badge status-${sub.status}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td>{formatDate(sub.submittedAt)}</td>
                    <td>
                      <button
                        className="view-button"
                        onClick={() => {
                          setSearchId(sub.submissionId)
                          setSubmission(sub)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">No recent submissions found.</p>
        )}
      </div>
        </>
      )}

      {/* Service Tiers Tab */}
      {activeTab === 'service-tiers' && (
        <div className="admin-section">
          <ServiceTierManager adminCompany={companyInfo.isSuperAdmin ? null : companyInfo.company} />
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
