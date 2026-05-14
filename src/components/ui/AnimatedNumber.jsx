import React, { useState, useEffect, useRef } from 'react';

export const AnimatedNumber = ({ value, prefix = '', suffix = '', format = true }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (isReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const startValue = 0;
    const endValue = Number(value) || 0;
    const duration = 1300; // 1.3s
    let startTime = null;

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setDisplayValue(startValue + (endValue - startValue) * easeOut(progress));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [value, isReducedMotion]);

  const formattedValue = format 
    ? Math.round(displayValue).toLocaleString('en-IN')
    : Math.round(displayValue);

  return <>{prefix}{formattedValue}{suffix}</>;
};
