/**
 * Lambda function to analyze card images using Google Gemini Vision API
 *
 * This function receives base64-encoded card images from the frontend,
 * analyzes them using Google Gemini's vision capabilities,
 * and returns structured card information.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// CORS headers for API Gateway
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

/**
 * Parse text response when JSON parsing fails
 */
function parseTextResponse(text) {
  const cardData = {
    playerName: 'Unknown Player',
    year: new Date().getFullYear().toString(),
    manufacturer: 'Unknown',
    cardNumber: '',
    cardType: 'Other',
    sport: 'Other',
    estimatedCondition: 'Very Good'
  };

  // Try to extract information from text
  const lines = text.split('\n');
  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.includes('player') || lower.includes('name:')) {
      const match = line.match(/[:：]\s*(.+)/);
      if (match) cardData.playerName = match[1].trim();
    }

    if (lower.includes('year:')) {
      const match = line.match(/[:：]\s*(\d{4})/);
      if (match) cardData.year = match[1];
    }

    if (lower.includes('manufacturer:') || lower.includes('brand:')) {
      const match = line.match(/[:：]\s*(.+)/);
      if (match) cardData.manufacturer = match[1].trim();
    }

    if (lower.includes('card number:')) {
      const match = line.match(/[:：]\s*(.+)/);
      if (match) cardData.cardNumber = match[1].trim();
    }

    if (lower.includes('condition:')) {
      const match = line.match(/[:：]\s*(.+)/);
      if (match) cardData.estimatedCondition = match[1].trim();
    }
  }

  // Determine card type from text
  const lowerText = text.toLowerCase();
  if (lowerText.includes('pokemon') || lowerText.includes('pokémon')) {
    cardData.cardType = 'Trading Card Game (TCG)';
    cardData.sport = 'Pokemon';
  } else if (lowerText.includes('magic') || lowerText.includes('mtg')) {
    cardData.cardType = 'Trading Card Game (TCG)';
    cardData.sport = 'Magic: The Gathering';
  } else if (lowerText.includes('yu-gi-oh') || lowerText.includes('yugioh')) {
    cardData.cardType = 'Trading Card Game (TCG)';
    cardData.sport = 'Yu-Gi-Oh!';
  } else if (lowerText.includes('baseball')) {
    cardData.cardType = 'Sports';
    cardData.sport = 'Baseball';
  } else if (lowerText.includes('basketball')) {
    cardData.cardType = 'Sports';
    cardData.sport = 'Basketball';
  } else if (lowerText.includes('football')) {
    cardData.cardType = 'Sports';
    cardData.sport = 'Football';
  }

  return cardData;
}

/**
 * Analyze a card image using Google Gemini
 */
async function analyzeCardWithGemini(base64Image) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Google Gemini API key not configured in Lambda environment variables');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  console.log('Analyzing card with Google Gemini Vision...');

  // Use Gemini 2.5 Flash for fast, cost-effective vision analysis
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

  // Create the prompt for card analysis - supports detecting multiple cards (up to 10)
  const prompt = `Analyze this image for trading cards or sports cards. The image may contain 1-10 cards. Detect ALL visible cards and extract information for each one.

Return a JSON object with this exact format:
{
  "cards": [
    {
      "playerName": "The name of the player, character, or subject on the card",
      "year": "The year the card was produced or the set date",
      "manufacturer": "The brand/company that made the card (e.g., Topps, Fleer, Panini, Upper Deck, Pokemon Company, Wizards of the Coast, Konami)",
      "cardNumber": "The card number if visible",
      "cardType": "The type of card: 'Sports', 'Trading Card Game (TCG)', or 'Other'",
      "sport": "The sport or game (Baseball, Basketball, Football, Hockey, Soccer, Pokemon, Magic: The Gathering, Yu-Gi-Oh!, or Other)",
      "estimatedCondition": "Estimated condition based on visible wear: 'Mint', 'Near Mint', 'Excellent', 'Very Good', 'Good', 'Fair', or 'Poor'"
    }
  ]
}

Important instructions:
- If the image contains MULTIPLE cards (up to 10), analyze each card separately and include all in the "cards" array
- If the image contains ONLY ONE card, still return the "cards" array with one object
- Analyze each visible card carefully and extract details for each
- If this is a Pokemon card, cardType should be "Trading Card Game (TCG)" and sport should be "Pokemon"
- If this is a Magic: The Gathering card, cardType should be "Trading Card Game (TCG)" and sport should be "Magic: The Gathering"
- If this is a Yu-Gi-Oh! card, cardType should be "Trading Card Game (TCG)" and sport should be "Yu-Gi-Oh!"
- If it's a sports card (baseball, basketball, etc.), cardType should be "Sports"
- Look carefully at any text, logos, and branding visible on each card
- For year, extract the copyright year or set year visible on the card
- Return ONLY valid JSON in the format shown above, no additional text or explanation`;

  // Prepare the image data
  // Remove data URI prefix if present (e.g., "data:image/png;base64,")
  let imageData = base64Image;
  let mimeType = 'image/jpeg'; // Default

  if (base64Image.startsWith('data:')) {
    const match = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1]; // Extract MIME type (e.g., "image/png", "image/jpeg")
      imageData = match[2]; // Extract just the base64 data
      console.log(`Extracted MIME type: ${mimeType}, base64 length: ${imageData.length}`);
    }
  }

  const imageParts = [
    {
      inlineData: {
        data: imageData,
        mimeType: mimeType
      }
    }
  ];

  // Generate content with the image and prompt
  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  const text = response.text();

  console.log('Gemini raw response:', text);

  // Extract JSON from the response
  let responseData;
  try {
    // Try to parse the response as JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseData = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (parseError) {
    console.error('Failed to parse Gemini response as JSON:', parseError);
    // Fallback to extracting information from text
    const singleCard = parseTextResponse(text);
    responseData = { cards: [singleCard] };
  }

  // Ensure response has cards array
  if (!responseData.cards || !Array.isArray(responseData.cards)) {
    // If single card object was returned, convert to array format
    responseData = { cards: [responseData] };
  }

  // Ensure all cards have required fields
  const cards = responseData.cards.map(card => ({
    playerName: card.playerName || 'Unknown Player',
    year: card.year || new Date().getFullYear().toString(),
    manufacturer: card.manufacturer || 'Unknown',
    cardNumber: card.cardNumber || '',
    cardType: card.cardType || 'Other',
    sport: card.sport || 'Other',
    estimatedCondition: card.estimatedCondition || 'Very Good'
  }));

  console.log(`Extracted ${cards.length} card(s):`, cards);
  return { cards };
}

/**
 * Lambda handler
 */
exports.handler = async (event) => {
  console.log('Analyze Card Lambda invoked');
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const { image } = body;

    if (!image) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Missing required field: image (base64-encoded)'
        })
      };
    }

    // Check if Gemini API key is configured
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.warn('Google Gemini API key not configured. Returning mock data.');

      // Return mock data when API key is not configured
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            cards: [
              {
                playerName: 'Michael Jordan',
                year: '1986',
                manufacturer: 'Fleer',
                cardNumber: '#57',
                cardType: 'Sports',
                sport: 'Basketball',
                estimatedCondition: 'Near Mint'
              }
            ]
          },
          mock: true,
          message: 'Using mock data - Gemini API key not configured'
        })
      };
    }

    // Analyze the card image
    const cardData = await analyzeCardWithGemini(image);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: cardData
      })
    };

  } catch (error) {
    console.error('Error analyzing card:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message || 'Failed to analyze card image'
      })
    };
  }
};
