// src/components/UploadImage.jsx
import { useState } from 'react';

export default function UploadImage({ onUploaded }) {
  const [loading, setLoading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      if (!cloudName || !uploadPreset) {
        alert('Cloudinary config missing. Check .env file.');
        setLoading(false);
        return;
      }
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', uploadPreset);

      const res = await fetch(url, { method: 'POST', body: form });
      const data = await res.json();
      if (data.error) {
        alert('Upload failed: ' + data.error.message);
        return;
      }
      onUploaded?.({ url: data.secure_url, publicId: data.public_id });
    } catch (e) {
      alert('Upload failed: ' + (e?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <span className="btn">Upload Photo</span>
      <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {loading && <span className="text-sm text-gray-500">Uploading…</span>}
    </label>
  );
}