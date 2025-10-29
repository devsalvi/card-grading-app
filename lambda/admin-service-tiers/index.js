const { DynamoDBClient, QueryCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, DeleteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const tableName = process.env.SERVICE_TIERS_TABLE_NAME || 'ServiceTiers';
const auditTableName = process.env.SERVICE_TIER_AUDIT_TABLE_NAME || 'ServiceTierAudit';

// Company mapping for admin groups
const COMPANY_GROUPS = {
  'PSA-Admins': 'psa',
  'BGS-Admins': 'bgs',
  'SGC-Admins': 'sgc',
  'CGC-Admins': 'cgc',
  'Super-Admins': 'all'
};

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json'
};

/**
 * Extract user groups and determine allowed companies
 */
function getUserCompanies(event) {
  const groups = event.requestContext?.authorizer?.claims?.['cognito:groups'];

  if (!groups) {
    return [];
  }

  const groupArray = typeof groups === 'string' ? groups.split(',') : groups;

  // If Super-Admin, allow all companies
  if (groupArray.includes('Super-Admins')) {
    return ['all'];
  }

  // Map groups to companies
  const companies = groupArray
    .map(group => COMPANY_GROUPS[group])
    .filter(company => company && company !== 'all');

  return companies;
}

/**
 * Check if user has access to a specific company
 */
function hasCompanyAccess(userCompanies, company) {
  if (userCompanies.includes('all')) {
    return true;
  }
  return userCompanies.includes(company);
}

/**
 * Extract user information from Cognito JWT
 */
function getUserInfo(event) {
  const claims = event.requestContext?.authorizer?.claims || {};
  return {
    userId: claims.sub || 'unknown',
    email: claims.email || 'unknown',
    username: claims['cognito:username'] || claims.email || 'unknown',
    groups: claims['cognito:groups'] || []
  };
}

/**
 * Write audit record to DynamoDB
 */
async function writeAuditRecord(action, company, tierId, userInfo, oldValue = null, newValue = null) {
  try {
    const timestamp = new Date().toISOString();
    const auditId = `${company}-${tierId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const auditRecord = {
      auditId,
      timestamp,
      action,
      company,
      tierId,
      userId: userInfo.userId,
      userEmail: userInfo.email,
      userName: userInfo.username,
      userGroups: typeof userInfo.groups === 'string' ? userInfo.groups : (userInfo.groups || []).join(','),
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null
    };

    const command = new PutCommand({
      TableName: auditTableName,
      Item: auditRecord
    });

    await docClient.send(command);
    console.log('Audit record written:', auditId);
  } catch (error) {
    console.error('Error writing audit record:', error);
    // Don't fail the main operation if audit logging fails
  }
}

/**
 * List service tiers - GET /admin/service-tiers
 */
exports.listTiers = async (event) => {
  console.log('List service tiers:', JSON.stringify(event, null, 2));

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const userCompanies = getUserCompanies(event);

    if (userCompanies.length === 0) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'User is not in any admin group'
        })
      };
    }

    const company = event.queryStringParameters?.company;

    // If company specified, check access
    if (company && !hasCompanyAccess(userCompanies, company)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Forbidden',
          message: `You do not have access to ${company.toUpperCase()} service tiers`
        })
      };
    }

    let tiers;

    if (company) {
      // Query specific company
      const params = {
        TableName: tableName,
        KeyConditionExpression: 'company = :company',
        ExpressionAttributeValues: {
          ':company': { S: company }
        }
      };

      const command = new QueryCommand(params);
      const response = await dynamoClient.send(command);
      tiers = response.Items ? response.Items.map(item => unmarshall(item)) : [];

    } else {
      // Scan all (or filter by user's companies)
      const params = { TableName: tableName };
      const command = new ScanCommand(params);
      const response = await dynamoClient.send(command);

      let allTiers = response.Items ? response.Items.map(item => unmarshall(item)) : [];

      // Filter by user's allowed companies
      if (!userCompanies.includes('all')) {
        allTiers = allTiers.filter(tier => userCompanies.includes(tier.company));
      }

      // Group by company
      tiers = allTiers.reduce((acc, tier) => {
        if (!acc[tier.company]) {
          acc[tier.company] = [];
        }
        acc[tier.company].push(tier);
        return acc;
      }, {});
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        tiers,
        allowedCompanies: userCompanies
      })
    };

  } catch (error) {
    console.error('Error listing service tiers:', error);
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

/**
 * Update service tier - PUT /admin/service-tiers
 */
exports.updateTier = async (event) => {
  console.log('Update service tier:', JSON.stringify(event, null, 2));

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const userCompanies = getUserCompanies(event);

    if (userCompanies.length === 0) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'User is not in any admin group'
        })
      };
    }

    const body = JSON.parse(event.body);
    const { company, tierId, name, turnaround, price, description, order } = body;

    // Validate required fields
    if (!company || !tierId || !name || !turnaround || !price || !description) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Missing required fields: company, tierId, name, turnaround, price, description'
        })
      };
    }

    // Check company access
    if (!hasCompanyAccess(userCompanies, company)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Forbidden',
          message: `You do not have access to update ${company.toUpperCase()} service tiers`
        })
      };
    }

    // Get user info for audit
    const userInfo = getUserInfo(event);

    // Get old tier data for audit (if exists)
    let oldTier = null;
    try {
      const getCommand = new GetCommand({
        TableName: tableName,
        Key: { company, tierId }
      });
      const getResult = await docClient.send(getCommand);
      oldTier = getResult.Item || null;
    } catch (error) {
      console.log('No existing tier found, this is a new creation');
    }

    // Update the tier
    const item = {
      company,
      tierId,
      name,
      turnaround,
      price,
      description,
      order: order || 0,
      updatedAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: tableName,
      Item: item
    });

    await docClient.send(command);

    // Write audit record
    const action = oldTier ? 'update' : 'create';
    await writeAuditRecord(action, company, tierId, userInfo, oldTier, item);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Service tier updated successfully',
        tier: item
      })
    };

  } catch (error) {
    console.error('Error updating service tier:', error);
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

/**
 * Delete service tier - DELETE /admin/service-tiers
 */
exports.deleteTier = async (event) => {
  console.log('Delete service tier:', JSON.stringify(event, null, 2));

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const userCompanies = getUserCompanies(event);

    if (userCompanies.length === 0) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'User is not in any admin group'
        })
      };
    }

    const company = event.queryStringParameters?.company;
    const tierId = event.queryStringParameters?.tierId;

    if (!company || !tierId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Missing required parameters: company, tierId'
        })
      };
    }

    // Check company access
    if (!hasCompanyAccess(userCompanies, company)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Forbidden',
          message: `You do not have access to delete ${company.toUpperCase()} service tiers`
        })
      };
    }

    // Get user info for audit
    const userInfo = getUserInfo(event);

    // Get tier data before deletion for audit
    let oldTier = null;
    try {
      const getCommand = new GetCommand({
        TableName: tableName,
        Key: { company, tierId }
      });
      const getResult = await docClient.send(getCommand);
      oldTier = getResult.Item || null;
    } catch (error) {
      console.log('Tier not found for deletion');
    }

    // Delete the tier
    const command = new DeleteCommand({
      TableName: tableName,
      Key: {
        company,
        tierId
      }
    });

    await docClient.send(command);

    // Write audit record
    await writeAuditRecord('delete', company, tierId, userInfo, oldTier, null);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Service tier deleted successfully'
      })
    };

  } catch (error) {
    console.error('Error deleting service tier:', error);
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
