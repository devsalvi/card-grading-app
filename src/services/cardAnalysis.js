/**
 * Analyze a card image using the backend API (which uses Google Gemini Vision)
 * @param {string} base64Image - Base64 encoded image (without data:image prefix)
 * @returns {Promise<Object>} Extracted card information
 */
export async function analyzeCardWithGemini(base64Image) {
  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;

  if (!apiEndpoint) {
    throw new Error('API endpoint not configured. Please add VITE_API_ENDPOINT to your .env file.');
  }

  try {
    console.log('Analyzing card with backend API...');

    // Call the backend Lambda function
    const response = await fetch(`${apiEndpoint}/analyze-card`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to analyze card');
    }

    // Check if using mock data
    if (result.mock) {
      console.warn('Backend returned mock data:', result.message);
    }

    console.log('Extracted card data:', result.data);
    return result.data;

  } catch (error) {
    console.error('Card analysis error:', error);

    // If fetch failed (network error), fallback to mock data
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.warn('Network error - using mock data');
      return getMockCardData();
    }

    throw new Error(`Card analysis failed: ${error.message}`);
  }
}

/**
 * Fallback to mock data if API fails or is not configured
 */
export function getMockCardData() {
  return {
    playerName: 'Michael Jordan',
    year: '1986',
    manufacturer: 'Fleer',
    cardNumber: '#57',
    cardType: 'Sports',
    sport: 'Basketball',
    estimatedCondition: 'Near Mint'
  };
}
