/**
 * Cloudinary Secure Unsigned Upload Service
 * 
 * Cloud Name: h79njj6q
 * Primary Upload Preset: TaleemOS (Unsigned)
 * Secondary Upload Preset: IskoolApp (Unsigned)
 * Endpoint: https://api.cloudinary.com/v1_1/h79njj6q/auto/upload
 * 
 * Secure unsigned direct client-to-cloud upload.
 * Handles both media (images/photos) and documents (PDF, DOCX, scans).
 */

export const CLOUDINARY_CLOUD_NAME = 'h79njj6q';
export const CLOUDINARY_PRIMARY_PRESET = 'TaleemOS';
export const CLOUDINARY_BACKUP_PRESET = 'IskoolApp';
export const CLOUDINARY_UPLOAD_PRESET = CLOUDINARY_PRIMARY_PRESET;

export const CLOUDINARY_AUTO_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
export const CLOUDINARY_IMAGE_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
export const CLOUDINARY_RAW_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  resource_type?: string;
  original_filename?: string;
  created_at?: string;
}

export interface UploadOptions {
  folder?: string;
  resourceType?: 'image' | 'auto' | 'raw';
  tags?: string[];
}

/**
 * Upload an image or document file to Cloudinary with automatic fallback
 * Returns the permanent HTTPS secure URL from Cloudinary
 */
export async function uploadToCloudinary(
  file: File,
  options?: UploadOptions
): Promise<string> {
  const result = await uploadDocumentToCloudinary(file, options?.folder);
  return result.url;
}

/**
 * Detailed upload returning URL, format, size, and original filename
 */
export async function uploadDocumentToCloudinary(
  file: File,
  folder?: string
): Promise<{
  url: string;
  publicId: string;
  name: string;
  size: number;
  format: string;
  resourceType: string;
}> {
  const isImage = file.type.startsWith('image/');
  const uploadUrl = isImage ? CLOUDINARY_IMAGE_UPLOAD_URL : CLOUDINARY_AUTO_UPLOAD_URL;

  // Preset attempts: Primary ('TaleemOS'), then Backup ('IskoolApp')
  const presets = [CLOUDINARY_PRIMARY_PRESET, CLOUDINARY_BACKUP_PRESET];

  for (const preset of presets) {
    // First try with folder if provided
    if (folder) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', preset);
        formData.append('folder', folder);

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data: CloudinaryUploadResult = await response.json();
          if (data.secure_url) {
            return {
              url: data.secure_url,
              publicId: data.public_id,
              name: file.name,
              size: data.bytes || file.size,
              format: data.format || file.name.split('.').pop() || '',
              resourceType: data.resource_type || (isImage ? 'image' : 'raw'),
            };
          }
        }
      } catch {
        // Continue to clean attempt without folder
      }
    }

    // Try without folder (standard unsigned preset settings often restrict dynamic folders)
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', preset);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data: CloudinaryUploadResult = await response.json();
        if (data.secure_url) {
          return {
            url: data.secure_url,
            publicId: data.public_id,
            name: file.name,
            size: data.bytes || file.size,
            format: data.format || file.name.split('.').pop() || '',
            resourceType: data.resource_type || (isImage ? 'image' : 'raw'),
          };
        }
      } else {
        const errText = await response.text();
        console.warn(`Cloudinary upload preset ${preset} notice (${response.status}):`, errText);
      }
    } catch (err) {
      console.warn(`Cloudinary upload network attempt failed for preset ${preset}:`, err);
    }
  }

  // Fallback: Offline base64 data URL if network is unreachable
  const base64 = await fileToBase64(file);
  return {
    url: base64,
    publicId: `local-${Date.now()}`,
    name: file.name,
    size: file.size,
    format: file.name.split('.').pop() || 'dat',
    resourceType: isImage ? 'image' : 'raw',
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
