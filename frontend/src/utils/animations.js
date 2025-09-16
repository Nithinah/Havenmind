import { ANIMATION_DURATIONS } from './constants.js';

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: ANIMATION_DURATIONS.NORMAL / 1000 }
};

export const slideUp = {
  initial: { y: 50, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -50, opacity: 0 },
  transition: { duration: ANIMATION_DURATIONS.NORMAL / 1000 }
};

export const slideDown = {
  initial: { y: -50, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 50, opacity: 0 },
  transition: { duration: ANIMATION_DURATIONS.NORMAL / 1000 }
};

export const slideLeft = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
  transition: { duration: ANIMATION_DURATIONS.NORMAL / 1000 }
};

export const slideRight = {
  initial: { x: -50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 50, opacity: 0 },
  transition: { duration: ANIMATION_DURATIONS.NORMAL / 1000 }
};

export const scaleIn = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
  transition: { duration: ANIMATION_DURATIONS.NORMAL / 1000 }
};

export const bounce = {
  initial: { y: -10 },
  animate: { y: 0 },
  transition: {
    type: 'spring',
    stiffness: 300,
    damping: 10
  }
};

export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

export const wiggle = {
  animate: {
    rotate: [-3, 3, -3, 3, 0],
    transition: {
      duration: 0.5,
      ease: 'easeInOut'
    }
  }
};

export const float = {
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

export const glow = {
  animate: {
    boxShadow: [
      '0 0 5px rgba(255, 255, 255, 0.5)',
      '0 0 20px rgba(255, 255, 255, 0.8)',
      '0 0 5px rgba(255, 255, 255, 0.5)'
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

export const typewriter = {
  initial: { width: 0 },
  animate: { width: 'auto' },
  transition: {
    duration: 2,
    ease: 'steps',
    steps: 20
  }
};

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const morphing = {
  animate: {
    borderRadius: ['10%', '20%', '50%', '20%', '10%'],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

export const flip = {
  initial: { rotateY: 0 },
  animate: { rotateY: 180 },
  transition: { duration: ANIMATION_DURATIONS.SLOW / 1000 }
};

export const shake = {
  animate: {
    x: [-2, 2, -2, 2, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut'
    }
  }
};

export const breathe = {
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

export const ripple = {
  initial: { scale: 0, opacity: 1 },
  animate: { scale: 2, opacity: 0 },
  transition: { duration: 0.6, ease: 'easeOut' }
};

// Helper function to create custom animations
export const createCustomAnimation = (keyframes, duration = ANIMATION_DURATIONS.NORMAL, options = {}) => {
  return {
    animate: keyframes,
    transition: {
      duration: duration / 1000,
      ...options
    }
  };
};

// Animation presets for different components
export const sanctuaryAnimations = {
  containerEntry: staggerChildren,
  elementEntry: slideUp,
  moodChange: scaleIn,
  companionMessage: slideLeft,
  statsUpdate: pulse
};

export const storyAnimations = {
  pageFlip: flip,
  textReveal: typewriter,
  chapterEntry: fadeIn,
  bookOpen: scaleIn
};

export const skillAnimations = {
  progressUpdate: scaleIn,
  levelUp: bounce,
  achievementUnlock: glow,
  skillEntry: slideUp
};

// Utility functions for animations
export const getRandomAnimation = (animationSet) => {
  const animations = Object.values(animationSet);
  return animations[Math.floor(Math.random() * animations.length)];
};

export const combineAnimations = (...animations) => {
  return animations.reduce((combined, animation) => {
    return {
      ...combined,
      ...animation,
      transition: {
        ...combined.transition,
        ...animation.transition
      }
    };
  }, {});
};

export const delayAnimation = (animation, delay) => {
  return {
    ...animation,
    transition: {
      ...animation.transition,
      delay: delay / 1000
    }
  };
};

// Responsive animation utilities
export const getResponsiveAnimation = (animation, isMobile) => {
  if (isMobile) {
    return {
      ...animation,
      transition: {
        ...animation.transition,
        duration: (animation.transition?.duration || 0.3) * 0.7 // Faster on mobile
      }
    };
  }
  return animation;
};

// Accessibility-aware animations
export const getAccessibleAnimation = (animation, prefersReducedMotion) => {
  if (prefersReducedMotion) {
    return {
      initial: animation.initial,
      animate: animation.animate,
      exit: animation.exit,
      transition: { duration: 0.01 } // Nearly instant for reduced motion
    };
  }
  return animation;
};