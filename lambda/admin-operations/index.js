const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'CardGradingSubmissions';

/**
 * Verify user is an admin and get their company
 * Returns { isAdmin: boolean, company: string|null, isSuperAdmin: boolean }
 */
function getAdminInfo(event) {
  const claims = event.requestContext?.authorizer?.claims;
  if (!claims) return { isAdmin: false, company: null, isSuperAdmin: false };

  const groups = claims['cognito:groups'];
  if (!groups) return { isAdmin: false, company: null, isSuperAdmin: false };

  // Groups can be a string or array
  const groupArray = typeof groups === 'string' ? [groups] : groups;

  // Check if super admin (access to all companies)
  if (groupArray.includes('Super-Admins')) {
    return { isAdmin: true, company: null, isSuperAdmin: true };
  }

  // Check for company-specific admin groups
  const companyMap = {
    'PSA-Admins': 'psa',
    'BGS-Admins': 'bgs',
    'SGC-Admins': 'sgc',
    'CGC-Admins': 'cgc'
  };

  for (const [groupName, companyId] of Object.entries(companyMap)) {
    if (groupArray.includes(groupName)) {
      return { isAdmin: true, company: companyId, isSuperAdmin: false };
    }
  }

  return { isAdmin: false, company: null, isSuperAdmin: false };
}

/**
 * Get submission by ID
 * Requires admin authorization
 */
exports.getSubmission = async (event) => {
  console.log('Get submission event:', JSON.stringify(event, null, 2));

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Verify admin authorization and get company
    const adminInfo = getAdminInfo(event);
    if (!adminInfo.isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'Admin access required'
        })
      };
    }

    const submissionId = event.pathParameters?.submissionId;

    if (!submissionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing submissionId parameter' })
      };
    }

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { submissionId: submissionId.toString() }
    });

    const result = await docClient.send(command);

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Not found',
          message: `Submission ${submissionId} not found`
        })
      };
    }

    // Filter by company if not super admin
    if (!adminInfo.isSuperAdmin && result.Item.gradingCompany !== adminInfo.company) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'You can only view submissions for your company'
        })
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

/**
 * List all submissions (paginated)
 * Requires admin authorization
 */
exports.listSubmissions = async (event) => {
  console.log('List submissions event:', JSON.stringify(event, null, 2));

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Verify admin authorization and get company
    const adminInfo = getAdminInfo(event);
    if (!adminInfo.isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'Admin access required'
        })
      };
    }

    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit) || 50;
    const lastKey = queryParams.lastKey ? JSON.parse(decodeURIComponent(queryParams.lastKey)) : undefined;

    const scanParams = {
      TableName: TABLE_NAME,
      Limit: limit,
      ExclusiveStartKey: lastKey
    };

    // Filter by company if not super admin
    if (!adminInfo.isSuperAdmin && adminInfo.company) {
      scanParams.FilterExpression = 'gradingCompany = :company';
      scanParams.ExpressionAttributeValues = {
        ':company': adminInfo.company
      };
    }

    const command = new ScanCommand(scanParams);
    const result = await docClient.send(command);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        items: result.Items || [],
        count: result.Count,
        lastKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
        company: adminInfo.company,
        isSuperAdmin: adminInfo.isSuperAdmin
      })
    };

  } catch (error) {
    console.error('Error listing submissions:', error);
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
 * Search submissions by email
 * Requires admin authorization
 */
exports.searchByEmail = async (event) => {
  console.log('Search by email event:', JSON.stringify(event, null, 2));

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Verify admin authorization and get company
    const adminInfo = getAdminInfo(event);
    if (!adminInfo.isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'Admin access required'
        })
      };
    }

    const email = event.queryStringParameters?.email;

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing email parameter' })
      };
    }

    const queryParams = {
      TableName: TABLE_NAME,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    };

    // Filter by company if not super admin
    if (!adminInfo.isSuperAdmin && adminInfo.company) {
      queryParams.FilterExpression = 'gradingCompany = :company';
      queryParams.ExpressionAttributeValues[':company'] = adminInfo.company;
    }

    const command = new QueryCommand(queryParams);
    const result = await docClient.send(command);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        items: result.Items || [],
        count: result.Count,
        company: adminInfo.company,
        isSuperAdmin: adminInfo.isSuperAdmin
      })
    };

  } catch (error) {
    console.error('Error searching by email:', error);
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
