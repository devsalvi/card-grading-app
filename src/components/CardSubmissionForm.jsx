import { useState, useEffect } from 'react'
import './CardSubmissionForm.css'
import { urlToBase64 } from '../utils/imageUtils'
import { analyzeCardWithGemini, getMockCardData } from '../services/cardAnalysis'
import { submitCardGrading } from '../services/submissionService'
import { getUserProfile, isAuthenticated } from '../services/authService'

const GRADING_COMPANIES = [
  { id: 'psa', name: 'PSA (Professional Sports Authenticator)', turnaround: '10-45 days', price: '$20-$150' },
  { id: 'bgs', name: 'BGS (Beckett Grading Services)', turnaround: '15-60 days', price: '$25-$200' },
  { id: 'sgc', name: 'SGC (Sportscard Guaranty)', turnaround: '5-30 days', price: '$15-$100' },
  { id: 'cgc', name: 'CGC (Certified Guaranty Company)', turnaround: '20-40 days', price: '$18-$125' }
]

const CARD_TYPES = ['Sports', 'Trading Card Game (TCG)', 'Non-Sport', 'Gaming', 'Other']
const CARD_SPORTS = ['Baseball', 'Basketball', 'Football', 'Hockey', 'Soccer', 'Pokemon', 'Magic: The Gathering', 'Yu-Gi-Oh!', 'Other']
const CARD_CONDITIONS = ['Mint', 'Near Mint', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor']

function CardSubmissionForm({ onSubmit }) {
  // Separate state for submitter info (shared across all cards)
  const [submitterInfo, setSubmitterInfo] = useState({
    gradingCompany: '',
    submitterName: '',
    email: '',
    phone: '',
    address: '',
    specialInstructions: ''
  })

  // Array of cards, each with its own data and image
  const [cards, setCards] = useState([])

  const [errors, setErrors] = useState({})
  const [analyzing, setAnalyzing] = useState(false)
  const [autoFilled, setAutoFilled] = useState(false)

  // Auto-populate user info from social login or authenticated session
  useEffect(() => {
    const loadUserInfo = async () => {
      const authenticated = await isAuthenticated()
      if (authenticated) {
        const profile = await getUserProfile()
        if (profile) {
          setSubmitterInfo(prev => ({
            ...prev,
            submitterName: profile.name || prev.submitterName,
            email: profile.email || prev.email,
            phone: profile.phone || prev.phone,
            address: profile.address || prev.address,
          }))
          if (profile.name || profile.email) {
            setAutoFilled(true)
          }
        }
      }
    }
    loadUserInfo()
  }, [])

  const handleSubmitterChange = (e) => {
    const { name, value } = e.target
    setSubmitterInfo(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleCardChange = (cardIndex, field, value) => {
    setCards(prev => prev.map((card, i) =>
      i === cardIndex
        ? { ...card, [field]: value }
        : card
    ))

    // Clear error for this card field
    const errorKey = `card${cardIndex}_${field}`
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }))
    }

    // Recalculate estimated value for this card
    if (['playerName', 'year', 'manufacturer', 'estimatedCondition'].includes(field)) {
      const updatedCard = { ...cards[cardIndex], [field]: value }
      calculateEstimatedValue(cardIndex, updatedCard)
    }
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)

    // Create new card entries for each uploaded image
    const newCards = files.map(file => ({
      image: URL.createObjectURL(file),
      imageFile: file,
      cardType: '',
      sport: '',
      playerName: '',
      year: '',
      manufacturer: '',
      cardNumber: '',
      estimatedCondition: '',
      declaredValue: '',
      estimatedValue: null
    }))

    setCards(prev => [...prev, ...newCards])
  }

  const removeCard = (index) => {
    setCards(prev => prev.filter((_, i) => i !== index))
  }

  /**
   * Analyze all uploaded cards using backend API (Google Gemini)
   * Each card is analyzed separately in parallel
   */
  const analyzeAllCards = async () => {
    if (cards.length === 0) return

    setAnalyzing(true)

    try {
      // Analyze all cards in parallel using backend API
      const analysisPromises = cards.map(async (card, index) => {
        try {
          // Convert image to base64
          const base64Image = await urlToBase64(card.image)

          console.log(`Analyzing card ${index + 1} via backend API...`)
          const cardData = await analyzeCardWithGemini(base64Image)

          return { index, cardData, success: true }
        } catch (error) {
          console.error(`Failed to analyze card ${index + 1}:`, error)
          return { index, error: error.message, success: false }
        }
      })

      const results = await Promise.all(analysisPromises)

      // Update cards with analysis results
      setCards(prev => prev.map((card, i) => {
        const result = results[i]
        if (result.success) {
          const updatedCard = {
            ...card,
            ...result.cardData
          }
          // Calculate estimated value
          const estimatedVal = calculateEstimatedValueSync(result.cardData)
          if (estimatedVal) {
            updatedCard.declaredValue = estimatedVal.average.toString()
            updatedCard.estimatedValue = estimatedVal
          }
          return updatedCard
        }
        return card
      }))

      // Show success notification
      setAutoFilled(true)
      setTimeout(() => setAutoFilled(false), 5000)

      // Check if any failed
      const failedCount = results.filter(r => !r.success).length
      if (failedCount > 0) {
        alert(`Successfully analyzed ${cards.length - failedCount} of ${cards.length} cards.\n${failedCount} card(s) failed - please fill in details manually.`)
      }

    } catch (error) {
      console.error('Card analysis failed:', error)
      alert(`Failed to analyze cards: ${error.message}\n\nPlease enter details manually.`)
    } finally {
      setAnalyzing(false)
    }
  }

  const calculateEstimatedValue = (cardIndex, cardData) => {
    const estimatedVal = calculateEstimatedValueSync(cardData)

    if (estimatedVal) {
      setCards(prev => prev.map((card, i) =>
        i === cardIndex
          ? {
              ...card,
              estimatedValue: estimatedVal,
              declaredValue: estimatedVal.average.toString()
            }
          : card
      ))
    }
  }

  const calculateEstimatedValueSync = (cardData) => {
    const { playerName, year, manufacturer, estimatedCondition, cardType, sport } = cardData

    if (!playerName || !year || !estimatedCondition) {
      return null
    }

    let baseValue = 50

    // Check if it's a Trading Card Game (TCG)
    const isTCG = cardType === 'Trading Card Game (TCG)'

    if (isTCG) {
      // Pokemon cards
      const popularPokemon = ['Charizard', 'Pikachu', 'Mewtwo', 'Blastoise', 'Venusaur', 'Lugia', 'Rayquaza', 'Gyarados']
      if (popularPokemon.some(pokemon => playerName.toLowerCase().includes(pokemon.toLowerCase()))) {
        baseValue = 300
      }

      // Vintage Pokemon sets
      if (year.includes('1999') || year.includes('Base Set') || year.includes('1st Edition')) {
        baseValue *= 4
      }

      // Magic: The Gathering - Power 9 and other valuable cards
      const valuableMTG = ['Black Lotus', 'Mox', 'Ancestral Recall', 'Time Walk', 'Timetwister', 'Underground Sea', 'Tundra']
      if (valuableMTG.some(card => playerName.toLowerCase().includes(card.toLowerCase()))) {
        baseValue = 2000
      }

      // Yu-Gi-Oh! valuable cards
      const valuableYuGiOh = ['Blue-Eyes White Dragon', 'Dark Magician', 'Exodia', 'Red-Eyes Black Dragon']
      if (valuableYuGiOh.some(card => playerName.toLowerCase().includes(card.toLowerCase()))) {
        baseValue = 200
      }
    } else {
      // Sports cards - check for famous players
      const famousPlayers = [
        'Michael Jordan', 'LeBron James', 'Kobe Bryant', 'Tom Brady', 'Patrick Mahomes',
        'Wayne Gretzky', 'Babe Ruth', 'Mickey Mantle', 'Mike Trout', 'Shohei Ohtani',
        'Stephen Curry', 'Lionel Messi', 'Cristiano Ronaldo'
      ]

      if (famousPlayers.some(player => playerName.toLowerCase().includes(player.toLowerCase()))) {
        baseValue = 500
      }
    }

    // Year-based multiplier (vintage cards are worth more)
    const cardYear = parseInt(year)
    if (!isNaN(cardYear)) {
      if (cardYear < 1970) {
        baseValue *= 3
      } else if (cardYear < 1990) {
        baseValue *= 2
      }
    }

    // Condition multiplier
    const conditionMultipliers = {
      'Mint': 2.0,
      'Near Mint': 1.5,
      'Excellent': 1.2,
      'Very Good': 1.0,
      'Good': 0.7,
      'Fair': 0.4,
      'Poor': 0.2
    }

    const multiplier = conditionMultipliers[estimatedCondition] || 1.0
    const estimatedPrice = baseValue * multiplier

    // Add 20% variance for realistic pricing range
    const variance = estimatedPrice * 0.2
    const minPrice = Math.round(estimatedPrice - variance)
    const maxPrice = Math.round(estimatedPrice + variance)
    const avgPrice = Math.round(estimatedPrice)

    return {
      min: minPrice,
      max: maxPrice,
      average: avgPrice
    }
  }

  const validate = () => {
    const newErrors = {}

    // Validate submitter info
    if (!submitterInfo.gradingCompany) newErrors.gradingCompany = 'Please select a grading company'
    if (!submitterInfo.submitterName) newErrors.submitterName = 'Name is required'
    if (!submitterInfo.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(submitterInfo.email)) {
      newErrors.email = 'Email is invalid'
    }

    // Validate each card
    cards.forEach((card, index) => {
      if (!card.cardType) newErrors[`card${index}_cardType`] = 'Card type is required'
      if (!card.sport) newErrors[`card${index}_sport`] = 'Sport/Game is required'
      if (!card.playerName) newErrors[`card${index}_playerName`] = 'Player/Character name is required'
      if (!card.year) newErrors[`card${index}_year`] = 'Year is required'
      if (!card.estimatedCondition) newErrors[`card${index}_estimatedCondition`] = 'Condition is required'
      if (!card.declaredValue) newErrors[`card${index}_declaredValue`] = 'Declared value is required'
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (cards.length === 0) {
      alert('Please upload at least one card image')
      return
    }

    if (!validate()) {
      alert('Please fill in all required fields for all cards')
      return
    }

    // Combine submitter info with all cards for submission
    const submission = {
      ...submitterInfo,
      cards: cards.map(card => ({
        image: card.image,
        cardType: card.cardType,
        sport: card.sport,
        playerName: card.playerName,
        year: card.year,
        manufacturer: card.manufacturer,
        cardNumber: card.cardNumber,
        estimatedCondition: card.estimatedCondition,
        declaredValue: card.declaredValue
      })),
      submissionId: Date.now()
    }

    // Save to DynamoDB via API
    try {
      // Show loading state
      const submitButton = e.target.querySelector('button[type="submit"]')
      if (submitButton) {
        submitButton.disabled = true
        submitButton.textContent = 'Submitting...'
      }

      await submitCardGrading(submission)

      // If API call succeeds, show the summary
      onSubmit(submission)
    } catch (error) {
      console.error('Submission error:', error)
      alert(`Failed to submit: ${error.message}\n\nYour submission was not saved. Please try again.`)

      // Re-enable submit button
      const submitButton = e.target.querySelector('button[type="submit"]')
      if (submitButton) {
        submitButton.disabled = false
        submitButton.textContent = 'Submit for Grading'
      }
    }
  }

  return (
    <form className="card-submission-form" onSubmit={handleSubmit}>
      <h2>Card Grading Submission</h2>

      {/* Auto-fill notification */}
      {autoFilled && (
        <div className="auto-fill-notification">
          ✓ All cards automatically analyzed! Review and adjust details as needed.
        </div>
      )}

      {/* Grading Company Selection */}
      <div className="form-section">
        <h3>Select Grading Company</h3>
        <div className="company-selection">
          {GRADING_COMPANIES.map(company => (
            <label key={company.id} className="company-option">
              <input
                type="radio"
                name="gradingCompany"
                value={company.id}
                checked={submitterInfo.gradingCompany === company.id}
                onChange={handleSubmitterChange}
              />
              <div className="company-details">
                <strong>{company.name}</strong>
                <span>Turnaround: {company.turnaround}</span>
                <span>Price: {company.price}</span>
              </div>
            </label>
          ))}
        </div>
        {errors.gradingCompany && <div className="error">{errors.gradingCompany}</div>}
      </div>

      {/* Image Upload Section */}
      <div className="form-section">
        <h3>Upload Card Images</h3>
        <div className="image-upload-section">
          <label className="upload-button">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            📸 Upload Card Images (Front & Back)
          </label>
          <p className="upload-hint">You can upload multiple cards at once</p>

          {cards.length > 0 && (
            <div className="cards-preview">
              <p>{cards.length} card(s) uploaded</p>
              <button
                type="button"
                className="analyze-button"
                onClick={analyzeAllCards}
                disabled={analyzing}
              >
                {analyzing ? 'Analyzing All Cards...' : '🤖 Analyze All Cards with AI'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Individual Card Sections */}
      {cards.map((card, index) => (
        <div key={index} className="card-section">
          <div className="card-section-header">
            <h3>Card #{index + 1}</h3>
            <button
              type="button"
              className="remove-card-button"
              onClick={() => removeCard(index)}
            >
              ✕ Remove
            </button>
          </div>

          {/* Card Image Preview */}
          <div className="card-image-preview">
            <img src={card.image} alt={`Card ${index + 1}`} />
          </div>

          {/* Card Details Form */}
          <div className="card-details-grid">
            <div className="form-group">
              <label htmlFor={`cardType${index}`}>Card Type *</label>
              <select
                id={`cardType${index}`}
                value={card.cardType}
                onChange={(e) => handleCardChange(index, 'cardType', e.target.value)}
              >
                <option value="">Select type...</option>
                {CARD_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors[`card${index}_cardType`] && <div className="error">{errors[`card${index}_cardType`]}</div>}
            </div>

            <div className="form-group">
              <label htmlFor={`sport${index}`}>Sport/Game *</label>
              <select
                id={`sport${index}`}
                value={card.sport}
                onChange={(e) => handleCardChange(index, 'sport', e.target.value)}
              >
                <option value="">Select sport/game...</option>
                {CARD_SPORTS.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
              {errors[`card${index}_sport`] && <div className="error">{errors[`card${index}_sport`]}</div>}
            </div>

            <div className="form-group">
              <label htmlFor={`playerName${index}`}>Character/Player Name *</label>
              <input
                type="text"
                id={`playerName${index}`}
                value={card.playerName}
                onChange={(e) => handleCardChange(index, 'playerName', e.target.value)}
                placeholder="e.g., Michael Jordan, Charizard"
              />
              {errors[`card${index}_playerName`] && <div className="error">{errors[`card${index}_playerName`]}</div>}
            </div>

            <div className="form-group">
              <label htmlFor={`year${index}`}>Year *</label>
              <input
                type="text"
                id={`year${index}`}
                value={card.year}
                onChange={(e) => handleCardChange(index, 'year', e.target.value)}
                placeholder="e.g., 1986, 1999 Base Set"
              />
              {errors[`card${index}_year`] && <div className="error">{errors[`card${index}_year`]}</div>}
            </div>

            <div className="form-group">
              <label htmlFor={`manufacturer${index}`}>Manufacturer/Brand</label>
              <input
                type="text"
                id={`manufacturer${index}`}
                value={card.manufacturer}
                onChange={(e) => handleCardChange(index, 'manufacturer', e.target.value)}
                placeholder="e.g., Topps, Pokemon Company"
              />
            </div>

            <div className="form-group">
              <label htmlFor={`cardNumber${index}`}>Card Number</label>
              <input
                type="text"
                id={`cardNumber${index}`}
                value={card.cardNumber}
                onChange={(e) => handleCardChange(index, 'cardNumber', e.target.value)}
                placeholder="e.g., #57"
              />
            </div>

            <div className="form-group">
              <label htmlFor={`estimatedCondition${index}`}>Estimated Condition *</label>
              <select
                id={`estimatedCondition${index}`}
                value={card.estimatedCondition}
                onChange={(e) => handleCardChange(index, 'estimatedCondition', e.target.value)}
              >
                <option value="">Select condition...</option>
                {CARD_CONDITIONS.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
              {errors[`card${index}_estimatedCondition`] && <div className="error">{errors[`card${index}_estimatedCondition`]}</div>}
            </div>

            <div className="form-group">
              <label htmlFor={`declaredValue${index}`}>Declared Value ($) *</label>
              <input
                type="number"
                id={`declaredValue${index}`}
                value={card.declaredValue}
                onChange={(e) => handleCardChange(index, 'declaredValue', e.target.value)}
                placeholder="e.g., 500"
              />
              {errors[`card${index}_declaredValue`] && <div className="error">{errors[`card${index}_declaredValue`]}</div>}
            </div>
          </div>

          {/* Estimated Value Display */}
          {card.estimatedValue && (
            <div className="estimated-value">
              <h4>💰 Estimated Card Value</h4>
              <p className="value-range">
                ${card.estimatedValue.min.toLocaleString()} - ${card.estimatedValue.max.toLocaleString()}
              </p>
              <p className="value-average">
                Average: <strong>${card.estimatedValue.average.toLocaleString()}</strong>
              </p>
              <p className="value-disclaimer">
                * This is an estimate based on general market data. Actual value may vary.
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Submitter Information Section */}
      {cards.length > 0 && (
        <div className="form-section">
          <h3>Your Information</h3>
          {autoFilled && (
            <div className="auto-fill-notice">
              ✓ Your information has been auto-filled from your profile. You can edit any field if needed.
            </div>
          )}
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="submitterName">Full Name *</label>
              <input
                type="text"
                id="submitterName"
                name="submitterName"
                value={submitterInfo.submitterName}
                onChange={handleSubmitterChange}
                placeholder="John Doe"
              />
              {errors.submitterName && <div className="error">{errors.submitterName}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={submitterInfo.email}
                onChange={handleSubmitterChange}
                placeholder="john@example.com"
              />
              {errors.email && <div className="error">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={submitterInfo.phone}
                onChange={handleSubmitterChange}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="address">Mailing Address</label>
              <textarea
                id="address"
                name="address"
                value={submitterInfo.address}
                onChange={handleSubmitterChange}
                placeholder="123 Main St, City, State ZIP"
                rows="3"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="specialInstructions">Special Instructions</label>
              <textarea
                id="specialInstructions"
                name="specialInstructions"
                value={submitterInfo.specialInstructions}
                onChange={handleSubmitterChange}
                placeholder="Any special handling or grading preferences..."
                rows="3"
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      {cards.length > 0 && (
        <button type="submit" className="submit-button">
          Submit {cards.length} Card{cards.length > 1 ? 's' : ''} for Grading
        </button>
      )}
    </form>
  )
}

export default CardSubmissionForm
