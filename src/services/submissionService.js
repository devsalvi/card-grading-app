/**
 * Service for submitting card grading forms to the backend API
 */

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3001';

/**
 * Submit card grading form to DynamoDB via Lambda
 * @param {Object} formData - The form submission data
 * @returns {Promise<Object>} Response from the API
 */
export async function submitCardGrading(formData) {
  try {
    const response = await fetch(`${API_ENDPOINT}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting card grading:', error);
    throw error;
  }
}

/**
 * Get submission by ID
 * @param {string} submissionId - The submission ID to retrieve
 * @returns {Promise<Object>} Submission data
 */
export async function getSubmission(submissionId) {
  try {
    const response = await fetch(`${API_ENDPOINT}/submissions/${submissionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching submission:', error);
    throw error;
  }
}

/**
 * Check if API is available (for development)
 * @returns {Promise<boolean>}
 */
export async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_ENDPOINT}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.warn('API health check failed:', error);
    return false;
  }
}
