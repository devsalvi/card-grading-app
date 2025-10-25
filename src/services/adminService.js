import { getAuthToken } from './authService';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

/**
 * Get submission by ID (admin only)
 */
export async function getSubmissionById(submissionId) {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_ENDPOINT}/admin/submissions/${submissionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * List all submissions (admin only)
 */
export async function listAllSubmissions(limit = 50, lastKey = null) {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  let url = `${API_ENDPOINT}/admin/submissions?limit=${limit}`;
  if (lastKey) {
    url += `&lastKey=${lastKey}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Search submissions by email (admin only)
 */
export async function searchSubmissionsByEmail(email) {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_ENDPOINT}/admin/search?email=${encodeURIComponent(email)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
}
