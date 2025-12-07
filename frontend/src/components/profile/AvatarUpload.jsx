import { useState, useRef, useEffect } from 'react';
import { Upload, X, User as UserIcon } from 'lucide-react';
import Button from '../common/Button';

export default function AvatarUpload({ currentAvatar, onUpload, onRemove, loading }) {
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef(null);

  // Reset image error when currentAvatar changes
  useEffect(() => {
    setImageError(false);
  }, [currentAvatar]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (selectedFile && onUpload) {
      onUpload(selectedFile);
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
    setPreview(null);
    setSelectedFile(null);
    setImageError(false);
  };

  const displayAvatar = preview || currentAvatar;
  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const handleImageError = () => {
    setImageError(true);
  };

  const getImageSrc = () => {
    if (!displayAvatar) return null;
    if (displayAvatar.startsWith('data:')) return displayAvatar;
    // Ensure the URL is properly formatted
    const cleanPath = displayAvatar.startsWith('/') ? displayAvatar.substring(1) : displayAvatar;
    return `${API_URL}/${cleanPath}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
          {displayAvatar && !imageError ? (
            <img
              src={getImageSrc()}
              alt="Avatar"
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <UserIcon size={48} className="text-gray-400" />
          )}
        </div>
        
        {/* Remove button (only show if has avatar and not previewing) */}
        {currentAvatar && !preview && (
          <button
            onClick={handleRemove}
            className="absolute top-0 right-0 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg transition-colors"
            title="Remove avatar"
            disabled={loading}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Upload Controls */}
      <div className="flex flex-col items-center space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="avatar-upload"
        />
        
        {!selectedFile ? (
          <label htmlFor="avatar-upload">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <Upload size={16} />
              <span>Choose Photo</span>
            </Button>
          </label>
        ) : (
          <div className="flex space-x-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpload}
              loading={loading}
              disabled={loading}
            >
              Upload
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        )}
        
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          JPG, PNG or GIF. Max 5MB
        </p>
      </div>
    </div>
  );
}
