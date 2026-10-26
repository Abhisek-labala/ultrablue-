/**
 * UltraBlue+ Image Compressor & WebP Converter
 * Compresses large images and converts them to high-efficiency WebP format in the browser.
 *
 * @param {File} file - The uploaded image File object
 * @param {Object} options - Optional compression configuration
 * @returns {Promise<File>} Compressed WebP File object
 */
export async function compressImageToWebP(file, options = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    thresholdBytes = 350 * 1024 // 350 KB threshold
  } = options;

  // Don't re-encode vector SVGs
  if (file.type === 'image/svg+xml') {
    return file;
  }

  // If already WebP and smaller than threshold, return original
  if (file.type === 'image/webp' && file.size <= thresholdBytes) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale down proportionally if larger than maximum bounds
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP format
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // Fallback to original if conversion fails
              return;
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
            const compressedFile = new File([blob], cleanName, {
              type: 'image/webp',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
