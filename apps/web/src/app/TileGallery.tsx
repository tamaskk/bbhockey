"use client";

import { useEffect, useRef, useState } from "react";

type Pic = { src: string; alt: string };

// A card's extra photos: two thumbnails in its bottom-right corner, a click opens all of them in a lightbox.
export default function TileGallery({ pics, title }: { pics: Pic[]; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [at, setAt] = useState<number | null>(null);
  const n = pics.length;
  const go = (step: number) => setAt((i) => (i === null ? i : (i + step + n) % n));

  useEffect(() => {
    if (at !== null && !dialog.current?.open) dialog.current?.showModal();
  }, [at]);

  if (!n) return null;
  return (
    <>
      <div className="bb-tile-gallery">
        {pics.slice(0, 2).map((p, i) => (
          <button type="button" key={i} onClick={() => setAt(i)} aria-label={`${title}: galéria megnyitása (${n} kép)`}>
            <img src={p.src} alt={p.alt} loading="lazy" />
            {i === 1 && n > 2 && <span aria-hidden="true">+{n - 2}</span>}
          </button>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="bb-lightbox"
        aria-label={`${title} galéria`}
        onClose={() => setAt(null)}
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
      >
        {at !== null && (
          <>
            <img src={pics[at].src} alt={pics[at].alt} />
            <button type="button" className="bb-lb-close" onClick={() => dialog.current?.close()} aria-label="Bezárás">×</button>
            {n > 1 && (
              <>
                <button type="button" className="bb-lb-prev" onClick={() => go(-1)} aria-label="Előző kép">‹</button>
                <button type="button" className="bb-lb-next" onClick={() => go(1)} aria-label="Következő kép">›</button>
              </>
            )}
            <span className="bb-lb-count">{at + 1} / {n}</span>
          </>
        )}
      </dialog>
    </>
  );
}
