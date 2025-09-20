import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SanctuaryCanvas.css';

const SanctuaryCanvas = ({ 
  elements = [], 
  isLoading, 
  onElementClick, 
  onElementDelete,
  sessionId 
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [hoveredElement, setHoveredElement] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [animatingElements, setAnimatingElements] = useState(new Set());
  const [lastElementCount, setLastElementCount] = useState(0);

  // Emoji mappings for different element types
  const elementEmojis = {
    flower: '🌸',
    tree: '🌳',
    crystal: '💎',
    butterfly: '🦋',
    bird: '🐦',
    stone: '🗿',
    water: '💧',
    plant: '🌱',
    mist: '🌫️',
    sun: '☀️',
    moon: '🌙',
    star: '⭐',
    heart: '💖',
    peace: '☮️',
    cloud: '☁️', 
    wind: '🌬️', 
    moss: '🌿', 
    default: '✨'
  };

  // Detect new elements and trigger animations
  useEffect(() => {
    if (elements.length > lastElementCount) {
      console.log('🎨 New elements detected!', elements.length - lastElementCount);
      
      // Get the new elements (last N elements)
      const newElementsCount = elements.length - lastElementCount;
      const newElements = elements.slice(-newElementsCount);
      
      // Add new elements to animation set
      setAnimatingElements(prev => {
        const newSet = new Set(prev);
        newElements.forEach(element => {
          newSet.add(element.id);
        });
        return newSet;
      });
      
      // Show celebration for new elements
      if (newElementsCount > 0) {
        showElementAddedCelebration(newElements);
      }
      
      // Remove from animation set after animation completes
      setTimeout(() => {
        setAnimatingElements(prev => {
          const newSet = new Set(prev);
          newElements.forEach(element => {
            newSet.delete(element.id);
          });
          return newSet;
        });
      }, 2000);
    }
    
    setLastElementCount(elements.length);
  }, [elements.length, lastElementCount]);

  // Show celebration effect for new elements
  const showElementAddedCelebration = (newElements) => {
    console.log('🎉 Showing celebration for new elements:', newElements);
    
    // Create celebration particles
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    newElements.forEach((element, index) => {
      setTimeout(() => {
        createCelebrationEffect(element.x_position, element.y_position);
      }, index * 300);
    });
  };

  // Create celebration particle effect
  const createCelebrationEffect = (x, y) => {
    const celebrationParticles = [];
    for (let i = 0; i < 8; i++) {
      celebrationParticles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        decay: 0.02,
        size: Math.random() * 4 + 2,
        color: `hsl(${Math.random() * 60 + 280}, 70%, 70%)`
      });
    }
    
    // Add to particles for rendering
    particlesRef.current.push(...celebrationParticles);
  };

  // Initialize ambient particles
  const initializeParticles = useCallback(() => {
    particlesRef.current = [];
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x: Math.random() * canvasSize.width,
        y: Math.random() * canvasSize.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.3 + 0.1,
        color: `hsl(${Math.random() * 60 + 200}, 50%, 70%)`,
        life: 1, // Permanent particles
        type: 'ambient'
      });
    }
  }, [canvasSize.width, canvasSize.height]);

  // Main drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background gradient
    drawBackground(ctx);

    // Draw and update particles
    drawParticles(ctx);

    // Draw sanctuary elements with animation states
    elements.forEach((element, index) => {
      const isAnimating = animatingElements.has(element.id);
      drawSanctuaryElement(ctx, element, index, isAnimating);
    });

    // Draw hover effects
    if (hoveredElement) {
      drawHoverEffect(ctx, hoveredElement);
    }

    // Draw cursor effect
    drawCursorEffect(ctx);
  }, [elements, hoveredElement, mousePos, canvasSize, animatingElements]);

  // Initialize canvas and particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      const rect = container.getBoundingClientRect();
      const newWidth = Math.max(800, rect.width - 40);
      const newHeight = Math.max(600, rect.height - 40);
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      setCanvasSize({ width: newWidth, height: newHeight });
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    initializeParticles();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initializeParticles]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  const drawBackground = (ctx) => {
    // Dynamic gradient based on number of elements
    const intensity = Math.min(elements.length / 10, 1);
    const gradient = ctx.createRadialGradient(
      canvasSize.width / 2, canvasSize.height / 2, 0,
      canvasSize.width / 2, canvasSize.height / 2, canvasSize.width / 2
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.1 + intensity * 0.1})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, ${0.05 + intensity * 0.05})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw subtle grid that becomes more visible with more elements
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + intensity * 0.05})`;
    ctx.lineWidth = 1;
    const gridSize = 50;

    for (let x = 0; x <= canvasSize.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvasSize.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }
  };

  const drawParticles = (ctx) => {
    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      // Update particle position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Update life for temporary particles
      if (particle.life !== undefined && particle.life < 1) {
        particle.life -= particle.decay || 0.02;
        if (particle.life <= 0) return false; // Remove dead particles
      }

      // Wrap around edges for ambient particles
      if (particle.type === 'ambient') {
        if (particle.x < 0) particle.x = canvasSize.width;
        if (particle.x > canvasSize.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvasSize.height;
        if (particle.y > canvasSize.height) particle.y = 0;
      }

      // Draw particle
      ctx.save();
      const alpha = particle.life !== undefined ? particle.life * (particle.opacity || 1) : particle.opacity;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      return true; // Keep particle
    });
  };

  const drawSanctuaryElement = (ctx, element, index, isAnimating = false) => {
    const { x_position, y_position, size, color, element_type, image_url } = element;
    const time = Date.now() * 0.001;
    
    // Enhanced animation for new elements
    let currentSize = size * 40;
    let glowIntensity = 0.3;
    let pulseMultiplier = 1;
    
    if (isAnimating) {
      // Growing animation for new elements
      const animationProgress = Math.min((Date.now() % 2000) / 2000, 1);
      currentSize = size * 40 * (0.1 + 0.9 * easeOutBounce(animationProgress));
      glowIntensity = 0.8 * (1 - animationProgress);
      pulseMultiplier = 1.5 - 0.5 * animationProgress;
    }
    
    // Element pulsing animation based on sentiment
    const pulseIntensity = Math.abs(element.sentiment_score || 0) * 0.3 + 0.7;
    currentSize *= (1 + 0.1 * Math.sin(time + index) * pulseIntensity * pulseMultiplier);

    ctx.save();

    // Enhanced glow effect for new elements
    const glowSize = currentSize * (1.5 + glowIntensity);
    const gradient = ctx.createRadialGradient(
      x_position, y_position, 0,
      x_position, y_position, glowSize
    );
    gradient.addColorStop(0, `${color}${Math.floor((0.4 + glowIntensity) * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, `${color}00`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(
      x_position - glowSize,
      y_position - glowSize,
      glowSize * 2,
      glowSize * 2
    );

    // Draw main circular element with enhanced pop appearance
    ctx.beginPath();
    ctx.arc(x_position, y_position, currentSize / 2, 0, Math.PI * 2);
    
    // Create enhanced pop-like gradient
    const popGradient = ctx.createRadialGradient(
      x_position - currentSize * 0.2, 
      y_position - currentSize * 0.2, 
      0,
      x_position, 
      y_position, 
      currentSize / 2
    );
    popGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    popGradient.addColorStop(0.3, color + 'DD');
    popGradient.addColorStop(1, color);
    
    ctx.fillStyle = popGradient;
    ctx.fill();

    // Enhanced border for new elements
    ctx.strokeStyle = isAnimating ? '#ffffff' : color;
    ctx.lineWidth = isAnimating ? 4 : 3;
    ctx.globalAlpha = 0.9;
    ctx.stroke();

    // Draw emoji in the center with scale animation
    const emoji = elementEmojis[element_type] || elementEmojis.default;
    ctx.globalAlpha = 1;
    const fontSize = Math.max(16, currentSize * 0.4);
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Enhanced text shadow for visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = isAnimating ? 8 : 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(emoji, x_position, y_position);
    
    // Sparkle effect for new elements
    if (isAnimating) {
      drawSparkles(ctx, x_position, y_position, currentSize, time);
    }
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.restore();

    // Store element bounds for click detection
    element._bounds = {
      x: x_position - currentSize / 2,
      y: y_position - currentSize / 2,
      width: currentSize,
      height: currentSize,
      centerX: x_position,
      centerY: y_position,
      radius: currentSize / 2
    };
  };

  // Easing function for smooth animations
  const easeOutBounce = (t) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  };

  // Draw sparkle effect for new elements
  const drawSparkles = (ctx, centerX, centerY, size, time) => {
    const sparkleCount = 6;
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (i / sparkleCount) * Math.PI * 2 + time * 2;
      const distance = size * 0.7;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const sparkleSize = 3 + Math.sin(time * 3 + i) * 2;
      
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1;
      
      // Draw star shape
      ctx.beginPath();
      for (let j = 0; j < 4; j++) {
        const starAngle = (j / 4) * Math.PI * 2;
        const starX = x + Math.cos(starAngle) * sparkleSize;
        const starY = y + Math.sin(starAngle) * sparkleSize;
        if (j === 0) ctx.moveTo(starX, starY);
        else ctx.lineTo(starX, starY);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  };

  const drawHoverEffect = (ctx, element) => {
    if (!element._bounds) return;

    const { centerX, centerY, radius } = element._bounds;
    const time = Date.now() * 0.005;
    
    // Animated hover ring with pulsing effect
    ctx.save();
    ctx.strokeStyle = element.color;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.8;
    
    const hoverRadius = radius + 20 + Math.sin(time) * 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, hoverRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Additional inner ring
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    const innerRadius = radius + 10 + Math.sin(time + 1) * 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  };

  const drawCursorEffect = (ctx) => {
    if (mousePos.x === 0 && mousePos.y === 0) return;

    ctx.save();
    ctx.globalAlpha = 0.3;
    
    // Subtle cursor glow
    const gradient = ctx.createRadialGradient(
      mousePos.x, mousePos.y, 0,
      mousePos.x, mousePos.y, 30
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(mousePos.x - 30, mousePos.y - 30, 60, 60);
    
    ctx.restore();
  };

  // Mouse event handlers
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x, y });

    // Check for hovered elements
    const hovered = elements.find(element => {
      if (!element._bounds) return false;
      const { centerX, centerY, radius } = element._bounds;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      return distance <= radius;
    });

    setHoveredElement(hovered || null);
  }, [elements]);

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: 0, y: 0 });
    setHoveredElement(null);
  }, []);

  const handleClick = useCallback((e) => {
    if (hoveredElement) {
      onElementClick?.(hoveredElement);
    }
  }, [hoveredElement, onElementClick]);

  return (
    <div className="sanctuary-canvas-container">
      <canvas
        ref={canvasRef}
        className="sanctuary-canvas"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ cursor: hoveredElement ? 'pointer' : 'default' }}
      />
      
      {isLoading && (
        <div className="canvas-loading">
          <div className="loading-pulse" />
          <p>Growing sanctuary elements...</p>
        </div>
      )}

      {elements.length === 0 && !isLoading && (
        <div className="canvas-empty">
          <div className="empty-message">
            <h3>Your sanctuary canvas awaits</h3>
            <p>Share your thoughts and watch your sanctuary bloom with meaningful elements featuring beautiful emojis</p>
          </div>
        </div>
      )}

      {hoveredElement && (
        <motion.div
          className="element-tooltip"
          style={{
            left: mousePos.x + 10,
            top: mousePos.y - 60
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <div className="tooltip-content">
            <strong>{hoveredElement.element_type} {elementEmojis[hoveredElement.element_type] || elementEmojis.default}</strong>
            <span className="tooltip-emotion" style={{ color: hoveredElement.color }}>
              {hoveredElement.emotion}
            </span>
            <div className="tooltip-date">
              {new Date(hoveredElement.created_at).toLocaleDateString()}
            </div>
          </div>
        </motion.div>
      )}

      {/* Real-time element count display */}
      <AnimatePresence>
        {elements.length > 0 && (
          <motion.div
            className="element-counter"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '8px 16px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            🌸 {elements.length} elements growing
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SanctuaryCanvas;