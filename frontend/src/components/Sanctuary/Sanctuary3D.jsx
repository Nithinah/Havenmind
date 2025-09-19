
import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useSanctuary } from '../../hooks/useSanctuary';
import './Sanctuary3D.css';


import { Html, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MODEL_PATHS = {
  bird: '/models/bird_orange.glb',
  crystal: '/models/crystal.glb',
  cloud: '/models/cloud.glb',
  wind: '/models/wind.glb',
  flower: '/models/flower.glb',
  tree: '/models/tree.glb',
  butterfly: '/models/butterfly.glb',
  stone: '/models/stone.glb',
  water: '/models/water.glb',
  moss: '/models/moss.glb',
  plant: '/models/plant.glb',
  mist: '/models/mist.glb',
  empty: '/models/empty.glb',
  default: '/models/default.glb'
};



function SanctuaryModel({ type, position, scale = 1, color }) {
	const path = MODEL_PATHS[type];
	// Always call useGLTF, even if path is undefined
	const gltf = useGLTF(path || '/models/empty.glb');
	const scene = gltf && gltf.scene && path ? gltf.scene : null;
	if (scene) {
		return <primitive object={scene} position={position} scale={scale} />;
	}
	switch (type) {
		case 'bird':
			return (
				<mesh position={position} scale={scale}>
					<sphereGeometry args={[0.3, 16, 12]} />
					<meshStandardMaterial color={color || '#ffd700'} />
				</mesh>
			);
		case 'tree':
			return (
				<mesh position={position} scale={scale}>
					<cylinderGeometry args={[0.1, 0.3, 1, 8]} />
					<meshStandardMaterial color={color || '#228B22'} />
				</mesh>
			);
		case 'butterfly':
			return (
				<mesh position={position} scale={scale}>
					<boxGeometry args={[0.4, 0.2, 0.05]} />
					<meshStandardMaterial color={color || '#ff69b4'} />
				</mesh>
			);
		case 'stone':
			return (
				<mesh position={position} scale={scale}>
					<dodecahedronGeometry args={[0.3]} />
					<meshStandardMaterial color={color || '#a9a9a9'} />
				</mesh>
			);
		case 'water':
			return (
				<mesh position={position} scale={scale}>
					<torusGeometry args={[0.3, 0.1, 8, 16]} />
					<meshStandardMaterial color={color || '#00bfff'} transparent opacity={0.7} />
				</mesh>
			);
		case 'flower':
			return (
				<mesh position={position} scale={scale}>
					<sphereGeometry args={[0.2, 8, 6]} />
					<meshStandardMaterial color={color || '#ffb6c1'} />
				</mesh>
			);
		case 'crystal':
			return (
				<mesh position={position} scale={scale}>
					<octahedronGeometry args={[0.2]} />
					<meshStandardMaterial color={color || '#00ffff'} />
				</mesh>
			);
		default:
			return (
				<mesh position={position} scale={scale}>
					<sphereGeometry args={[0.2, 16, 12]} />
					<meshStandardMaterial color={color || '#fff'} />
				</mesh>
			);
	}
}

const SanctuaryElement3D = ({ element, onElementClick }) => {
	const meshRef = React.useRef();
	const [hovered, setHovered] = React.useState(false);
	const position = React.useMemo(() => [
		(element.x_position - 400) / 100,
		(300 - element.y_position) / 100,
		0
	], [element]);
	const scale = element.size * 0.5 || 1;
	const color = element.color || '#fff';

	useFrame(() => {
		if (meshRef.current) {
			meshRef.current.scale.setScalar(hovered ? 1.1 : 1);
		}
	});

	return (
		<group ref={meshRef} position={position} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
			<SanctuaryModel type={element.element_type} position={[0, 0, 0]} scale={scale} color={color} />
			{hovered && (
				<Html position={[0, 1.5, 0]} center style={{ pointerEvents: 'none' }}>
					<div style={{
						background: '#181826',
						color: '#fff',
						borderRadius: 10,
						boxShadow: '0 2px 16px rgba(99,102,241,0.10)',
						padding: '10px 16px',
						minWidth: 120,
						fontSize: 15,
						textAlign: 'center',
						border: 'none',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: 4,
					}}>
						<div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
							<span style={{ fontSize: 18 }}>
								{element.element_type === 'bird' ? '🦜' :
								 element.element_type === 'flower' ? '🌸' :
								 element.element_type === 'cloud' ? '☁️' :
								 element.element_type === 'wind' ? '🌬️' :
								 element.element_type === 'moss' ? '🌿' :
								 element.element_type === 'plant' ? '🌱' :
								 element.element_type === 'mist' ? '🌫️' :
								 element.element_type === 'tree' ? '🌳' :
								 element.element_type === 'crystal' ? '🔮' :
								 element.element_type === 'butterfly' ? '🦋' :
								 element.element_type === 'stone' ? '🪨' :
								 element.element_type === 'water' ? '💧' :
								 '✨'}
							</span>
							{element.name || element.element_type}
						</div>
						<div style={{ fontSize: 13 }}>{element.emotion}</div>
						<div style={{ fontSize: 12, opacity: 0.8 }}>{element.date || ''}</div>
					</div>
				</Html>
			)}
		</group>
	);
};

const Sanctuary3D = ({ sessionId, onElementClick }) => {
	const { elements = [], isLoading } = useSanctuary(sessionId);
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
						<ambientLight intensity={0.4} />
						<pointLight position={[10, 10, 10]} intensity={1} castShadow />
						<pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />
						<Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade />
						{/* Render all elements as 3D sanctuary objects */}
						{elements.map((element) => (
							<SanctuaryElement3D key={element.id} element={element} onElementClick={onElementClick} />
						))}
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
			<motion.div 
				className={`controls-3d ${showControls ? 'visible' : 'hidden'}`}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5 }}
				style={{ borderRadius: 18, boxShadow: '0 2px 16px rgba(99,102,241,0.10)' }}
			>
				<div className="controls-header">
					<h4 style={{ fontWeight: 700, letterSpacing: '0.5px' }}>3D Controls</h4>
					<button 
						className="toggle-controls"
						onClick={() => setShowControls(!showControls)}
						style={{ borderRadius: 8 }}
					>
						{showControls ? '\u2212' : '+'}
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
			{isLoading && (
				<div className="loading-3d">
					<div className="loading-3d-spinner" />
					<p>Loading 3D sanctuary...</p>
				</div>
			)}
			<div className="info-3d" style={{ borderRadius: 14, boxShadow: '0 2px 16px rgba(99,102,241,0.10)' }}>
				<div className="element-count-3d" style={{ fontWeight: 700, fontSize: 15 }}>
					{elements.length} elements in 3D space
				</div>
				<div className="tip-3d" style={{ fontSize: 12, opacity: 0.8 }}>
					Hover over elements to see details
				</div>
			</div>
		</div>
	);
};

export default Sanctuary3D;