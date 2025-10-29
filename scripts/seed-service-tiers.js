#!/usr/bin/env node

/**
 * Script to seed the ServiceTiers DynamoDB table with initial data
 *
 * Usage:
 *   node scripts/seed-service-tiers.js
 *
 * Make sure to run this after deploying the backend infrastructure:
 *   sam build && sam deploy --resolve-s3
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.SERVICE_TIERS_TABLE_NAME || 'ServiceTiers';

// Service tier data
const SERVICE_TIERS = {
  psa: [
    {
      id: 'walkthrough',
      name: 'Walk-through',
      turnaround: '2 business days',
      price: '$600/card',
      description: 'Fastest service',
      order: 1
    },
    {
      id: 'super_express',
      name: 'Super Express',
      turnaround: '3 business days',
      price: '$300/card',
      description: 'Express service',
      order: 2
    },
    {
      id: 'express',
      name: 'Express',
      turnaround: '5 business days',
      price: '$150/card',
      description: 'Quick turnaround',
      order: 3
    },
    {
      id: 'regular',
      name: 'Regular',
      turnaround: '15 business days',
      price: '$75/card',
      description: 'Standard service',
      order: 4
    },
    {
      id: 'value',
      name: 'Value',
      turnaround: '30 business days',
      price: '$25/card',
      description: 'Economy option',
      order: 5
    },
    {
      id: 'bulk',
      name: 'Bulk',
      turnaround: '45+ business days',
      price: '$20/card',
      description: 'Bulk submissions (20+ cards)',
      order: 6
    }
  ],
  bgs: [
    {
      id: 'premium',
      name: 'Premium',
      turnaround: '5 business days',
      price: '$200/card',
      description: 'Fastest service',
      order: 1
    },
    {
      id: 'express',
      name: 'Express',
      turnaround: '10 business days',
      price: '$100/card',
      description: 'Express service',
      order: 2
    },
    {
      id: 'standard',
      name: 'Standard',
      turnaround: '30 business days',
      price: '$50/card',
      description: 'Standard service',
      order: 3
    },
    {
      id: 'economy',
      name: 'Economy',
      turnaround: '60 business days',
      price: '$25/card',
      description: 'Budget option',
      order: 4
    }
  ],
  sgc: [
    {
      id: 'walkthrough',
      name: 'Walk-through',
      turnaround: '1 business day',
      price: '$500/card',
      description: 'Same day service',
      order: 1
    },
    {
      id: 'next_day',
      name: 'Next Day',
      turnaround: '2 business days',
      price: '$250/card',
      description: 'Next business day',
      order: 2
    },
    {
      id: '2_day',
      name: '2-Day',
      turnaround: '2 business days',
      price: '$100/card',
      description: 'Two day service',
      order: 3
    },
    {
      id: '5_day',
      name: '5-Day',
      turnaround: '5 business days',
      price: '$50/card',
      description: 'Five day service',
      order: 4
    },
    {
      id: '10_day',
      name: '10-Day',
      turnaround: '10 business days',
      price: '$30/card',
      description: 'Ten day service',
      order: 5
    },
    {
      id: '20_day',
      name: '20-Day',
      turnaround: '20 business days',
      price: '$20/card',
      description: 'Twenty day service',
      order: 6
    },
    {
      id: 'bulk',
      name: 'Bulk',
      turnaround: '30+ business days',
      price: '$15/card',
      description: 'Bulk submissions',
      order: 7
    }
  ],
  cgc: [
    {
      id: 'walkthrough',
      name: 'Walk-through',
      turnaround: '3 business days',
      price: '$400/card',
      description: 'Fastest service',
      order: 1
    },
    {
      id: 'express',
      name: 'Express',
      turnaround: '7 business days',
      price: '$150/card',
      description: 'Express service',
      order: 2
    },
    {
      id: 'standard',
      name: 'Standard',
      turnaround: '20 business days',
      price: '$50/card',
      description: 'Standard service',
      order: 3
    },
    {
      id: 'economy',
      name: 'Economy',
      turnaround: '40 business days',
      price: '$25/card',
      description: 'Budget option',
      order: 4
    }
  ]
};

async function seedServiceTiers() {
  console.log(`Seeding service tiers to table: ${TABLE_NAME}`);
  console.log('---');

  let totalItems = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const [company, tiers] of Object.entries(SERVICE_TIERS)) {
    console.log(`\nSeeding tiers for company: ${company.toUpperCase()}`);

    for (const tier of tiers) {
      totalItems++;

      try {
        const item = {
          company: company,
          tierId: tier.id,
          name: tier.name,
          turnaround: tier.turnaround,
          price: tier.price,
          description: tier.description,
          order: tier.order,
          updatedAt: new Date().toISOString()
        };

        const command = new PutCommand({
          TableName: TABLE_NAME,
          Item: item
        });

        await docClient.send(command);
        successCount++;
        console.log(`  ✓ Added: ${tier.name} (${tier.price})`);

      } catch (error) {
        errorCount++;
        console.error(`  ✗ Error adding ${tier.name}:`, error.message);
      }
    }
  }

  console.log('\n---');
  console.log('Seeding complete!');
  console.log(`Total items: ${totalItems}`);
  console.log(`Successfully added: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

// Run the seed function
seedServiceTiers()
  .then(() => {
    console.log('\n✅ Service tiers seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error seeding service tiers:', error);
    process.exit(1);
  });
