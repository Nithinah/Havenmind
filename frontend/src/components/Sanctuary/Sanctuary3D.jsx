import React, { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Float, Environment, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import './Sanctuary3D.css';

// Individual 3D Element Component
const SanctuaryElement3D = ({ element, onClick }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  const { position, geometry, material } = useMemo(() => {
    const pos = [
      (element.x_position - 400) / 100, // Convert to 3D coordinates
      (300 - element.y_position) / 100,
      0
    ];

    // Create geometry based on element type
    let geom;
    switch (element.element_type) {
      case 'flower':
        geom = new THREE.SphereGeometry(element.size * 0.5, 8, 6);
        break;
      case 'tree':
        geom = new THREE.ConeGeometry(element.size * 0.3, element.size, 8);
        break;
      case 'crystal':
        geom = new THREE.OctahedronGeometry(element.size * 0.4);
        break;
      case 'butterfly':
      case 'bird':
        geom = new THREE.BoxGeometry(element.size * 0.6, element.size * 0.2, element.size * 0.1);
        break;
      case 'stone':
        geom = new THREE.DodecahedronGeometry(element.size * 0.4);
        break;
      case 'water':
        geom = new THREE.TorusGeometry(element.size * 0.3, element.size * 0.1, 8, 16);
        break;
      default:
        geom = new THREE.SphereGeometry(element.size * 0.4, 16, 12);
    }

    // Create material with element color
    const color = new THREE.Color(element.color);
    const mat = new THREE.MeshPhongMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      emissive: color.clone().multiplyScalar(0.1),
    });

    return { position: pos, geometry: geom, material: mat };
  }, [element]);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      const time = state.clock.elapsedTime;
      meshRef.current.position.y = position[1] + Math.sin(time + element.id) * 0.1;
      
      // Subtle rotation
      meshRef.current.rotation.y += 0.005;
      
      // Pulsing based on sentiment
      const pulseIntensity = Math.abs(element.sentiment_score) * 0.2 + 0.8;
      const scale = pulseIntensity * (1 + Math.sin(time * 2 + element.id) * 0.1);
      meshRef.current.scale.setScalar(scale);

      // Hover effect
      if (hovered) {
        meshRef.current.material.emissive.setScalar(0.2);
      } else {
        meshRef.current.material.emissive = material.emissive;
      }
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={0.2}>
      <mesh
        ref={meshRef}
        position={position}
        geometry={geometry}
        material={material}
        onClick={() => onClick?.(element)}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        {hovered && (
          <Text
            position={[0, 1, 0]}
            fontSize={0.2}
            color="white"
            anchorX="center"
            anchorY="middle"
            font="/fonts/Inter-Medium.woff"
          >
            {element.emotion}
          </Text>
        )}
      </mesh>
    </Float>
  );
};

// Particle System Component
const ParticleSystem = ({ count = 100 }) => {
  const points = useRef();
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return positions;
  }, [count]);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y += 0.001;
      const time = state.clock.elapsedTime;
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        points.current.geometry.attributes.position.array[i3 + 1] += 
          Math.sin(time + i) * 0.001;
      }
      points.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#ffffff" transparent opacity={0.6} />
    </points>
  );
};

// Ground Plane Component
const Ground = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshLambertMaterial 
        color="#1a1a2e" 
        transparent 
        opacity={0.3}
      />
    </mesh>
  );
};

// Camera Controller
const CameraController = () => {
  const { camera } = useThree();
  
  React.useEffect(() => {
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
};

// Main 3D Scene Component
const Scene3D = ({ elements, onElementClick }) => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />
      
      {/* Environment */}
      <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade />
      <Ground />
      <ParticleSystem />
      
      {/* Sanctuary Elements */}
      {elements.map((element) => (
        <SanctuaryElement3D
          key={element.id}
          element={element}
          onClick={onElementClick}
        />
      ))}
    </>
  );
};

// Main Component
const Sanctuary3D = ({ sessionId, elements = [], onElementClick }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);

  return (
    <div className="sanctuary-3d-container">
      <div className="canvas-3d-wrapper">
        <Canvas
          camera={{ position: [0, 5, 10], fov: 75 }}
          shadows
          className="sanctuary-3d-canvas"
        >
          <Suspense fallback={null}>
            <CameraController />
            <Scene3D elements={elements} onElementClick={onElementClick} />
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={3}
              maxDistance={20}
              minPolarAngle={0}
              maxPolarAngle={Math.PI / 2}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* 3D Controls */}
      <motion.div 
        className={`controls-3d ${showControls ? 'visible' : 'hidden'}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="controls-header">
          <h4>3D Controls</h4>
          <button 
            className="toggle-controls"
            onClick={() => setShowControls(!showControls)}
          >
            {showControls ? '−' : '+'}
          </button>
        </div>
        
        {showControls && (
          <div className="controls-list">
            <div className="control-item">
              <span className="control-action">Rotate</span>
              <span className="control-input">Click + Drag</span>
            </div>
            <div className="control-item">
              <span className="control-action">Zoom</span>
              <span className="control-input">Mouse Wheel</span>
            </div>
            <div className="control-item">
              <span className="control-action">Pan</span>
              <span className="control-input">Right Click + Drag</span>
            </div>
            <div className="control-item">
              <span className="control-action">Select</span>
              <span className="control-input">Click Element</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Empty State for 3D */}
      {elements.length === 0 && (
        <div className="empty-3d">
          <div className="empty-3d-content">
            <h3>Your 3D sanctuary awaits</h3>
            <p>Journal entries will appear here as beautiful 3D elements you can explore</p>
            <div className="empty-3d-hint">
              <span>💫 Create your first element by journaling</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="loading-3d">
          <div className="loading-3d-spinner" />
          <p>Loading 3D sanctuary...</p>
        </div>
      )}

      {/* Info Panel */}
      <div className="info-3d">
        <div className="element-count-3d">
          {elements.length} elements in 3D space
        </div>
        <div className="tip-3d">
          Hover over elements to see details
        </div>
      </div>
    </div>
  );
};

export default Sanctuary3D;