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

/**
 * Compress and resize an image to reduce file size
 * Resizes to max 1920px width/height while maintaining aspect ratio
 * Compresses with 85% JPEG quality
 *
 * @param {Blob|File} imageBlob - The original image blob/file
 * @returns {Promise<{blob: Blob, dataUrl: string}>} Compressed image as blob and data URL
 */
export async function compressImage(imageBlob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(imageBlob);

    img.onload = () => {
      // Calculate new dimensions (max 1920px on longest side)
      const MAX_SIZE = 1920;
      let width = img.width;
      let height = img.height;

      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to compressed blob (JPEG, 85% quality)
      canvas.toBlob(
        (compressedBlob) => {
          URL.revokeObjectURL(objectUrl);

          if (!compressedBlob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // Also create data URL for display
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

          console.log(`Image compressed: ${(imageBlob.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`)

          resolve({
            blob: compressedBlob,
            dataUrl: dataUrl
          });
        },
        'image/jpeg',
        0.85 // 85% quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });
}
