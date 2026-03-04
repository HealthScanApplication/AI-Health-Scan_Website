import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Video as VideoIcon, FileImage } from 'lucide-react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface MediaUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  mediaType: 'icon' | 'image' | 'video';
  accept?: string;
  placeholder?: string;
  onUpload?: (file: File) => Promise<string>;
}

export function MediaUploadField({
  value,
  onChange,
  label,
  mediaType,
  accept = 'image/*',
  placeholder,
  onUpload,
}: MediaUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!onUpload) {
      console.warn('No upload handler provided');
      return;
    }

    setIsUploading(true);
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    onChange('');
  };

  const getIcon = () => {
    switch (mediaType) {
      case 'icon':
        return <FileImage className="w-5 h-5" />;
      case 'video':
        return <VideoIcon className="w-5 h-5" />;
      default:
        return <ImageIcon className="w-5 h-5" />;
    }
  };

  const getDisplayStyle = () => {
    switch (mediaType) {
      case 'icon':
        return 'flex items-center justify-center bg-gray-50'; // Centered
      case 'video':
        return 'w-full h-full object-cover'; // Full bleed
      default:
        return 'w-full h-full object-cover'; // Full bleed
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </Label>

      {/* Preview or Upload Area */}
      {value ? (
        <div className="relative group">
          <div className={`border border-gray-200 rounded-lg overflow-hidden ${
            mediaType === 'icon' ? 'h-32' : 'h-48'
          }`}>
            {mediaType === 'video' ? (
              <video
                src={value}
                controls
                className={getDisplayStyle()}
              />
            ) : (
              <div className={getDisplayStyle()}>
                <img
                  src={value}
                  alt={label}
                  className={mediaType === 'icon' ? 'max-h-24 max-w-24 object-contain' : 'w-full h-full object-cover'}
                />
              </div>
            )}
          </div>
          
          {/* Clear button */}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleClear}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* URL input */}
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or paste URL..."
            className="mt-2 text-xs"
          />
        </div>
      ) : (
        <div>
          {/* Drag and drop area */}
          <div
            className={`border-2 border-dashed rounded-lg transition-colors ${
              isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
            } ${mediaType === 'icon' ? 'h-32' : 'h-48'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              className="hidden"
              aria-label={`Upload ${mediaType}`}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isUploading ? (
                <div className="text-sm">Uploading...</div>
              ) : (
                <>
                  {getIcon()}
                  <span className="text-sm font-medium">
                    {placeholder || `Drop or click to upload ${mediaType}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {accept.split(',').map(a => a.split('/')[1]).join(', ')}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* URL input */}
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or paste URL..."
            className="mt-2 text-xs"
          />
        </div>
      )}
    </div>
  );
}
