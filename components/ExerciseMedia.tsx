"use client";

import { useState } from "react";
import { getMedia } from "@/lib/media";
import { isFallback } from "@/lib/types";

/**
 * Shows the start/finish stills as a tappable toggle (start ⇄ finish) to imply
 * the movement. Falls back to a "Watch demo ▶" button when no image matched.
 */
export function ExerciseMedia({ searchTerm }: { searchTerm: string }) {
  const media = getMedia(searchTerm);
  const [showFinish, setShowFinish] = useState(false);

  if (isFallback(media)) {
    return (
      <a
        href={media.fallback}
        target="_blank"
        rel="noopener noreferrer"
        className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl bg-paper text-ink-muted ring-1 ring-line"
      >
        <span className="flex flex-col items-center gap-1">
          <span className="text-3xl">▶</span>
          <span className="text-sm font-semibold">Watch demo</span>
        </span>
      </a>
    );
  }

  const hasFinish = !!media.finish;
  const src = showFinish && media.finish ? media.finish : media.start;

  return (
    <button
      type="button"
      onClick={() => hasFinish && setShowFinish((v) => !v)}
      className="relative block aspect-[4/3] w-full overflow-hidden rounded-3xl bg-paper"
      aria-label={hasFinish ? "Toggle start / finish frame" : "Exercise image"}
    >
      {/* free-exercise-db images are remote stills; plain <img> keeps the SW
          cache simple and avoids the Next image optimizer for offline use. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={media.name ?? searchTerm}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      {hasFinish && (
        <span className="absolute bottom-2 right-2 rounded-full bg-ink/75 px-3 py-1 text-xs font-semibold text-paper">
          {showFinish ? "finish ⇄" : "start ⇄"}
        </span>
      )}
    </button>
  );
}
