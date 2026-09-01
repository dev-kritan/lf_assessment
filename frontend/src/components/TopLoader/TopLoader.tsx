import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export interface TopLoaderProps {
  /**
   * Custom height of the progress bar in pixels. Default is 3.
   */
  height?: number;
  /**
   * Custom CSS gradient or color string. Default is the app's signature indigo-purple-pink gradient.
   */
  color?: string;
  /**
   * Animation speed for progress steps in milliseconds. Default is 250.
   */
  crawlSpeed?: number;
  /**
   * Initial progress percentage upon starting. Default is 20.
   */
  initialProgress?: number;
  /**
   * Easing function for smooth animation. Default is cubic-bezier(0.2, 0.8, 0.2, 1).
   */
  easing?: string;
  /**
   * Whether to show a subtle spinning glowing indicator at the top right. Default is true.
   */
  showSpinner?: boolean;
  /**
   * Z-index for the top loader overlay. Default is 9999.
   */
  zIndex?: number;
  /**
   * Optional shadow color or glow.
   */
  showShadow?: boolean;
}

// Global event bus helpers for programmatic control
export const topLoader = {
  start: () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toploader:start'));
    }
  },
  done: () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toploader:done'));
    }
  },
  set: (progress: number) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toploader:set', { detail: { progress } }));
    }
  },
};

export const useTopLoader = () => {
  return topLoader;
};

export const TopLoader: React.FC<TopLoaderProps> = ({
  height = 3,
  color = 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 35%, #a855f7 65%, #ec4899 100%)',
  crawlSpeed = 250,
  initialProgress = 20,
  easing = 'cubic-bezier(0.25, 0.8, 0.25, 1)',
  showSpinner = true,
  zIndex = 9999,
  showShadow = true,
}) => {
  const location = useLocation();
  const [progress, setProgress] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  const crawlTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  const clearTimers = useCallback(() => {
    if (crawlTimerRef.current) {
      clearInterval(crawlTimerRef.current);
      crawlTimerRef.current = null;
    }
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const startLoading = useCallback(() => {
    clearTimers();
    setIsFinishing(false);
    setIsVisible(true);
    setProgress(initialProgress);

    // Continuous smooth trickling
    crawlTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) {
          // Slow down asymptotically near 90%
          return Math.min(prev + Math.random() * 0.5, 93);
        }
        if (prev >= 60) {
          return prev + Math.random() * 2 + 0.8;
        }
        if (prev >= 30) {
          return prev + Math.random() * 4 + 1.5;
        }
        return prev + Math.random() * 8 + 3;
      });
    }, crawlSpeed);
  }, [clearTimers, initialProgress, crawlSpeed]);

  const finishLoading = useCallback(() => {
    if (crawlTimerRef.current) {
      clearInterval(crawlTimerRef.current);
      crawlTimerRef.current = null;
    }

    setProgress(100);
    setIsFinishing(true);

    // Give time for width transition to hit 100% smoothly before fading out
    finishTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      hideTimerRef.current = setTimeout(() => {
        setProgress(0);
        setIsFinishing(false);
      }, 300);
    }, 250);
  }, []);

  const setExplicitProgress = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    clearTimers();
    setIsVisible(true);
    setProgress(clamped);
    if (clamped >= 100) {
      finishLoading();
    }
  }, [clearTimers, finishLoading]);

  // Route change listener
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    startLoading();
    // Simulate natural route transition completion
    const completeTimer = setTimeout(() => {
      finishLoading();
    }, 320);

    return () => {
      clearTimeout(completeTimer);
    };
  }, [location.pathname, location.search, location.hash, startLoading, finishLoading]);

  // Programmatic event listeners
  useEffect(() => {
    const handleStart = () => startLoading();
    const handleDone = () => finishLoading();
    const handleSet = (e: CustomEvent<{ progress: number }>) => {
      if (e.detail && typeof e.detail.progress === 'number') {
        setExplicitProgress(e.detail.progress);
      }
    };

    window.addEventListener('toploader:start', handleStart);
    window.addEventListener('toploader:done', handleDone);
    window.addEventListener('toploader:set', handleSet as EventListener);

    return () => {
      window.removeEventListener('toploader:start', handleStart);
      window.removeEventListener('toploader:done', handleDone);
      window.removeEventListener('toploader:set', handleSet as EventListener);
      clearTimers();
    };
  }, [startLoading, finishLoading, setExplicitProgress, clearTimers]);

  if (!isVisible && progress === 0) {
    return null;
  }

  return (
    <div
      data-testid="toploader"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-hidden={!isVisible}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex,
        pointerEvents: 'none',
        opacity: isVisible ? 1 : 0,
        transition: `opacity ${isFinishing ? '350ms ease-out' : '150ms ease-in'}`,
      }}
    >
      {/* Progress Bar with Gradient */}
      <div
        data-testid="toploader-bar"
        style={{
          width: `${progress}%`,
          height: `${height}px`,
          background: color,
          borderRadius: '0 9999px 9999px 0',
          transition: `width ${crawlSpeed}ms ${easing}`,
          position: 'relative',
          boxShadow: showShadow
            ? '0 0 12px rgba(236, 72, 153, 0.7), 0 0 6px rgba(168, 85, 247, 0.6), 0 0 2px rgba(99, 102, 241, 0.8)'
            : 'none',
        }}
      >
        {/* Trailing Head Glow / Peg */}
        <div
          data-testid="toploader-glow"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 80,
            height: '100%',
            boxShadow: '0 0 14px #ec4899, 0 0 8px #a855f7, 0 0 4px #6366f1',
            opacity: 1,
            transform: 'rotate(3deg) translate(0px, -4px)',
          }}
        />
      </div>

      {/* Matching Gradient Pulse Spinner at Top Right */}
      {showSpinner && (
        <div
          data-testid="toploader-spinner"
          style={{
            position: 'fixed',
            top: 14,
            right: 14,
            zIndex,
            display: 'block',
            pointerEvents: 'none',
            opacity: isFinishing ? 0 : 1,
            transition: 'opacity 200ms linear',
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              boxSizing: 'border-box',
              border: '2px solid transparent',
              borderTopColor: '#ec4899',
              borderRightColor: '#a855f7',
              borderLeftColor: '#6366f1',
              borderRadius: '50%',
              animation: 'toploader-spin 450ms linear infinite',
              filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.6))',
            }}
          />
        </div>
      )}

      {/* Spinner animation keyframe style injected dynamically */}
      <style>{`
        @keyframes toploader-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TopLoader;
