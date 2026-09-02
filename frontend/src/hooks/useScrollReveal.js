import { useEffect, useRef } from 'react';

export default function useScrollReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
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

    // Safety fallback: ensure element is revealed if observer doesn't trigger quickly
    const timer = setTimeout(() => {
      if (el && !el.classList.contains('scroll-visible')) {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 200) {
          el.classList.add('scroll-visible');
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (el) observer.unobserve(el);
    };
  }, [options.threshold, options.rootMargin, options.persist]);

  return ref;
}
