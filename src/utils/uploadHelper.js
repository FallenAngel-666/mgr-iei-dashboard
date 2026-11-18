import { storage, ref, uploadBytes, getDownloadURL } from '../config/firebase.js';
import { isHostingerBackend, hostingerUploadFile } from '../services/hostingerApi.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validate uploaded file type and size before processing.
 */
export function validateUploadFile(file, { imagesOnly = true } = {}) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }
  const allowed = imagesOnly ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES;
  if (!allowed.includes(file.type)) {
    return {
      valid: false,
      error: imagesOnly
        ? 'Unsupported image format. Please upload JPG, PNG, WebP, or GIF.'
        : 'Unsupported file format. Please upload an image, PDF, or Word document.'
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'File exceeds the 10 MB maximum upload limit. Please select a smaller file.'
    };
  }
  return { valid: true, error: null };
}

/**
 * Compress and resize an image in-browser for fast mobile loading and safe storage.
 */
export function compressImageFile(file, { maxDimension = 1400, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Invalid or corrupted image file.'));
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(outputType, quality);

          canvas.toBlob(
            (blob) => {
              resolve({ blob: blob || file, dataUrl, contentType: outputType });
            },
            outputType,
            quality
          );
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Securely optimize and upload an image.
 * - In 100% Hostinger mode: uploads directly to Hostinger /api/upload.php (Hostinger disk + MySQL iei_uploads table).
 * - In Firebase mode: uploads to Firebase Storage with safe compressed inline fallback.
 */
export async function uploadInstitutionalImage(file, folder = 'general') {
  const check = validateUploadFile(file, { imagesOnly: true });
  if (!check.valid) {
    throw new Error(check.error);
  }

  const { blob, dataUrl, contentType } = await compressImageFile(file);
  const safeName = (file.name || 'image.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');

  // 100% Hostinger Storage Mode (Hostinger NVMe disk + Hostinger MySQL metadata)
  if (isHostingerBackend()) {
    const res = await hostingerUploadFile(blob, safeName, folder);
    return {
      url: res.url,
      storagePath: res.storagePath,
      uploadId: res.id,
      mode: 'hostinger-storage'
    };
  }

  // Firebase mode fallback
  if (storage) {
    try {
      const path = `iei_uploads/${folder}/${Date.now()}_${safeName}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob, { contentType });
      const downloadUrl = await getDownloadURL(storageRef);
      return { url: downloadUrl, storagePath: path, mode: 'firebase-storage' };
    } catch (err) {
      console.warn('Firebase Storage upload unavailable, using optimized compressed fallback:', err.message);
    }
  }

  // Ensure fallback compressed Data URL is safe (< 750 KB)
  if (dataUrl.length > 750000) {
    const smaller = await compressImageFile(file, { maxDimension: 900, quality: 0.7 });
    return { url: smaller.dataUrl, storagePath: null, mode: 'compressed-inline' };
  }

  return { url: dataUrl, storagePath: null, mode: 'compressed-inline' };
}
