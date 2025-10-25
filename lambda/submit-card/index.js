const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true, // Remove undefined values from the object
    convertEmptyValues: false,
  },
});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'CardGradingSubmissions';

/**
 * Lambda handler for card grading submissions
 * Saves submission data to DynamoDB
 */
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Content-Type': 'application/json'
  };

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
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

    // Validate required fields
    if (!body.submissionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required field: submissionId'
        })
      };
    }

    if (!body.cards || !Array.isArray(body.cards) || body.cards.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing or invalid cards array'
        })
      };
    }

    // Prepare DynamoDB item
    const item = {
      submissionId: body.submissionId.toString(),

      // Submitter information
      gradingCompany: body.gradingCompany,
      submitterName: body.submitterName,
      email: body.email,
      phone: body.phone || undefined,
      address: body.address || undefined,
      specialInstructions: body.specialInstructions || undefined,

      // Cards array (storing card details)
      cards: body.cards.map(card => ({
        cardType: card.cardType,
        sport: card.sport || undefined,
        playerName: card.playerName,
        year: card.year,
        manufacturer: card.manufacturer || undefined,
        cardNumber: card.cardNumber || undefined,
        estimatedCondition: card.estimatedCondition,
        declaredValue: card.declaredValue,
        // Note: Not storing base64 image data to save storage costs
        // Store image URLs if uploaded to S3 instead
      })),

      // Metadata
      submittedAt: new Date().toISOString(),
      status: 'pending', // pending, processing, completed
      totalCards: body.cards.length,
      totalDeclaredValue: body.cards.reduce((sum, card) => sum + parseFloat(card.declaredValue || 0), 0),

      // TTL - auto-delete after 90 days (optional)
      ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)
    };

    // Save to DynamoDB
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    });

    await docClient.send(command);

    console.log('Successfully saved submission:', body.submissionId);

    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Submission saved successfully',
        submissionId: body.submissionId,
        savedAt: item.submittedAt
      })
    };

  } catch (error) {
    console.error('Error processing submission:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

/**
 * Optional: Get submission by ID
 * Can be called with GET /submissions/{submissionId}
 */
exports.getSubmission = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const submissionId = event.pathParameters?.submissionId;

    if (!submissionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing submissionId' })
      };
    }

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        submissionId: submissionId.toString()
      }
    });

    const result = await docClient.send(command);

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Submission not found' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Item)
    };

  } catch (error) {
    console.error('Error fetching submission:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
