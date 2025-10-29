import { useState, useEffect } from 'react'
import './CardSubmissionForm.css'
import { urlToBase64, blobToBase64, compressImage } from '../utils/imageUtils'
import { analyzeCardWithGemini, getMockCardData } from '../services/cardAnalysis'
import { submitCardGrading } from '../services/submissionService'
import { getUserProfile, isAuthenticated } from '../services/authService'
import { getAllServiceTiers } from '../services/serviceTiersService'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { isNativePlatform } from '../utils/platform'

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
    serviceTier: '',
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
  const [analysisNotification, setAnalysisNotification] = useState(null)

  // Service tiers loaded from API with caching
  const [serviceTiers, setServiceTiers] = useState({})
  const [loadingTiers, setLoadingTiers] = useState(true)

  // Load service tiers on mount
  useEffect(() => {
    const loadServiceTiers = async () => {
      try {
        setLoadingTiers(true)
        const tiers = await getAllServiceTiers()
        setServiceTiers(tiers)
      } catch (error) {
        console.error('Error loading service tiers:', error)
      } finally {
        setLoadingTiers(false)
      }
    }

    loadServiceTiers()
  }, [])

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

    // If changing grading company, reset service tier
    if (name === 'gradingCompany') {
      setSubmitterInfo(prev => ({
        ...prev,
        [name]: value,
        serviceTier: ''  // Reset service tier when company changes
      }))
      // Clear errors for both company and tier
      setErrors(prev => ({
        ...prev,
        gradingCompany: '',
        serviceTier: ''
      }))
    } else {
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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)

    // Compress each uploaded image before adding to cards
    console.log(`Compressing ${files.length} uploaded image(s)...`)

    const newCards = await Promise.all(
      files.map(async (file) => {
        try {
          // Compress the uploaded image
          const { blob: compressedBlob, dataUrl: compressedDataUrl } = await compressImage(file)

          // Create new file from compressed blob
          const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' })

          return {
            image: compressedDataUrl, // Use compressed data URL for display
            imageFile: compressedFile, // Compressed file for submission
            cardType: '',
            sport: '',
            playerName: '',
            year: '',
            manufacturer: '',
            cardNumber: '',
            estimatedCondition: '',
            declaredValue: '',
            estimatedValue: null
          }
        } catch (error) {
          console.error('Failed to compress image:', error)
          // Fallback to original if compression fails
          return {
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
          }
        }
      })
    )

    // Add new cards to state
    setCards(prev => [...prev, ...newCards])

    // Automatically analyze the newly uploaded images
    analyzeCards(newCards)
  }

  /**
   * Handle camera capture on native platforms (Android/iOS)
   */
  const handleCameraCapture = async (source = CameraSource.Camera) => {
    try {
      // Request camera permissions and take photo
      // Use DataUrl to get base64 directly - works reliably on both emulator and real devices
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: source,
        quality: 90,
        allowEditing: false,
        saveToGallery: false
      })

      // Convert base64 dataUrl to Blob
      // photo.dataUrl is in format: "data:image/jpeg;base64,..."
      const response = await fetch(photo.dataUrl)
      const originalBlob = await response.blob()

      // Compress the image to reduce file size for API calls
      console.log('Compressing captured image...')
      const { blob: compressedBlob, dataUrl: compressedDataUrl } = await compressImage(originalBlob)

      // Create file from compressed blob
      const file = new File([compressedBlob], `card-${Date.now()}.jpg`, { type: 'image/jpeg' })

      // Create new card entry with compressed image
      const newCard = {
        image: compressedDataUrl, // Use compressed dataUrl for display
        imageFile: file, // Compressed file for submission
        cardType: '',
        sport: '',
        playerName: '',
        year: '',
        manufacturer: '',
        cardNumber: '',
        estimatedCondition: '',
        declaredValue: '',
        estimatedValue: null
      }

      // Add new card to state
      setCards(prev => [...prev, newCard])

      // Automatically analyze the captured image
      analyzeCards([newCard])
    } catch (error) {
      console.error('Camera capture error:', error)
      // User cancelled or permission denied - silently handle
      if (error.message && !error.message.includes('cancelled')) {
        alert('Failed to capture image. Please check camera permissions in your device settings.')
      }
    }
  }

  /**
   * Handle picking image from gallery on native platforms
   */
  const handleGalleryPick = async () => {
    await handleCameraCapture(CameraSource.Photos)
  }

  const removeCard = (index) => {
    setCards(prev => prev.filter((_, i) => i !== index))
  }

  /**
   * Analyze specific cards using backend API (Google Gemini)
   * Each image may contain 1-10 cards which are detected separately
   * @param {Array} cardsToAnalyze - Array of card objects to analyze
   */
  const analyzeCards = async (cardsToAnalyze) => {
    if (!cardsToAnalyze || cardsToAnalyze.length === 0) return

    setAnalyzing(true)

    try {
      // Analyze the specified images in parallel using backend API
      const analysisPromises = cardsToAnalyze.map(async (card, index) => {
        try {
          // Convert image to base64
          const base64Image = await urlToBase64(card.image)

          console.log(`Analyzing image ${index + 1} via backend API...`)
          const responseData = await analyzeCardWithGemini(base64Image)

          // responseData now has format: { cards: [...] }
          const detectedCards = responseData.cards || []

          console.log(`Image ${index + 1}: Detected ${detectedCards.length} card(s)`)

          return { index, detectedCards, originalImage: card.image, originalFile: card.imageFile, success: true }
        } catch (error) {
          console.error(`Failed to analyze image ${index + 1}:`, error)
          return { index, error: error.message, success: false }
        }
      })

      const results = await Promise.all(analysisPromises)

      // Build new cards array: for each image, create card entries for all detected cards
      const newCards = []
      let totalCardsDetected = 0

      results.forEach((result, imageIndex) => {
        if (result.success && result.detectedCards.length > 0) {
          // Create a card entry for each detected card in this image
          result.detectedCards.forEach((detectedCard, cardIndex) => {
            const estimatedVal = calculateEstimatedValueSync(detectedCard)

            newCards.push({
              image: result.originalImage,
              imageFile: result.originalFile,
              cardType: detectedCard.cardType || '',
              sport: detectedCard.sport || '',
              playerName: detectedCard.playerName || '',
              year: detectedCard.year || '',
              manufacturer: detectedCard.manufacturer || '',
              cardNumber: detectedCard.cardNumber || '',
              estimatedCondition: detectedCard.estimatedCondition || '',
              declaredValue: estimatedVal ? estimatedVal.average.toString() : '',
              estimatedValue: estimatedVal,
              // Track which image this came from and card number within that image
              sourceImageIndex: imageIndex,
              detectedCardNumber: cardIndex + 1,
              totalCardsInImage: result.detectedCards.length
            })
            totalCardsDetected++
          })
        } else {
          // If analysis failed, keep the original card entry
          newCards.push(cardsToAnalyze[imageIndex])
        }
      })

      // Update state: replace the analyzed cards with their results
      // Use functional update to ensure we work with latest state
      setCards(prevCards => {
        // Create a Set of images being analyzed for quick lookup
        const analyzedImages = new Set(cardsToAnalyze.map(c => c.image))

        // Keep cards that weren't analyzed, add analyzed results
        const unchangedCards = prevCards.filter(c => !analyzedImages.has(c.image))
        return [...unchangedCards, ...newCards]
      })

      // Show success notification
      setAutoFilled(true)
      setTimeout(() => setAutoFilled(false), 5000)

      // Check if any failed
      const failedCount = results.filter(r => !r.success).length
      const successCount = results.filter(r => r.success).length

      // Show analysis results notification
      if (totalCardsDetected > cardsToAnalyze.length) {
        setAnalysisNotification({
          type: 'success',
          title: 'Multi-Card Detection Success!',
          message: `Detected ${totalCardsDetected} card(s) across ${successCount} image(s). Multiple cards were found in some images and have been separated for individual grading.`
        })
      } else if (failedCount > 0) {
        setAnalysisNotification({
          type: 'warning',
          title: 'Partial Analysis Complete',
          message: `Successfully analyzed ${successCount} of ${results.length} image(s). ${failedCount} image(s) failed - please fill in details manually.`
        })
      }

      // Auto-hide notification after 8 seconds
      setTimeout(() => setAnalysisNotification(null), 8000)

    } catch (error) {
      console.error('Card analysis failed:', error)
      setAnalysisNotification({
        type: 'error',
        title: 'Analysis Failed',
        message: `${error.message}. Please enter details manually.`
      })
      setTimeout(() => setAnalysisNotification(null), 8000)
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
    if (!submitterInfo.serviceTier) newErrors.serviceTier = 'Please select a service tier'
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

    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]')
    if (submitButton) {
      submitButton.disabled = true
      submitButton.textContent = 'Uploading images and submitting...'
    }

    try {
      // OPTIMIZATION: Deduplicate image conversion to prevent memory issues on mobile devices
      // When multiple cards share the same image (multi-card detection from single photo),
      // convert each unique image only once

      // Step 1: Identify and convert unique images
      const imageCache = new Map()
      const uniqueImages = new Map()

      cards.forEach((card) => {
        if (card.image) {
          const cacheKey = card.imageFile ? 'file-' + card.imageFile.name : card.image
          if (!uniqueImages.has(cacheKey)) {
            uniqueImages.set(cacheKey, { imageFile: card.imageFile, imageUrl: card.image })
          }
        }
      })

      // Step 2: Convert each unique image once
      console.log(`Converting ${uniqueImages.size} unique image(s) for ${cards.length} card(s)`)

      for (const [cacheKey, imageInfo] of uniqueImages.entries()) {
        try {
          let imageData
          if (imageInfo.imageFile) {
            console.log('Converting image from File object (native platform)')
            imageData = await blobToBase64(imageInfo.imageFile)
          } else {
            console.log('Converting image from URL (web platform)')
            imageData = await urlToBase64(imageInfo.imageUrl)
          }
          imageCache.set(cacheKey, imageData)
        } catch (error) {
          console.error('Failed to convert image to base64:', error)
          imageCache.set(cacheKey, null) // Cache null to prevent retry
        }
      }

      // Step 3: Build submission data using cached image conversions
      const cardsWithBase64 = cards.map((card) => {
        let imageData = null

        if (card.image) {
          const cacheKey = card.imageFile ? 'file-' + card.imageFile.name : card.image
          imageData = imageCache.get(cacheKey) || null
        }

        return {
          imageData, // Base64 encoded image for S3 upload
          cardType: card.cardType,
          sport: card.sport,
          playerName: card.playerName,
          year: card.year,
          manufacturer: card.manufacturer,
          cardNumber: card.cardNumber,
          estimatedCondition: card.estimatedCondition,
          declaredValue: card.declaredValue,
          // Include AI analysis metadata
          detectedCardNumber: card.detectedCardNumber,
          totalCardsInImage: card.totalCardsInImage,
          aiAnalyzed: !!(card.detectedCardNumber || card.totalCardsInImage),
          analyzedAt: card.estimatedValue ? new Date().toISOString() : undefined
        }
      })

      // Combine submitter info with all cards for submission
      const submission = {
        ...submitterInfo,
        cards: cardsWithBase64,
        submissionId: Date.now()
      }

      // Save to DynamoDB via API (also uploads images to S3)
      await submitCardGrading(submission)

      // If API call succeeds, show the summary (with local blob URLs for display)
      const displaySubmission = {
        ...submitterInfo,
        cards: cards.map(card => ({
          image: card.image, // Keep blob URL for display
          cardType: card.cardType,
          sport: card.sport,
          playerName: card.playerName,
          year: card.year,
          manufacturer: card.manufacturer,
          cardNumber: card.cardNumber,
          estimatedCondition: card.estimatedCondition,
          declaredValue: card.declaredValue
        })),
        submissionId: submission.submissionId
      }

      onSubmit(displaySubmission)
    } catch (error) {
      console.error('Submission error:', error)
      alert(`Failed to submit: ${error.message}\n\nYour submission was not saved. Please try again.`)

      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false
        submitButton.textContent = 'Submit for Grading'
      }
    }
  }

  return (
    <form className="card-submission-form" onSubmit={handleSubmit}>
      <h2>Card Grading Submission</h2>

      {/* Loading modal during analysis */}
      {analyzing && (
        <div className="loading-modal-overlay">
          <div className="loading-modal">
            <div className="loading-spinner"></div>
            <h3>Analyzing Your Cards</h3>
            <p>Please wait while we detect and extract card details...</p>
          </div>
        </div>
      )}

      {/* Auto-fill notification */}
      {autoFilled && (
        <div className="auto-fill-notification">
          ✓ All cards automatically analyzed! Review and adjust details as needed.
        </div>
      )}

      {/* Analysis results notification */}
      {analysisNotification && (
        <div className={`analysis-notification ${analysisNotification.type}`}>
          <div className="notification-header">
            <span className="notification-icon">
              {analysisNotification.type === 'success' && '✓'}
              {analysisNotification.type === 'warning' && '⚠'}
              {analysisNotification.type === 'error' && '✕'}
            </span>
            <strong>{analysisNotification.title}</strong>
            <button
              className="notification-close"
              onClick={() => setAnalysisNotification(null)}
              type="button"
            >
              ×
            </button>
          </div>
          <p className="notification-message">{analysisNotification.message}</p>
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

      {/* Service Tier Selection */}
      {submitterInfo.gradingCompany && (
        <div className="form-section">
          <h3>Select Service Tier</h3>
          {loadingTiers ? (
            <div className="loading-message">Loading service tiers...</div>
          ) : serviceTiers[submitterInfo.gradingCompany] && serviceTiers[submitterInfo.gradingCompany].length > 0 ? (
            <div className="service-tier-selection">
              {serviceTiers[submitterInfo.gradingCompany].map(tier => (
                <label key={tier.id} className="service-tier-option">
                  <input
                    type="radio"
                    name="serviceTier"
                    value={tier.id}
                    checked={submitterInfo.serviceTier === tier.id}
                    onChange={handleSubmitterChange}
                  />
                  <div className="service-tier-details">
                    <div className="tier-header">
                      <strong>{tier.name}</strong>
                      <span className="tier-price">{tier.price}</span>
                    </div>
                    <div className="tier-info">
                      <span className="tier-turnaround">⏱️ {tier.turnaround}</span>
                      <span className="tier-description">{tier.description}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="info-message">No service tiers available for this company.</div>
          )}
          {errors.serviceTier && <div className="error">{errors.serviceTier}</div>}
        </div>
      )}

      {/* Image Upload Section */}
      <div className="form-section">
        <h3>Upload Card Images</h3>
        <div className="image-upload-section">
          {isNativePlatform() ? (
            // Native platform (Android/iOS) - show camera and gallery buttons
            <div className="native-upload-buttons">
              <button
                type="button"
                className="upload-button camera-button"
                onClick={() => handleCameraCapture(CameraSource.Camera)}
              >
                Take Photo
              </button>
              <button
                type="button"
                className="upload-button gallery-button"
                onClick={handleGalleryPick}
              >
                Choose from Gallery
              </button>
            </div>
          ) : (
            // Web platform - show file upload
            <label className="upload-button">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              Upload or Capture Image
            </label>
          )}
          <p className="upload-hint">
            {isNativePlatform()
              ? 'Take a photo or choose from your gallery'
              : 'You can upload multiple cards at once'}
          </p>

          {cards.length > 0 && (
            <div className="cards-preview">
              <p>{cards.length} card(s) ready</p>
            </div>
          )}
        </div>
      </div>

      {/* Individual Card Sections */}
      {cards.map((card, index) => (
        <div key={index} className="card-section">
          <div className="card-section-header">
            <h3>
              Card #{index + 1}
              {card.totalCardsInImage && card.totalCardsInImage > 1 && (
                <span className="multi-card-badge">
                  {' '}({card.detectedCardNumber} of {card.totalCardsInImage} detected in this image)
                </span>
              )}
            </h3>
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

          {/* Estimated Value Display - HIDDEN FOR NOW, DO NOT DELETE */}
          {false && card.estimatedValue && (
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
