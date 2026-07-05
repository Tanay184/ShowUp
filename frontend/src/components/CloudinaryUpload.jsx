import { useRef, useState } from "react";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export default function CloudinaryUpload({ onUpload, label = "Upload Image", currentUrl = null }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setPreview(data.secure_url);
      onUpload(data.secure_url);
    } catch (err) {
      setError("Upload failed. Check your Cloudinary config.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* Preview */}
      {preview && (
        <div className="relative mb-3 border-2 border-ink aspect-video overflow-hidden bg-surface-container">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => { setPreview(null); onUpload(null); }}
            className="absolute top-2 right-2 bg-error text-white border border-ink p-1"
            title="Remove"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Upload zone */}
      {!preview && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`w-full border-2 border-dashed border-ink p-8 flex flex-col items-center gap-2 bg-surface-container hover:bg-surface-container-high transition-colors ${uploading ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
        >
          {uploading ? (
            <>
              <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
              <span className="font-mono text-sm text-on-surface-variant uppercase">Uploading...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-3xl text-outline">cloud_upload</span>
              <span className="font-mono text-sm font-bold uppercase text-on-surface">{label}</span>
              <span className="font-mono text-xs text-on-surface-variant">PNG, JPG, GIF up to 10MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="mt-2 font-mono text-xs text-error">{error}</p>
      )}
    </div>
  );
}
