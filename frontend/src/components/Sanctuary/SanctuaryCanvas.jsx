import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
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
    default: '✨'
  };

  // Initialize ambient particles - MOVED BEFORE useEffect
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
        color: `hsl(${Math.random() * 60 + 200}, 50%, 70%)`
      });
    }
  }, [canvasSize.width, canvasSize.height]);

  // Main drawing function - MOVED BEFORE useEffect
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background gradient
    drawBackground(ctx);

    // Draw ambient particles
    drawParticles(ctx);

    // Draw sanctuary elements
    elements.forEach((element, index) => {
      drawSanctuaryElement(ctx, element, index);
    });

    // Draw hover effects
    if (hoveredElement) {
      drawHoverEffect(ctx, hoveredElement);
    }

    // Draw cursor effect
    drawCursorEffect(ctx);
  }, [elements, hoveredElement, mousePos, canvasSize]);

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
    // Gradient background
    const gradient = ctx.createRadialGradient(
      canvasSize.width / 2, canvasSize.height / 2, 0,
      canvasSize.width / 2, canvasSize.height / 2, canvasSize.width / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
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
    particlesRef.current.forEach(particle => {
      // Update particle position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Wrap around edges
      if (particle.x < 0) particle.x = canvasSize.width;
      if (particle.x > canvasSize.width) particle.x = 0;
      if (particle.y < 0) particle.y = canvasSize.height;
      if (particle.y > canvasSize.height) particle.y = 0;

      // Draw particle
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  const drawSanctuaryElement = (ctx, element, index) => {
    const { x_position, y_position, size, color, element_type, image_url } = element;
    const time = Date.now() * 0.001;
    
    // Element pulsing animation based on sentiment
    const pulseIntensity = Math.abs(element.sentiment_score) * 0.3 + 0.7;
    const currentSize = size * (40 + 10 * Math.sin(time + index) * pulseIntensity);

    ctx.save();

    // Draw glow effect
    const glowSize = currentSize * 1.5;
    const gradient = ctx.createRadialGradient(
      x_position, y_position, 0,
      x_position, y_position, glowSize
    );
    gradient.addColorStop(0, `${color}40`);
    gradient.addColorStop(1, `${color}00`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(
      x_position - glowSize,
      y_position - glowSize,
      glowSize * 2,
      glowSize * 2
    );

    // Draw main circular element with pop-like appearance
    ctx.beginPath();
    ctx.arc(x_position, y_position, currentSize / 2, 0, Math.PI * 2);
    
    // Create pop-like gradient
    const popGradient = ctx.createRadialGradient(
      x_position - currentSize * 0.2, 
      y_position - currentSize * 0.2, 
      0,
      x_position, 
      y_position, 
      currentSize / 2
    );
    popGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    popGradient.addColorStop(0.3, color + 'CC');
    popGradient.addColorStop(1, color);
    
    ctx.fillStyle = popGradient;
    ctx.fill();

    // Draw element border with rounded appearance
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.9;
    ctx.stroke();

    // Draw emoji in the center
    const emoji = elementEmojis[element_type] || elementEmojis.default;
    ctx.globalAlpha = 1;
    ctx.font = `${Math.max(16, currentSize * 0.4)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(emoji, x_position, y_position);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // If there's an AI-generated image, draw it as overlay (optional)
    if (image_url && image_url.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.globalAlpha = 0.3; // Make it subtle
        ctx.beginPath();
        ctx.arc(x_position, y_position, currentSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(
          img,
          x_position - currentSize / 2,
          y_position - currentSize / 2,
          currentSize,
          currentSize
        );
        ctx.restore();
      };
      img.src = image_url;
    }

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
    </div>
  );
};

export default SanctuaryCanvas;