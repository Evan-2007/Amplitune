import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export function HLSPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!videoRef.current || !src) return;

    const video = videoRef.current;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        startLevel: -1,
        maxMaxBufferLength: 30,
        maxBufferSize: 60 * 1000 * 1000, // 60MB
        maxBufferLength: 30,
      });

      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);


      hls.on(Hls.Events.MANIFEST_PARSED, () => {

        if (hls.levels.length > 0) {
          const highestLevel = hls.levels.length - 1;
          hls.currentLevel = highestLevel;
        }
      });


      const handleTimeUpdate = () => {
        const currentTime = video.currentTime;
        const duration = video.duration;
        

        if (duration - currentTime < 0.1 && currentTime > 0) {

          const currentLevel = hls.currentLevel;
          
          hls.loadSource(src);
          

          hls.on(Hls.Events.MANIFEST_PARSED, function restoreQuality() {
            if (currentLevel >= 0 && currentLevel < hls.levels.length) {
              hls.currentLevel = currentLevel;
            }

            hls.off(Hls.Events.MANIFEST_PARSED, restoreQuality);
          });
        }
      };

      video.addEventListener('timeupdate', handleTimeUpdate);


      const handleEnded = () => {
        const currentLevel = hls.currentLevel;
        hls.loadSource(src);
        
        hls.on(Hls.Events.MANIFEST_PARSED, function restoreQualityOnEnd() {
          if (currentLevel >= 0 && currentLevel < hls.levels.length) {
            hls.currentLevel = currentLevel;
          }
          hls.off(Hls.Events.MANIFEST_PARSED, restoreQualityOnEnd);
        });
      };

      video.addEventListener('ended', handleEnded);


      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleEnded);
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }
  }, [src]);


  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      video.style.width = '100%';
      video.style.height = '100%';
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  return (
    <div className='w-full h-full relative'>
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        loop 
        className="h-full w-full object-contain inset-0"
        playsInline
      />
    </div>
  );
}