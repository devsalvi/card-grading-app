/**
 * Service Tiers API Service
 *
 * Fetches service tiers from the backend API with caching.
 * Cache duration: 1 hour (configurable)
 */

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://kt62i1wkyh.execute-api.us-east-1.amazonaws.com/prod';

// In-memory cache
const cache = {
  data: null,
  timestamp: null,
  duration: 60 * 60 * 1000 // 1 hour in milliseconds
};

// Fallback data in case API fails
const FALLBACK_TIERS = {
  psa: [
    { id: 'walkthrough', name: 'Walk-through', turnaround: '2 business days', price: '$600/card', description: 'Fastest service' },
    { id: 'super_express', name: 'Super Express', turnaround: '3 business days', price: '$300/card', description: 'Express service' },
    { id: 'express', name: 'Express', turnaround: '5 business days', price: '$150/card', description: 'Quick turnaround' },
    { id: 'regular', name: 'Regular', turnaround: '15 business days', price: '$75/card', description: 'Standard service' },
    { id: 'value', name: 'Value', turnaround: '30 business days', price: '$25/card', description: 'Economy option' },
    { id: 'bulk', name: 'Bulk', turnaround: '45+ business days', price: '$20/card', description: 'Bulk submissions (20+ cards)' }
  ],
  bgs: [
    { id: 'premium', name: 'Premium', turnaround: '5 business days', price: '$200/card', description: 'Fastest service' },
    { id: 'express', name: 'Express', turnaround: '10 business days', price: '$100/card', description: 'Express service' },
    { id: 'standard', name: 'Standard', turnaround: '30 business days', price: '$50/card', description: 'Standard service' },
    { id: 'economy', name: 'Economy', turnaround: '60 business days', price: '$25/card', description: 'Budget option' }
  ],
  sgc: [
    { id: 'walkthrough', name: 'Walk-through', turnaround: '1 business day', price: '$500/card', description: 'Same day service' },
    { id: 'next_day', name: 'Next Day', turnaround: '2 business days', price: '$250/card', description: 'Next business day' },
    { id: '2_day', name: '2-Day', turnaround: '2 business days', price: '$100/card', description: 'Two day service' },
    { id: '5_day', name: '5-Day', turnaround: '5 business days', price: '$50/card', description: 'Five day service' },
    { id: '10_day', name: '10-Day', turnaround: '10 business days', price: '$30/card', description: 'Ten day service' },
    { id: '20_day', name: '20-Day', turnaround: '20 business days', price: '$20/card', description: 'Twenty day service' },
    { id: 'bulk', name: 'Bulk', turnaround: '30+ business days', price: '$15/card', description: 'Bulk submissions' }
  ],
  cgc: [
    { id: 'walkthrough', name: 'Walk-through', turnaround: '3 business days', price: '$400/card', description: 'Fastest service' },
    { id: 'express', name: 'Express', turnaround: '7 business days', price: '$150/card', description: 'Express service' },
    { id: 'standard', name: 'Standard', turnaround: '20 business days', price: '$50/card', description: 'Standard service' },
    { id: 'economy', name: 'Economy', turnaround: '40 business days', price: '$25/card', description: 'Budget option' }
  ]
};

/**
 * Check if cache is still valid
 */
function isCacheValid() {
  if (!cache.data || !cache.timestamp) {
    return false;
  }

  const now = Date.now();
  const cacheAge = now - cache.timestamp;

  return cacheAge < cache.duration;
}

/**
 * Fetch all service tiers from API (grouped by company)
 */
export async function getAllServiceTiers() {
  try {
    // Check cache first
    if (isCacheValid()) {
      console.log('[ServiceTiers] Using cached data');
      return cache.data;
    }

    console.log('[ServiceTiers] Fetching from API...');

    const response = await fetch(`${API_ENDPOINT}/service-tiers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.tiers) {
      throw new Error('Invalid API response format');
    }

    // Update cache
    cache.data = result.tiers;
    cache.timestamp = Date.now();

    console.log('[ServiceTiers] Data fetched and cached successfully');
    return result.tiers;

  } catch (error) {
    console.error('[ServiceTiers] Error fetching service tiers:', error);
    console.warn('[ServiceTiers] Using fallback data');

    // Return fallback data if API fails
    return FALLBACK_TIERS;
  }
}

/**
 * Fetch service tiers for a specific company
 */
export async function getServiceTiersByCompany(company) {
  try {
    // First try to get from cache
    if (isCacheValid() && cache.data && cache.data[company]) {
      console.log(`[ServiceTiers] Using cached data for ${company}`);
      return cache.data[company];
    }

    console.log(`[ServiceTiers] Fetching tiers for ${company} from API...`);

    const response = await fetch(`${API_ENDPOINT}/service-tiers?company=${company}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.tiers) {
      throw new Error('Invalid API response format');
    }

    // Sort by order field
    const sortedTiers = result.tiers.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Update cache for this company
    if (!cache.data) {
      cache.data = {};
    }
    cache.data[company] = sortedTiers;
    cache.timestamp = Date.now();

    console.log(`[ServiceTiers] Tiers for ${company} fetched and cached`);
    return sortedTiers;

  } catch (error) {
    console.error(`[ServiceTiers] Error fetching tiers for ${company}:`, error);
    console.warn(`[ServiceTiers] Using fallback data for ${company}`);

    // Return fallback data if API fails
    return FALLBACK_TIERS[company] || [];
  }
}

/**
 * Clear the cache (useful for forcing a refresh)
 */
export function clearCache() {
  cache.data = null;
  cache.timestamp = null;
  console.log('[ServiceTiers] Cache cleared');
}

/**
 * Set custom cache duration (in milliseconds)
 */
export function setCacheDuration(milliseconds) {
  cache.duration = milliseconds;
  console.log(`[ServiceTiers] Cache duration set to ${milliseconds}ms`);
}
