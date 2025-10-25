/**
 * Convert a Blob/File to base64 string
 * @param {Blob} blob - The image blob to convert
 * @returns {Promise<string>} Base64 encoded string (without data URI prefix)
 */
export async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove the data URI prefix (e.g., "data:image/jpeg;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert image URL to Blob
 * @param {string} imageUrl - The object URL of the image
 * @returns {Promise<Blob>} Image as Blob
 */
export async function urlToBlob(imageUrl) {
  const response = await fetch(imageUrl);
  return response.blob();
}

/**
 * Convert image URL to base64
 * @param {string} imageUrl - The object URL of the image
 * @returns {Promise<string>} Base64 encoded string
 */
export async function urlToBase64(imageUrl) {
  const blob = await urlToBlob(imageUrl);
  return blobToBase64(blob);
}
