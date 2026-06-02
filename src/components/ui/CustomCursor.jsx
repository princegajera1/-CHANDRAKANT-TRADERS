import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const CustomCursor = () => {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 1024) return;

    // Set initial position
    gsap.set(dotRef.current, { xPercent: -50, yPercent: -50 });
    gsap.set(ringRef.current, { xPercent: -50, yPercent: -50 });

    const xDotTo = gsap.quickTo(dotRef.current, 'x', { duration: 0.08, ease: 'power3' });
    const yDotTo = gsap.quickTo(dotRef.current, 'y', { duration: 0.08, ease: 'power3' });

    const xRingTo = gsap.quickTo(ringRef.current, 'x', { duration: 0.35, ease: 'power3.out' });
    const yRingTo = gsap.quickTo(ringRef.current, 'y', { duration: 0.35, ease: 'power3.out' });

    const onMouseMove = (e) => {
      xDotTo(e.clientX);
      yDotTo(e.clientY);

      xRingTo(e.clientX);
      yRingTo(e.clientY);

      setIsVisible(true);
    };

    const onMouseEnter = () => setIsVisible(true);
    const onMouseLeave = () => setIsVisible(false);

    const onMouseOver = (e) => {
      const target = e.target;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('cursor-pointer') ||
        target.closest('.cursor-pointer')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseenter', onMouseEnter);
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  if (typeof window !== 'undefined' && window.innerWidth < 1024) return null;

  return (
    <div className={`pointer-events-none fixed inset-0 z-[99999] transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'} ${isHovering ? 'cursor-active' : ''}`}>
      <div 
        ref={dotRef}
        className="cursor-dot"
      />
      <div 
        ref={ringRef}
        className="cursor-ring"
      />
    </div>
  );
};

export default CustomCursor;
