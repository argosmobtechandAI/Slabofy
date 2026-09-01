import { useEffect, useRef } from 'react';

export default function use3DTilt(options = {}) {
  const ref = useRef(null);
  
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    // Check if device supports hover (ignores mobile/touch devices for performance)
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const maxTilt = options.maxTilt || 15; // max tilt degrees
    const scale = options.scale || 1.02;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element
      const y = e.clientY - rect.top;  // y position within the element
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const tiltX = ((centerY - y) / centerY) * maxTilt;
      const tiltY = ((x - centerX) / centerX) * maxTilt;
      
      el.style.transform = `perspective(1000px) scale(${scale}) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      el.style.transition = 'transform 0.1s ease-out';
      
      // Optional glare effect if a child element has the .glare class
      const glare = el.querySelector('.glare');
      if (glare) {
        const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI - 90;
        glare.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 80%)`;
        glare.style.transform = `translateY(${tiltX * -1}px) translateX(${tiltY * -1}px)`;
      }
    };

    const handleMouseLeave = () => {
      el.style.transform = `perspective(1000px) scale(1) rotateX(0deg) rotateY(0deg)`;
      el.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
      const glare = el.querySelector('.glare');
      if (glare) {
        glare.style.background = 'transparent';
      }
    };
    
    const handleMouseEnter = () => {
      el.style.transition = 'transform 0.1s ease-out';
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [options.maxTilt, options.scale]);

  return ref;
}
