import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Analyze a card image using Google Gemini's vision capabilities
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<Object>} Extracted card information
 */
export async function analyzeCardWithGemini(base64Image) {
  const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Google Gemini API key not configured. Please add VITE_GOOGLE_GEMINI_API_KEY to your .env file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    console.log('Analyzing card with Google Gemini Vision...');

    // Use Gemini 2.5 Flash for fast, cost-effective vision analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

    // Create the prompt for card analysis
    const prompt = `Analyze this trading card or sports card image and extract the following information in JSON format:

{
  "playerName": "The name of the player, character, or subject on the card",
  "year": "The year the card was produced or the set date",
  "manufacturer": "The brand/company that made the card (e.g., Topps, Fleer, Panini, Upper Deck, Pokemon Company, Wizards of the Coast, Konami)",
  "cardNumber": "The card number if visible",
  "cardType": "The type of card: 'Sports', 'Trading Card Game (TCG)', or 'Other'",
  "sport": "The sport or game (Baseball, Basketball, Football, Hockey, Soccer, Pokemon, Magic: The Gathering, Yu-Gi-Oh!, or Other)",
  "estimatedCondition": "Estimated condition based on visible wear: 'Mint', 'Near Mint', 'Excellent', 'Very Good', 'Good', 'Fair', or 'Poor'"
}

Important:
- If this is a Pokemon card, cardType should be "Trading Card Game (TCG)" and sport should be "Pokemon"
- If this is a Magic: The Gathering card, cardType should be "Trading Card Game (TCG)" and sport should be "Magic: The Gathering"
- If this is a Yu-Gi-Oh! card, cardType should be "Trading Card Game (TCG)" and sport should be "Yu-Gi-Oh!"
- If it's a sports card (baseball, basketball, etc.), cardType should be "Sports"
- Look carefully at any text, logos, and branding visible on the card
- For year, extract the copyright year or set year visible on the card
- Return ONLY valid JSON, no additional text or explanation`;

    // Prepare the image data
    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg'
        }
      }
    ];

    // Generate content with the image and prompt
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini raw response:', text);

    // Extract JSON from the response
    let cardData;
    try {
      // Try to parse the response as JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cardData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      // Fallback to extracting information from text
      cardData = parseTextResponse(text);
    }

    // Ensure all required fields are present
    cardData = {
      playerName: cardData.playerName || 'Unknown Player',
      year: cardData.year || new Date().getFullYear().toString(),
      manufacturer: cardData.manufacturer || 'Unknown',
      cardNumber: cardData.cardNumber || '',
      cardType: cardData.cardType || 'Other',
      sport: cardData.sport || 'Other',
      estimatedCondition: cardData.estimatedCondition || 'Very Good'
    };

    console.log('Extracted card data:', cardData);
    return cardData;

  } catch (error) {
    console.error('Google Gemini API error:', error);

    if (error.message.includes('API key not valid')) {
      throw new Error('Invalid Google Gemini API key. Please check your API key at https://aistudio.google.com/app/apikey');
    }

    throw new Error(`Card analysis failed: ${error.message}`);
  }
}

/**
 * Parse text response when JSON parsing fails
 * @param {string} text - The text response from Gemini
 * @returns {Object} Extracted card data
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
