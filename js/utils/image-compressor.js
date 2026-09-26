// js/utils/image-compressor.js
// Aadesh Tours Udaipur - Zero-Cost Client-Side Image Compressor (Phase 7)

/**
 * Default compression configuration
 * Target size: 40KB - 80KB (Ideal for direct Firestore document embedding)
 */
const DEFAULT_OPTIONS = {
  maxWidth: 1024,        // Max width in pixels (Odometer numbers & RC stay crystal clear)
  maxHeight: 1024,       // Max height in pixels
  quality: 0.65,         // 65% JPEG quality (Perfect balance of sharpness & tiny size)
  mimeType: 'image/jpeg'
};

/**
 * 1. Compress Image File (From <input type="file"> or Camera)
 * @param {File|Blob} file - Raw image file from camera or gallery
 * @param {Object} customOptions - Overrides for width, height, quality
 * @returns {Promise<string>} - Resolves with compressed Base64 Data URL
 */
export function compressImage(file, customOptions = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file.'));
    }

    const options = { ...DEFAULT_OPTIONS, ...customOptions };
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        // Calculate proportional scale
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > options.maxWidth) {
            height = Math.round((height * options.maxWidth) / width);
            width = options.maxWidth;
          }
        } else {
          if (height > options.maxHeight) {
            width = Math.round((width * options.maxHeight) / height);
            height = options.maxHeight;
          }
        }

        // Draw onto HTML5 in-memory canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Smooth scaling filter
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compact Base64 JPEG string
        const compressedBase64 = canvas.toDataURL(options.mimeType, options.quality);
        resolve(compressedBase64);
      };

      img.onerror = (err) => reject(new Error('Failed to process image: ' + err.message));
    };

    reader.onerror = (err) => reject(new Error('Failed to read file: ' + err.message));
  });
}

/**
 * 2. Calculate Approximate Size of Base64 Image in Kilobytes (KB)
 * @param {string} base64String 
 * @returns {number} Size in KB
 */
export function getImageSizeInKb(base64String = '') {
  if (!base64String) return 0;
  const padding = (base64String.endsWith('==')) ? 2 : (base64String.endsWith('=')) ? 1 : 0;
  const base64Length = base64String.length - (base64String.indexOf(',') + 1);
  const sizeInBytes = (base64Length * (3 / 4)) - padding;
  return Math.round(sizeInBytes / 1024);
}

/**
 * 3. Quick Image Preview Utility for Forms (Odometer, RC, DL)
 * @param {string} base64String - Compressed image string
 * @param {string} previewElementId - ID of <img> element to display preview
 */
export function setPreviewImage(base64String, previewElementId) {
  const imgElement = document.getElementById(previewElementId);
  if (imgElement && base64String) {
    imgElement.src = base64String;
    imgElement.style.display = 'block';
  }
}
