import React, { useState } from 'react';

// Optional paper-figure display. `src` is a RELATIVE path to a file in public/
// (e.g. "./images/fig1.png" — never a root-absolute image path, which 404s
// because tutorials are served from a repository sub-path) or an absolute URL.
// Figures are OPTIONAL: only render when the generator supplies `src`.
export function Figure({
  src,
  alt,
  caption,
}: {
  src?: string;
  alt?: string;
  caption?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!src) return null;
  return (
    <>
      <figure className="paper-figure">
        <button
          type="button"
          className="fm-figure-btn"
          onClick={() => setOpen(true)}
          aria-label={`放大查看论文图：${alt || caption || 'figure'}`}
        >
          <img src={src} alt={alt || ''} loading="lazy" />
        </button>
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
      {open ? (
        <div
          className="fm-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            className="fm-lightbox-close"
            onClick={() => setOpen(false)}
            aria-label="关闭放大图"
          >
            ✕
          </button>
          <img
            src={src}
            alt={alt || ''}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
