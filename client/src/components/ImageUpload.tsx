import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = 'Product Image',
  helperText = 'Upload a photo from your computer or paste an image URL.',
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mode, setMode] = useState<'file' | 'url'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp|svg\+xml)$/)) {
      setUploadError('Only image files (JPG, PNG, WEBP) are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        onChange(res.data.url);
      } else {
        setUploadError(res.data.message || 'Image upload failed.');
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Server upload failed. You can also paste an image URL.');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-stone-700 font-semibold text-xs">{label}</label>
        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
              mode === 'file'
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Upload File
          </button>
          <span className="text-stone-300">|</span>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
              mode === 'url'
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Image Link URL
          </button>
        </div>
      </div>

      {/* Preview Box */}
      {value ? (
        <div className="relative rounded-2xl overflow-hidden border border-emerald-200 bg-stone-50 h-36 flex items-center justify-center group">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80';
            }}
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 rounded-xl bg-stone-900/70 hover:bg-rose-600 text-white transition-colors shadow-md"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-stone-900/75 text-white text-[10px] font-mono truncate max-w-[280px]">
            {value}
          </div>
        </div>
      ) : mode === 'file' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileSelect}
            className="hidden"
            id="product-image-file-input"
          />
          <label
            htmlFor="product-image-file-input"
            className="border-2 border-dashed border-stone-200 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-stone-50 hover:bg-emerald-50/40 transition-colors"
          >
            {uploading ? (
              <div className="flex items-center gap-2 text-emerald-700 py-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs font-semibold">Uploading image...</span>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-stone-800">
                  Click to select photo from device
                </div>
                <div className="text-[10px] text-stone-400">PNG, JPG, WEBP up to 5MB</div>
              </>
            )}
          </label>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <ImageIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl bg-stone-50 text-xs focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>
      )}

      {uploadError && (
        <div className="text-[11px] text-rose-600 font-medium">{uploadError}</div>
      )}

      <p className="text-[10px] text-stone-400">{helperText}</p>
    </div>
  );
};

