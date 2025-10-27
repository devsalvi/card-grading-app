/**
 * Service for fetching user's own submissions
 */

import { getAuthToken } from './authService';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3001';

/**
 * Get logged-in user's submissions (last 10)
 * Requires authentication
 * @returns {Promise<Array>} Array of user's submissions
 */
export async function getMySubmissions() {
  try {
    // Get auth token
    const token = await getAuthToken();

    if (!token) {
      throw new Error('Not authenticated. Please sign in to view your submissions.');
    }

    const response = await fetch(`${API_ENDPOINT}/my-submissions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.submissions || [];

  } catch (error) {
    console.error('Error fetching user submissions:', error);
    throw error;
  }
}
