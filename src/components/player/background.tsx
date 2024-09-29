import React, { useRef, useEffect, useState } from 'react';

// Customizable variables
const CUSTOMIZATION = {
  MAX_OVALS: 6,
  OVAL_DURATION: [
    40000,
    30000,
  ], // milliseconds
  MIN_OVAL_SIZE: 1500,
  MAX_OVAL_SIZE: 500,
  MIN_ASPECT_RATIO: 0.5,
  MAX_ASPECT_RATIO: 2,
  BLUR_AMOUNT: 150, // pixels
  MIN_CREATION_DELAY: 2000, // milliseconds
  MAX_CREATION_DELAY: 5000, // milliseconds
  EXPAND_DURATION_RATIO: 0.225, // 1/8 of total duration
  SHRINK_DURATION_RATIO: 0.225, // 1/8 of total duration
  COLOR_TRANSITION_DURATION: 5000, // milliseconds
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
  opacity: number;
}

interface BackgroundProps {
  colors: string[];
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


const getRandomColor = (colors: string[]): string => 
  colors[Math.floor(Math.random() * colors.length)];

const getRandomDuration = () => 
  Math.floor(Math.random() * CUSTOMIZATION.OVAL_DURATION.length)

const createOval = (canvas: HTMLCanvasElement, timestamp: number, colors: string[]): Oval => {
  const maxSize = getRandomSize();
  const extension = maxSize / 2;
  return {
    startX: getRandomPosition(canvas.width, extension),
    startY: getRandomPosition(canvas.height, extension),
    endX: getRandomPosition(canvas.width, extension),
    endY: getRandomPosition(canvas.height, extension),
    maxSize,
    aspectRatio: getRandomAspectRatio(),
    color: getRandomColor(colors),
    rotation: Math.random() * Math.PI * 2,
    startTime: timestamp,
    duration: CUSTOMIZATION.OVAL_DURATION[1],
    opacity: 1,
  };
};

const easeInOutCubic = (t: number): number => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1;

const Background: React.FC<BackgroundProps> = ({ colors }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blurredCanvasRef = useRef<HTMLCanvasElement>(null);
  const [currentColors, setCurrentColors] = useState(colors);
  const [previousColors, setPreviousColors] = useState(colors);
  const [transitionStartTime, setTransitionStartTime] = useState(0);

  useEffect(() => {
    if (JSON.stringify(colors) !== JSON.stringify(currentColors)) {
      setPreviousColors(currentColors);
      setCurrentColors(colors);
      setTransitionStartTime(performance.now());
    }
  }, [colors, currentColors]);

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
        blurredCanvas.width = window.innerWidth + 100;
        blurredCanvas.height = window.innerHeight + 100;
        blurredCtx.filter = `blur(${CUSTOMIZATION.BLUR_AMOUNT}px)`;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    blurredCtx.filter = `blur(${CUSTOMIZATION.BLUR_AMOUNT}px)`;

    let ovals: Oval[] = [];
    let lastOvalCreatedAt = 0;

    const animate = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const transitionProgress = Math.min((timestamp - transitionStartTime) / CUSTOMIZATION.COLOR_TRANSITION_DURATION, 1);

      if (ovals.length < CUSTOMIZATION.MAX_OVALS && 
          timestamp - lastOvalCreatedAt > CUSTOMIZATION.MIN_CREATION_DELAY + 
          Math.random() * (CUSTOMIZATION.MAX_CREATION_DELAY - CUSTOMIZATION.MIN_CREATION_DELAY)) {
        ovals.push(createOval(canvas, timestamp, currentColors));
        lastOvalCreatedAt = timestamp;
      }




      ovals = ovals.filter(oval => {
        const elapsedTime = timestamp - oval.startTime;
        const progress = Math.min(elapsedTime / oval.duration, 1);

        const easedProgress = easeInOutCubic(progress);

        const currentX = oval.startX + (oval.endX - oval.startX) * easedProgress;
        const currentY = oval.startY + (oval.endY - oval.startY) * easedProgress;

        let currentSize: number;
        if (progress < CUSTOMIZATION.EXPAND_DURATION_RATIO) {
          currentSize = oval.maxSize * (progress / CUSTOMIZATION.EXPAND_DURATION_RATIO);
        } else if (progress > 1 - CUSTOMIZATION.SHRINK_DURATION_RATIO) {
          currentSize = oval.maxSize * Math.max(0, (1 - progress) / CUSTOMIZATION.SHRINK_DURATION_RATIO);
        } else {
          currentSize = oval.maxSize;
        }

        currentSize = Math.max(0.1, currentSize);

        // Update opacity based on color transition
        if (transitionProgress < 1) {
          if (previousColors.includes(oval.color)) {
            oval.opacity = 1 - transitionProgress;
          } else if (currentColors.includes(oval.color)) {
            oval.opacity = transitionProgress;
          }
        }

        ctx.save();
        ctx.translate(currentX, currentY);
        ctx.rotate(oval.rotation);
        ctx.scale(1, oval.aspectRatio);
        ctx.beginPath();
        ctx.ellipse(0, 0, currentSize / 2, currentSize / 2, 0, 0, Math.PI * 2);
        ctx.restore();
        ctx.fillStyle = oval.color;
        ctx.globalAlpha = oval.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;

        return progress < 1 && oval.opacity > 0;
      });

      blurredCtx.clearRect(0, 0, blurredCanvas.width, blurredCanvas.height);
      blurredCtx.drawImage(canvas, 0, 0);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate(performance.now());

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [currentColors, previousColors, transitionStartTime]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        className="bg-transparent"
        style={{ position: 'absolute', top: 0, left: 0, display: 'none' }}
      />
      <canvas
        ref={blurredCanvasRef}
        className="bg-transparent"
        style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}
      />
    </div>
  );
};

export default Background;