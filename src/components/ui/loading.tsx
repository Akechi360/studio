import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  message?: string;
  variant?: 'circles' | 'spinner' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  message,
  variant = 'circles',
  size = 'md',
  className
}) => {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const circlesRef = useRef<HTMLDivElement[]>([]);
  const CIRCLE_COUNT = 5;
  const ANIMATION_DURATION = 1200;
  const CIRCLE_SIZE = {
    sm: 12,
    md: 18,
    lg: 24
  }[size];

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setOrientation(window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape');
    const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const orientationQuery = window.matchMedia('(orientation: portrait)');
    const handleTheme = () => setTheme(themeQuery.matches ? 'dark' : 'light');
    const handleOrientation = () => setOrientation(orientationQuery.matches ? 'portrait' : 'landscape');
    themeQuery.addEventListener('change', handleTheme);
    orientationQuery.addEventListener('change', handleOrientation);
    return () => {
      themeQuery.removeEventListener('change', handleTheme);
      orientationQuery.removeEventListener('change', handleOrientation);
    };
  }, []);

  useEffect(() => {
    if (!mounted || variant !== 'circles') return;
    let raf: number;
    const start = performance.now();
    function animate(now: number) {
      const elapsed = (now - start) % ANIMATION_DURATION;
      for (let i = 0; i < CIRCLE_COUNT; i++) {
        const progress = ((elapsed + (i * ANIMATION_DURATION) / CIRCLE_COUNT) % ANIMATION_DURATION) / ANIMATION_DURATION;
        const offset = Math.sin(progress * 2 * Math.PI) * 50;
        const circle = circlesRef.current[i];
        if (circle) {
          if (orientation === 'portrait') {
            circle.style.transform = `translateY(${offset}px)`;
          } else {
            circle.style.transform = `translateX(${offset}px)`;
          }
        }
      }
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [orientation, mounted, variant]);

  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: '#f7fbfb' }} />;
  }

  const bgColor = theme === 'dark' ? '#162425' : '#f7fbfb';
  const circleColor = '#3ec6c6';
  const textColor = theme === 'dark' ? '#fff' : '#162425';

  const renderLoader = () => {
    switch (variant) {
      case 'circles':
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: orientation === 'portrait' ? 'row' : 'column',
              gap: CIRCLE_SIZE / 1.5,
              marginBottom: message ? 32 : 0,
            }}
          >
            {Array.from({ length: CIRCLE_COUNT }).map((_, i) => (
              <div
                key={i}
                ref={el => { circlesRef.current[i] = el!; }}
                style={{
                  width: CIRCLE_SIZE,
                  height: CIRCLE_SIZE,
                  borderRadius: '50%',
                  background: circleColor,
                  opacity: 0.85,
                  willChange: 'transform',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>
        );
      case 'spinner':
        return (
          <div className="relative" style={{ width: CIRCLE_SIZE * 2, height: CIRCLE_SIZE * 2 }}>
            <div
              className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: circleColor }}
            />
          </div>
        );
      case 'dots':
        return (
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-bounce"
                style={{
                  width: CIRCLE_SIZE / 2,
                  height: CIRCLE_SIZE / 2,
                  borderRadius: '50%',
                  background: circleColor,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        className
      )}
      style={{
        background: bgColor,
        transition: 'background 0.3s',
      }}
    >
      {renderLoader()}
      {message && (
        <div
          style={{
            color: textColor,
            fontSize: size === 'sm' ? 16 : size === 'md' ? 20 : 24,
            fontWeight: 500,
            letterSpacing: 0.5,
            textAlign: 'center',
            userSelect: 'none',
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}; 