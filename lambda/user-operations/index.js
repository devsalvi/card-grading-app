const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'CardGradingSubmissions';

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,GET',
  'Content-Type': 'application/json'
};

/**
 * Get user's submissions
 * Fetches last 10 submissions for the authenticated user
 */
exports.getMySubmissions = async (event) => {
  console.log('Get My Submissions - Event:', JSON.stringify(event, null, 2));

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Extract user email from Cognito authorizer context
    const userEmail = event.requestContext?.authorizer?.claims?.email;

    if (!userEmail) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'User email not found in token'
        })
      };
    }

    console.log(`Fetching submissions for user: ${userEmail}`);

    // Query DynamoDB using EmailIndex GSI
    const queryCommand = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': userEmail
      },
      ScanIndexForward: false, // Sort descending (newest first)
      Limit: 10
    });

    const result = await docClient.send(queryCommand);

    console.log(`Found ${result.Items?.length || 0} submissions for ${userEmail}`);

    // Format the response
    const submissions = (result.Items || []).map(item => ({
      submissionId: item.submissionId,
      gradingCompany: item.gradingCompany,
      totalCards: item.totalCards,
      totalDeclaredValue: item.totalDeclaredValue,
      status: item.status,
      submittedAt: item.submittedAt,
      cards: item.cards.map(card => ({
        playerName: card.playerName,
        year: card.year,
        manufacturer: card.manufacturer,
        cardType: card.cardType,
        sport: card.sport,
        estimatedCondition: card.estimatedCondition,
        declaredValue: card.declaredValue,
        imageUrl: card.imageUrl,
        imageMetadata: card.imageMetadata
      }))
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: submissions.length,
        submissions
      })
    };

  } catch (error) {
    console.error('Error fetching user submissions:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};
