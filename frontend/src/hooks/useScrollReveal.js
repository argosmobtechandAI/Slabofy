import { useEffect, useRef } from 'react';

export default function useScrollReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Default: Trigger when 10% of element is visible, with a small bottom offset
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
        rootMargin: options.rootMargin || '0px 0px -50px 0px',
        threshold: options.threshold || 0.1,
      }
    );

    // Initial state
    el.classList.add('scroll-reveal-group');
    observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [options.threshold, options.rootMargin, options.persist]);

  return ref;
}
