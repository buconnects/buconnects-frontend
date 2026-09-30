import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2, X } from 'lucide-react';
import { getMediaUrl } from '../utils/media';
import './ContentImagePicker.css';

export default function ContentImagePicker({ label, onFileChange }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    setError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.');
      event.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Images must be 10 MB or smaller.');
      event.target.value = '';
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    onFileChange(file);
  };

  const clearSelection = () => {
    setPreviewUrl('');
    setError('');
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="content-image-picker">
      <label className="content-image-picker-label">
        <span>{label}</span>
        <span className="content-image-picker-control">
          <ImagePlus size={16} />
          Choose image
        </span>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} />
      </label>
      {previewUrl && (
        <div className="content-image-preview">
          <img src={previewUrl} alt="Selected upload preview" />
          <button type="button" onClick={clearSelection} aria-label="Remove selected image" title="Remove selected image">
            <X size={16} />
          </button>
        </div>
      )}
      {error && <p className="content-image-error" role="alert">{error}</p>}
    </div>
  );
}

export function ContentMedia({ url, alt, onRemove, removing = false }) {
  if (!url) return null;

  return (
    <div className="content-media">
      <img src={getMediaUrl(url)} alt={alt} />
      {onRemove && (
        <button type="button" onClick={onRemove} disabled={removing} aria-label={`Remove image from ${alt}`} title="Remove image">
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}