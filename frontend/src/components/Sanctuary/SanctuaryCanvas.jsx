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

    // Draw main element
    if (image_url && image_url.startsWith('data:image')) {
      // Draw AI-generated image if available
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.globalAlpha = 0.9;
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
    } else {
      // Draw procedural element
      drawProceduralElement(ctx, element_type, x_position, y_position, currentSize, color);
    }

    // Draw element border
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(x_position, y_position, currentSize / 2, 0, Math.PI * 2);
    ctx.stroke();

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

  const drawProceduralElement = (ctx, elementType, x, y, size, color) => {
    const radius = size / 2;
    
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;

    switch (elementType) {
      case 'flower':
        drawFlower(ctx, x, y, radius, color);
        break;
      case 'tree':
        drawTree(ctx, x, y, radius, color);
        break;
      case 'crystal':
        drawCrystal(ctx, x, y, radius, color);
        break;
      case 'butterfly':
        drawButterfly(ctx, x, y, radius, color);
        break;
      case 'bird':
        drawBird(ctx, x, y, radius, color);
        break;
      case 'stone':
        drawStone(ctx, x, y, radius, color);
        break;
      case 'water':
        drawWater(ctx, x, y, radius, color);
        break;
      default:
        // Default circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
  };

  const drawFlower = (ctx, x, y, radius, color) => {
    const petalCount = 6;
    const petalRadius = radius * 0.6;
    
    // Draw petals
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const petalX = x + Math.cos(angle) * radius * 0.3;
      const petalY = y + Math.sin(angle) * radius * 0.3;
      
      ctx.beginPath();
      ctx.ellipse(petalX, petalY, petalRadius, petalRadius * 0.6, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw center
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawTree = (ctx, x, y, radius, color) => {
    // Draw trunk
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - radius * 0.1, y, radius * 0.2, radius);
    
    // Draw canopy
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y - radius * 0.2, radius * 0.8, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawCrystal = (ctx, x, y, radius, color) => {
    const sides = 6;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const pointX = x + Math.cos(angle) * radius;
      const pointY = y + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    }
    ctx.fill();
  };

  const drawButterfly = (ctx, x, y, radius, color) => {
    // Upper wings
    ctx.beginPath();
    ctx.ellipse(x - radius * 0.3, y - radius * 0.2, radius * 0.5, radius * 0.3, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + radius * 0.3, y - radius * 0.2, radius * 0.5, radius * 0.3, 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Lower wings
    ctx.beginPath();
    ctx.ellipse(x - radius * 0.2, y + radius * 0.2, radius * 0.3, radius * 0.2, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + radius * 0.2, y + radius * 0.2, radius * 0.3, radius * 0.2, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Body
    ctx.strokeStyle = '#2D4B1F';
    ctx.lineWidth = radius * 0.1;
    ctx.beginPath();
    ctx.moveTo(x, y - radius * 0.5);
    ctx.lineTo(x, y + radius * 0.5);
    ctx.stroke();
  };

  const drawBird = (ctx, x, y, radius, color) => {
    // Body
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 0.6, radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Wing
    ctx.beginPath();
    ctx.ellipse(x - radius * 0.2, y - radius * 0.1, radius * 0.4, radius * 0.2, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.beginPath();
    ctx.arc(x + radius * 0.3, y - radius * 0.1, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawStone = (ctx, x, y, radius, color) => {
    const sides = 8;
    const irregularity = 0.3;
    
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const randomRadius = radius * (1 + (Math.random() - 0.5) * irregularity);
      const pointX = x + Math.cos(angle) * randomRadius;
      const pointY = y + Math.sin(angle) * randomRadius;
      
      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    }
    ctx.fill();
  };

  const drawWater = (ctx, x, y, radius, color) => {
    const waves = 3;
    ctx.globalAlpha = 0.6;
    
    for (let i = 0; i < waves; i++) {
      const waveRadius = radius * (0.3 + i * 0.2);
      const time = Date.now() * 0.002;
      const offsetY = Math.sin(time + i) * 2;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y + offsetY, waveRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const drawHoverEffect = (ctx, element) => {
    if (!element._bounds) return;

    const { centerX, centerY, radius } = element._bounds;
    const time = Date.now() * 0.005;
    
    // Animated hover ring
    ctx.save();
    ctx.strokeStyle = element.color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;
    
    const hoverRadius = radius + 20 + Math.sin(time) * 5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, hoverRadius, 0, Math.PI * 2);
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
            <p>Share your thoughts and watch your sanctuary bloom with meaningful elements</p>
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
            <strong>{hoveredElement.element_type}</strong>
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