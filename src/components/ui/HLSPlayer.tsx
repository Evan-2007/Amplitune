import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

/**
 * Muted, looping background video from an HLS stream. `onError` fires when
 * the stream cannot be played so the caller can show something else.
 */
export function HLSPlayer({
  src,
  onError,
  className,
}: {
  src: string;
  onError?: () => void;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const fail = () => onErrorRef.current?.();
    // Autoplay can be refused; the poster frame is still fine as a banner
    const start = () => video.play().catch(() => {});
    video.addEventListener('error', fail);

    let hls: Hls | null = null;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      start();
    } else if (Hls.isSupported()) {
      hls = new Hls({
        maxMaxBufferLength: 30,
        maxBufferSize: 60 * 1000 * 1000, // 60MB
        maxBufferLength: 30,
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (hls && hls.levels.length > 0) {
          hls.currentLevel = hls.levels.length - 1;
        }
        start();
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal || !hls) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          fail();
        }
      });
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      fail();
    }

    return () => {
      video.removeEventListener('error', fail);
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      className={className ?? 'h-full w-full object-cover'}
    />
  );
}
