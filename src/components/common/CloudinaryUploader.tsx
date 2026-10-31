import React, { useState } from 'react';
import {
  UploadCloud,
  FileCheck2,
  Loader2,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  X,
  CheckCircle,
} from 'lucide-react';
import { uploadDocumentToCloudinary } from '../../lib/cloudinary';

interface CloudinaryUploaderProps {
  value?: string;
  onUpload: (url: string, meta?: { name: string; size: number; format: string }) => void;
  accept?: string;
  label?: string;
  description?: string;
  mode?: 'image' | 'document' | 'any';
  folder?: string;
  buttonText?: string;
  previewShape?: 'circle' | 'rounded' | 'banner';
  className?: string;
}

export const CloudinaryUploader: React.FC<CloudinaryUploaderProps> = ({
  value,
  onUpload,
  accept = 'image/*',
  label,
  description = 'Direct secure upload to Cloudinary (TaleemOS)',
  mode = 'image',
  folder = 'taleemos_erp',
  buttonText,
  previewShape = 'rounded',
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await uploadDocumentToCloudinary(file, folder);
      setUploadedName(file.name);
      onUpload(res.url, {
        name: res.name,
        size: res.size,
        format: res.format,
      });
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const isPdf = value?.toLowerCase().endsWith('.pdf') || value?.includes('/raw/upload/');
  const isImage = value && !isPdf;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 border border-slate-200/90 rounded-2xl">
        {/* Preview Section */}
        {value ? (
          <div className="relative group shrink-0">
            {isImage ? (
              <img
                src={value}
                alt="Cloudinary Asset"
                className={`object-cover border-2 border-indigo-400/50 shadow-sm bg-white ${
                  previewShape === 'circle'
                    ? 'w-14 h-14 rounded-full'
                    : previewShape === 'banner'
                    ? 'w-28 h-14 rounded-xl'
                    : 'w-14 h-14 rounded-xl'
                }`}
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col items-center justify-center text-indigo-700">
                <FileText className="w-6 h-6" />
                <span className="text-[9px] font-bold font-mono">PDF</span>
              </div>
            )}
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute -top-1.5 -right-1.5 p-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 rounded-full shadow-sm transition"
              title="Open full size"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <div
            className={`w-14 h-14 rounded-xl bg-slate-200/60 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0 ${
              previewShape === 'circle' ? 'rounded-full' : ''
            }`}
          >
            {mode === 'document' ? (
              <FileText className="w-6 h-6" />
            ) : (
              <ImageIcon className="w-6 h-6" />
            )}
          </div>
        )}

        {/* Action & Info Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-xs">
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading to Cloudinary...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>
                    {buttonText ||
                      (value
                        ? 'Replace via Cloudinary'
                        : mode === 'document'
                        ? 'Upload Document'
                        : 'Upload Photo')}
                  </span>
                </>
              )}
              <input
                type="file"
                accept={accept}
                disabled={isUploading}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {value && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Cloudinary Synced
              </span>
            )}
          </div>

          <p className="text-[10px] text-slate-500 mt-1 truncate">
            {uploadedName ? (
              <span className="font-medium text-slate-700">Uploaded: {uploadedName}</span>
            ) : (
              description
            )}
          </p>

          {uploadError && (
            <p className="text-[10px] text-rose-600 font-semibold mt-1">
              {uploadError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
