with open('src/index.css', 'a') as f:
    f.write("""
/* UI REVOLUTION UTILITIES */

/* SCROLL REVEAL */
.scroll-reveal-group {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.scroll-visible {
  opacity: 1;
  transform: translateY(0);
}

/* STAGGERED CHILDREN (Up to 10) */
.scroll-visible > *:nth-child(1) { transition-delay: 50ms; }
.scroll-visible > *:nth-child(2) { transition-delay: 100ms; }
.scroll-visible > *:nth-child(3) { transition-delay: 150ms; }
.scroll-visible > *:nth-child(4) { transition-delay: 200ms; }
.scroll-visible > *:nth-child(5) { transition-delay: 250ms; }
.scroll-visible > *:nth-child(6) { transition-delay: 300ms; }
.scroll-visible > *:nth-child(7) { transition-delay: 350ms; }
.scroll-visible > *:nth-child(8) { transition-delay: 400ms; }
.scroll-visible > *:nth-child(9) { transition-delay: 450ms; }
.scroll-visible > *:nth-child(10) { transition-delay: 500ms; }

/* 3D TILT CONTAINER */
.tilt-card {
  perspective: 1000px;
  transform-style: preserve-3d;
}
.tilt-card-inner {
  transform-style: preserve-3d;
  position: relative;
  transition: transform 0.1s ease;
}

/* GLARE EFFECT */
.glare {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  border-radius: inherit;
  pointer-events: none;
  background: transparent;
  z-index: 10;
  mix-blend-mode: overlay;
  transition: opacity 0.5s;
}

/* SHINE SWEEP */
@keyframes shine-sweep {
  0% { transform: translateX(-150%) skewX(-25deg); opacity: 0; }
  10% { opacity: 1; }
  40%, 100% { transform: translateX(150%) skewX(-25deg); opacity: 0; }
}
.hover-shine-sweep {
  position: relative;
  overflow: hidden;
}
.hover-shine-sweep::after {
  content: '';
  position: absolute;
  top: 0; left: 0; width: 50%; height: 100%;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent);
  transform: translateX(-150%) skewX(-25deg);
  z-index: 20;
}
.hover-shine-sweep:hover::after {
  animation: shine-sweep 1.5s infinite;
}

/* COUNT UP PULSE */
@keyframes count-up-pulse {
  0% { transform: scale(0.9); opacity: 0.5; filter: blur(4px); }
  70% { transform: scale(1.05); filter: blur(0px); }
  100% { transform: scale(1); opacity: 1; }
}

/* PROGRESS FILL */
@keyframes progress-fill {
  0% { width: 0%; }
  100% { width: var(--progress-pct, 100%); }
}
.progress-bar-animated {
  animation: progress-fill 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

/* SPARKLE SPIN */
@keyframes sparkle-spin {
  0% { transform: scale(0.8) rotate(0deg); opacity: 0.5; }
  50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
  100% { transform: scale(0.8) rotate(360deg); opacity: 0.5; }
}

/* NEW COMPONENT CLASSES */
.light-section-alt {
  background: #fdfaf6;
  border-top: 1px solid rgba(18,16,14,0.04);
  border-bottom: 1px solid rgba(18,16,14,0.04);
}

.feature-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(91,33,182,0.06);
  color: #5b21b6;
  padding: 6px 14px;
  border-radius: 100px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border: 1px solid rgba(91,33,182,0.1);
}

.product-card-v2 {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(18,16,14,0.06);
  box-shadow: 0 4px 24px rgba(18,16,14,0.04);
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.product-card-v2:hover {
  border-color: rgba(91,33,182,0.15);
  box-shadow: 0 16px 48px rgba(91,33,182,0.08);
}

@media (max-width: 767px) {
  .mobile-only-stack {
    flex-direction: column !important;
  }
}

/* FIX PREFERS REDUCED MOTION */
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .scroll-reveal-group {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .tilt-card-inner {
    transform: none !important;
  }
}
""")
