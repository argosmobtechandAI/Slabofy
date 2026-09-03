import { useCallback, useRef } from 'react';

export default function useScrollReveal(options = {}) {
  const domNodeRef = useRef(null);
  const observerRef = useRef(null);

  const setRef = useCallback((el) => {
    domNodeRef.current = el;

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('scroll-visible');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('scroll-visible');
          if (!options.persist) {
            observer.unobserve(el);
          }
        } else if (options.persist) {
          el.classList.remove('scroll-visible');
        }
      },
      {
        root: null,
        rootMargin: options.rootMargin || '50px 0px 50px 0px',
        threshold: options.threshold || 0.05,
      }
    );

    el.classList.add('scroll-reveal-group');
    observer.observe(el);
    observerRef.current = observer;

    // Immediate viewport check: if already in or near viewport, reveal immediately
    if (typeof window !== 'undefined') {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 100) {
        el.classList.add('scroll-visible');
      }
    }

    // Safety fallback
    const timer = setTimeout(() => {
      if (el && !el.classList.contains('scroll-visible')) {
        el.classList.add('scroll-visible');
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [options.threshold, options.rootMargin, options.persist]);

  // Support both ref={revealRef} and revealRef.current
  Object.defineProperty(setRef, 'current', {
    get: () => domNodeRef.current,
    set: (node) => { setRef(node); },
    configurable: true
  });

  return setRef;
}
