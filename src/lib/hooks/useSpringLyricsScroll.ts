import { useRef, useEffect, useCallback } from 'react';

interface SpringState {
  value: number;
  velocity: number;
  target: number;
  initialized: boolean;
}

interface LineSpring {
  y: number;
  vy: number;
  targetY: number;
  delay: number;
}

function springStep(
  current: number,
  target: number,
  velocity: number,
  tension: number,
  friction: number,
  dt: number
) {
  const force = (target - current) * tension;
  const damping = -velocity * friction;
  const accel = force + damping;
  const newVel = velocity + accel * dt;
  const newVal = current + newVel * dt;
  return { value: newVal, velocity: newVel };
}

interface UseSpringLyricScrollOptions {
  /** How far from the top the active line sits (0-1). Default 0.35 */
  anchorPosition?: number;
  /** Number of lines below active that get stagger. Default 4 */
  staggerRange?: number;
  /** Delay per stagger step in seconds. Default 0.055 */
  staggerStep?: number;
  /** Scroll spring tension. Default 100 */
  scrollTension?: number;
  /** Scroll spring friction. Default 16 */
  scrollFriction?: number;
  /** Line spring tension. Default 80 */
  lineTension?: number;
  /** Line spring friction. Default 12 */
  lineFriction?: number;
}

export function useSpringLyricScroll(
  containerRef: React.RefObject<HTMLElement | null>,
  lineCount: number,
  options: UseSpringLyricScrollOptions = {}
) {
  const {
    anchorPosition = 0.35,
    staggerRange = 4,
    staggerStep = 0.055,
    scrollTension = 100,
    scrollFriction = 16,
    lineTension = 80,
    lineFriction = 12,
  } = options;

  const lineRefs = useRef<(HTMLElement | null)[]>([]);
  const springsRef = useRef<LineSpring[]>([]);
  const scrollSpring = useRef<SpringState>({ value: 0, velocity: 0, target: 0, initialized: false });
  const lastPhysicsTime = useRef<number | null>(null);
  const prevLineRef = useRef<number>(-1);
  const pausedRef = useRef<boolean>(false);

  // Grow/shrink springs array without wiping existing refs
  useEffect(() => {
    const currentLen = springsRef.current.length;
    if (lineCount > currentLen) {
      for (let i = currentLen; i < lineCount; i++) {
        springsRef.current.push({ y: 0, vy: 0, targetY: 0, delay: 0 });
      }
    } else if (lineCount < currentLen) {
      springsRef.current.length = lineCount;
    }
    // Only grow lineRefs, never wipe — React assigns refs during render
    if (lineCount > lineRefs.current.length) {
      for (let i = lineRefs.current.length; i < lineCount; i++) {
        lineRefs.current.push(null);
      }
    }
  }, [lineCount]);

  // Physics loop
  useEffect(() => {
    let frame: number;

    const loop = (ts: number) => {
      if (!lastPhysicsTime.current) lastPhysicsTime.current = ts;
      const dt = Math.min((ts - lastPhysicsTime.current) / 1000, 0.04);
      lastPhysicsTime.current = ts;

      // When paused, let user scroll freely but keep line springs settling
      if (pausedRef.current) {
        const springs = springsRef.current;
        for (let i = 0; i < springs.length; i++) {
          const s = springs[i];
          if (s.delay > 0) {
            s.delay = Math.max(0, s.delay - dt);
            continue;
          }
          const r = springStep(s.y, s.targetY, s.vy, lineTension, lineFriction, dt);
          s.y = r.value;
          s.vy = r.velocity;
        }
        for (let i = 0; i < springs.length; i++) {
          const el = lineRefs.current[i];
          if (el) el.style.transform = `translateY(${springs[i].y}px)`;
        }
        frame = requestAnimationFrame(loop);
        return;
      }

      const ss = scrollSpring.current;

      // Don't drive scroll until we've been initialized with a real position
      if (!ss.initialized) {
        frame = requestAnimationFrame(loop);
        return;
      }

      const prevScroll = ss.value;
      const sr = springStep(ss.value, ss.target, ss.velocity, scrollTension, scrollFriction, dt);
      ss.value = sr.value;
      ss.velocity = sr.velocity;
      const scrollDelta = ss.value - prevScroll;

      if (containerRef.current) {
        containerRef.current.scrollTop = ss.value;
      }

      const springs = springsRef.current;
      for (let i = 0; i < springs.length; i++) {
        const s = springs[i];
        if (s.delay > 0) {
          s.delay = Math.max(0, s.delay - dt);
          s.y += scrollDelta;
          continue;
        }
        const r = springStep(s.y, s.targetY, s.vy, lineTension, lineFriction, dt);
        s.y = r.value;
        s.vy = r.velocity;
      }

      for (let i = 0; i < springs.length; i++) {
        const el = lineRefs.current[i];
        if (el) el.style.transform = `translateY(${springs[i].y}px)`;
      }

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [containerRef, scrollTension, scrollFriction, lineTension, lineFriction]);

  const scrollToLine = useCallback(
    (index: number) => {
      if (index < 0 || !containerRef.current) return;
      if (index === prevLineRef.current) return;
      prevLineRef.current = index;

      const el = lineRefs.current[index];
      if (!el) return;

      const ss = scrollSpring.current;

      // On first call, sync spring to current scroll position so we don't jump from 0
      if (!ss.initialized) {
        ss.value = containerRef.current.scrollTop;
        ss.velocity = 0;
        ss.initialized = true;
      }

      const containerH = containerRef.current.clientHeight;
      const targetScroll = el.offsetTop - containerH * anchorPosition;
      ss.target = Math.max(0, targetScroll);

      const springs = springsRef.current;
      for (let i = 0; i < springs.length; i++) {
        const diff = i - index;
        const absDiff = Math.abs(diff);
        if (diff <= 0 || absDiff > staggerRange) continue;
        springs[i].targetY = 0;
        springs[i].delay = absDiff * staggerStep;
      }
    },
    [containerRef, anchorPosition, staggerRange, staggerStep]
  );

  const setLineRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      lineRefs.current[index] = el;
    },
    []
  );

  const reset = useCallback(() => {
    prevLineRef.current = -1;
    scrollSpring.current = { value: 0, velocity: 0, target: 0, initialized: false };
    springsRef.current = springsRef.current.map(() => ({
      y: 0, vy: 0, targetY: 0, delay: 0,
    }));
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [containerRef]);

  const pause = useCallback(() => {
    pausedRef.current = true;
  }, []);

  const resume = useCallback(() => {
    if (containerRef.current) {
      const currentScroll = containerRef.current.scrollTop;
      scrollSpring.current.value = currentScroll;
      scrollSpring.current.target = currentScroll;
      scrollSpring.current.velocity = 0;
    }
    prevLineRef.current = -1;
    pausedRef.current = false;
  }, [containerRef]);

  return { scrollToLine, setLineRef, reset, pause, resume };
}