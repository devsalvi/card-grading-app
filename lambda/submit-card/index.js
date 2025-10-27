const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true, // Remove undefined values from the object
    convertEmptyValues: false,
  },
});

// Initialize S3 client
const s3Client = new S3Client({});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'CardGradingSubmissions';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

/**
 * Upload image to S3
 * @param {string} base64Image - Base64 encoded image
 * @param {string} submissionId - Submission ID
 * @param {number} cardIndex - Index of the card
 * @returns {Promise<string>} S3 URL of uploaded image
 */
async function uploadImageToS3(base64Image, submissionId, cardIndex) {
  if (!S3_BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME environment variable not set');
  }

  // Remove data URI prefix if present
  let imageData = base64Image;
  let mimeType = 'image/jpeg';

  if (base64Image.startsWith('data:')) {
    const match = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      imageData = match[2];
    }
  }

  // Convert base64 to buffer
  const imageBuffer = Buffer.from(imageData, 'base64');

  // Generate unique filename
  const fileExtension = mimeType.split('/')[1] || 'jpg';
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(8).toString('hex');
  const fileName = `submissions/${submissionId}/card-${cardIndex}-${timestamp}-${randomHash}.${fileExtension}`;

  // Upload to S3
  const uploadCommand = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: fileName,
    Body: imageBuffer,
    ContentType: mimeType,
    Metadata: {
      submissionId: submissionId.toString(),
      cardIndex: cardIndex.toString(),
      uploadedAt: new Date().toISOString()
    }
  });

  await s3Client.send(uploadCommand);

  // Return S3 URL
  const s3Url = `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
  console.log(`Uploaded image to S3: ${s3Url}`);

  return s3Url;
}

/**
 * Lambda handler for card grading submissions
 * Saves submission data to DynamoDB and uploads images to S3
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

    // Upload images to S3 and prepare cards array with S3 URLs
    console.log(`Processing ${body.cards.length} cards for submission ${body.submissionId}`);

    const cardsWithImages = await Promise.all(
      body.cards.map(async (card, index) => {
        let imageUrl = undefined;
        let imageMetadata = undefined;

        // Upload image to S3 if provided
        if (card.imageData) {
          try {
            imageUrl = await uploadImageToS3(card.imageData, body.submissionId, index);

            // Store AI analysis metadata if available
            imageMetadata = {
              detectedCardNumber: card.detectedCardNumber || undefined,
              totalCardsInImage: card.totalCardsInImage || undefined,
              aiAnalyzed: card.aiAnalyzed || false,
              analyzedAt: card.analyzedAt || undefined
            };
          } catch (uploadError) {
            console.error(`Failed to upload image for card ${index}:`, uploadError);
            // Continue without image - don't fail entire submission
          }
        }

        return {
          cardType: card.cardType,
          sport: card.sport || undefined,
          playerName: card.playerName,
          year: card.year,
          manufacturer: card.manufacturer || undefined,
          cardNumber: card.cardNumber || undefined,
          estimatedCondition: card.estimatedCondition,
          declaredValue: card.declaredValue,
          imageUrl,
          imageMetadata
        };
      })
    );

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

      // Cards array with S3 image URLs and AI metadata
      cards: cardsWithImages,

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
