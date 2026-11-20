import API_BASE from '../config';

export const PLACEHOLDER = "https://placehold.co/400x600?text=No+Poster";
export const PLACEHOLDER_THUMB = "https://placehold.co/800x450?text=No+Thumbnail";

export const getUploadUrl = (maybe) => {
  if (!maybe) return null;
  if (typeof maybe === "object") {
    maybe = maybe.url || maybe.file || maybe.preview || maybe.filename || maybe.path || maybe.image || "";
  }
  if (!maybe || typeof maybe !== "string") return null;
  if (maybe.startsWith("http://") || maybe.startsWith("https://")) return maybe;
  const cleaned = String(maybe).replace(/^uploads\//, "");
  return `/uploads/${cleaned}`;
};

export const handleImageError = (e, fallbackFilename = null, placeholder = PLACEHOLDER) => {
  const target = e.currentTarget;
  if (!target.dataset.triedBackend && fallbackFilename) {
    target.dataset.triedBackend = "true";
    const cleaned = String(fallbackFilename).replace(/^uploads\//, "");
    target.src = `${API_BASE}/uploads/${cleaned}`;
  } else {
    target.src = placeholder;
  }
};
