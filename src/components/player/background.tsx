import React, { useRef, useEffect } from 'react';

// Customizable variables
const CUSTOMIZATION = {
  MAX_OVALS: 10,
  OVAL_DURATION: 25000, // milliseconds
  MIN_OVAL_SIZE: 68,
  MAX_OVAL_SIZE: 272,
  MIN_ASPECT_RATIO: 0.5,
  MAX_ASPECT_RATIO: 1,
  BLUR_AMOUNT: 75, // pixels
  MIN_CREATION_DELAY: 2000, // milliseconds
  MAX_CREATION_DELAY: 5000, // milliseconds
  EXPAND_DURATION_RATIO: 0.125, // 1/8 of total duration
  SHRINK_DURATION_RATIO: 0.125, // 1/8 of total duration
  COLORS: [
    '#FF8C00', // Dark Orange
    '#FFA500', // Orange
    '#FF4500', // OrangeRed
    '#D2691E', // Chocolate
    '#CD853F', // Peru
    '#DEB887', // BurlyWood
    '#F4A460', // SandyBrown
    '#8B4513'  // SaddleBrown
  ] as const,
} as const;

// Types
interface Oval {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  maxSize: number;
  aspectRatio: number;
  color: string;
  rotation: number;
  startTime: number;
  duration: number;
}

type RandomPositionFunction = (max: number, extension: number) => number;
type RandomSizeFunction = () => number;
type RandomAspectRatioFunction = () => number;
type RandomColorFunction = () => string;
type CreateOvalFunction = (canvas: HTMLCanvasElement, timestamp: number) => Oval;
type EasingFunction = (t: number) => number;

// Utility functions
const getRandomPosition: RandomPositionFunction = (max, extension) => 
  Math.random() * (max + 2 * extension) - extension;

const getRandomSize: RandomSizeFunction = () => 
  Math.random() * (CUSTOMIZATION.MAX_OVAL_SIZE - CUSTOMIZATION.MIN_OVAL_SIZE) + CUSTOMIZATION.MIN_OVAL_SIZE;

const getRandomAspectRatio: RandomAspectRatioFunction = () => 
  Math.random() * (CUSTOMIZATION.MAX_ASPECT_RATIO - CUSTOMIZATION.MIN_ASPECT_RATIO) + CUSTOMIZATION.MIN_ASPECT_RATIO;

const getRandomColor: RandomColorFunction = () => 
  CUSTOMIZATION.COLORS[Math.floor(Math.random() * CUSTOMIZATION.COLORS.length)];

const createOval: CreateOvalFunction = (canvas, timestamp) => {
  const maxSize = getRandomSize();
  const extension = maxSize / 2; // Allow ovals to extend half their size beyond the edge
  return {
    startX: getRandomPosition(canvas.width, extension),
    startY: getRandomPosition(canvas.height, extension),
    endX: getRandomPosition(canvas.width, extension),
    endY: getRandomPosition(canvas.height, extension),
    maxSize,
    aspectRatio: getRandomAspectRatio(),
    color: getRandomColor(),
    rotation: Math.random() * Math.PI * 2, // Random rotation
    startTime: timestamp,
    duration: CUSTOMIZATION.OVAL_DURATION,
  };
};

const easeInOutCubic: EasingFunction = t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1;

const CanvasMultipleOvals: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blurredCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const blurredCanvas = blurredCanvasRef.current;
    if (!canvas || !blurredCanvas) return;

    const ctx = canvas.getContext('2d');
    const blurredCtx = blurredCanvas.getContext('2d');
    if (!ctx || !blurredCtx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      if (canvas && blurredCanvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        blurredCanvas.width = window.innerWidth;
        blurredCanvas.height = window.innerHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Apply blur filter to the blurred canvas
    blurredCtx.filter = `blur(${CUSTOMIZATION.BLUR_AMOUNT}px)`;

    let ovals: Oval[] = [];
    let lastOvalCreatedAt = 0;

    const animate = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create a new oval if conditions are met
      if (ovals.length < CUSTOMIZATION.MAX_OVALS && 
          timestamp - lastOvalCreatedAt > CUSTOMIZATION.MIN_CREATION_DELAY + 
          Math.random() * (CUSTOMIZATION.MAX_CREATION_DELAY - CUSTOMIZATION.MIN_CREATION_DELAY)) {
        ovals.push(createOval(canvas, timestamp));
        lastOvalCreatedAt = timestamp;
      }

      ovals = ovals.filter(oval => {
        const elapsedTime = timestamp - oval.startTime;
        const progress = Math.min(elapsedTime / oval.duration, 1);

        // Use easing function for smooth animation
        const easedProgress = easeInOutCubic(progress);

        // Calculate current position
        const currentX = oval.startX + (oval.endX - oval.startX) * easedProgress;
        const currentY = oval.startY + (oval.endY - oval.startY) * easedProgress;

        // Calculate current size
        let currentSize: number;
        if (progress < CUSTOMIZATION.EXPAND_DURATION_RATIO) {
          // Expand during the first part of the animation
          currentSize = oval.maxSize * (progress / CUSTOMIZATION.EXPAND_DURATION_RATIO);
        } else if (progress > 1 - CUSTOMIZATION.SHRINK_DURATION_RATIO) {
          // Shrink during the last part of the animation
          currentSize = oval.maxSize * ((1 - progress) / CUSTOMIZATION.SHRINK_DURATION_RATIO);
        } else {
          // Maintain full size for the middle part of the animation
          currentSize = oval.maxSize;
        }

        // Draw the oval
        ctx.save();
        ctx.translate(currentX, currentY);
        ctx.rotate(oval.rotation);
        ctx.scale(1, oval.aspectRatio);
        ctx.beginPath();
        ctx.ellipse(0, 0, currentSize / 2, currentSize / 2, 0, 0, Math.PI * 2);
        ctx.restore();
        ctx.fillStyle = oval.color;
        ctx.fill();

        // Keep the oval if the animation is not complete
        return progress < 1;
      });

      // Draw the non-blurred canvas onto the blurred canvas
      blurredCtx.clearRect(0, 0, blurredCanvas.width, blurredCanvas.height);
      blurredCtx.drawImage(canvas, 0, 0);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate(performance.now());

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        className="bg-black"
        style={{ position: 'absolute', top: 0, left: 0, display: 'none' }}
      />
      <canvas
        ref={blurredCanvasRef}
        className="bg-black"
        style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}
      />
    </div>
  );
};

export default CanvasMultipleOvals;