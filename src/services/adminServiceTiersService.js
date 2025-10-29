/**
 * Admin Service Tiers API Service
 *
 * Provides authenticated admin endpoints for managing service tiers.
 * Only accessible to users in admin groups.
 */

import { getAuthToken } from './authService';
import { clearCache } from './serviceTiersService';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://kt62i1wkyh.execute-api.us-east-1.amazonaws.com/prod';

/**
 * List service tiers (admin endpoint with auth)
 * Returns only tiers accessible to the admin's company
 */
export async function listAdminServiceTiers(company = null) {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const url = company
      ? `${API_ENDPOINT}/admin/service-tiers?company=${company}`
      : `${API_ENDPOINT}/admin/service-tiers`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Request failed: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('[AdminServiceTiers] Error listing service tiers:', error);
    throw error;
  }
}

/**
 * Update or create a service tier
 */
export async function updateServiceTier(tierData) {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    // Validate required fields
    const { company, tierId, name, turnaround, price, description } = tierData;

    if (!company || !tierId || !name || !turnaround || !price || !description) {
      throw new Error('Missing required fields');
    }

    const response = await fetch(`${API_ENDPOINT}/admin/service-tiers`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(tierData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Request failed: ${response.status}`);
    }

    const result = await response.json();

    // Clear the public cache so changes appear immediately
    clearCache();

    return result;

  } catch (error) {
    console.error('[AdminServiceTiers] Error updating service tier:', error);
    throw error;
  }
}

/**
 * Delete a service tier
 */
export async function deleteServiceTier(company, tierId) {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_ENDPOINT}/admin/service-tiers?company=${company}&tierId=${tierId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Request failed: ${response.status}`);
    }

    const result = await response.json();

    // Clear the public cache so changes appear immediately
    clearCache();

    return result;

  } catch (error) {
    console.error('[AdminServiceTiers] Error deleting service tier:', error);
    throw error;
  }
}

/**
 * Create a new service tier (convenience wrapper around updateServiceTier)
 */
export async function createServiceTier(tierData) {
  return updateServiceTier(tierData);
}
