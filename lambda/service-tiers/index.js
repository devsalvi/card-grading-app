const { DynamoDBClient, QueryCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const tableName = process.env.SERVICE_TIERS_TABLE_NAME || 'ServiceTiers';

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Content-Type': 'application/json',
    // Cache for 1 hour (3600 seconds) since tiers change infrequently
    'Cache-Control': 'public, max-age=3600'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Get company from query parameters
    const company = event.queryStringParameters?.company;

    let tiers;

    if (company) {
      // Query for specific company
      console.log(`Querying tiers for company: ${company}`);

      const params = {
        TableName: tableName,
        KeyConditionExpression: 'company = :company',
        ExpressionAttributeValues: {
          ':company': { S: company }
        }
      };

      const command = new QueryCommand(params);
      const response = await dynamoClient.send(command);

      if (!response.Items || response.Items.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'No service tiers found for company',
            company
          })
        };
      }

      // Unmarshall DynamoDB items
      tiers = response.Items.map(item => unmarshall(item));

    } else {
      // Get all tiers (scan entire table)
      console.log('Scanning all service tiers');

      const params = {
        TableName: tableName
      };

      const command = new ScanCommand(params);
      const response = await dynamoClient.send(command);

      if (!response.Items || response.Items.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'No service tiers found'
          })
        };
      }

      // Unmarshall DynamoDB items and group by company
      const allTiers = response.Items.map(item => unmarshall(item));

      // Group tiers by company
      tiers = allTiers.reduce((acc, tier) => {
        if (!acc[tier.company]) {
          acc[tier.company] = [];
        }
        acc[tier.company].push(tier);
        return acc;
      }, {});
    }

    console.log(`Successfully retrieved service tiers`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        company: company || 'all',
        tiers
      })
    };

  } catch (error) {
    console.error('Error retrieving service tiers:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to retrieve service tiers',
        message: error.message
      })
    };
  }
};
