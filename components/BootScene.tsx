'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

// ─── PALETTE ───
const WALNUT_DARK = new THREE.Color('#1e1610');
const WALNUT_MID = new THREE.Color('#2a2018');
const GUNMETAL = new THREE.Color('#2e2e32');
const GUNMETAL_DARK = new THREE.Color('#1e1e22');
const PHOSPHOR_AMBER = new THREE.Color('#ffb000');
const TUNGSTEN = new THREE.Color('#ffecd2');

// ─── DUST PARTICLES ───
function DustParticles({ count = 150 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null);
  const { viewport } = useThree();

  const [positions, velocities, lifetimes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const life = new Float32Array(count * 2); // [current, max]
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10 + 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
      vel[i * 3] = (Math.random() - 0.5) * 0.003;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.001 + 0.0005;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
      life[i * 2] = Math.random() * 1000;
      life[i * 2 + 1] = 500 + Math.random() * 1000;
    }
    return [pos, vel, life];
  }, [count]);

  useFrame(() => {
    if (!meshRef.current) return;
    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      lifetimes[i * 2]++;
      if (lifetimes[i * 2] > lifetimes[i * 2 + 1]) {
        lifetimes[i * 2] = 0;
        posArray[i * 3] = (Math.random() - 0.5) * 20;
        posArray[i * 3 + 1] = -3 + Math.random() * 2;
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 15;
      }
      posArray[i * 3] += velocities[i * 3];
      posArray[i * 3 + 1] += velocities[i * 3 + 1];
      posArray[i * 3 + 2] += velocities[i * 3 + 2];
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#c4b8a0"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ─── WALNUT DESK ───
function Desk() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base walnut
    ctx.fillStyle = '#2a2018';
    ctx.fillRect(0, 0, 1024, 1024);

    // Wood grain
    for (let i = 0; i < 200; i++) {
      ctx.strokeStyle = `rgba(${30 + Math.random() * 20}, ${20 + Math.random() * 15}, ${10 + Math.random() * 10}, ${0.1 + Math.random() * 0.15})`;
      ctx.lineWidth = 1 + Math.random() * 3;
      ctx.beginPath();
      const y = Math.random() * 1024;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(300, y + (Math.random() - 0.5) * 50, 700, y + (Math.random() - 0.5) * 50, 1024, y + (Math.random() - 0.5) * 30);
      ctx.stroke();
    }

    // Scratches
    for (let i = 0; i < 30; i++) {
      ctx.strokeStyle = `rgba(60, 45, 30, ${0.1 + Math.random() * 0.2})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      const x = 200 + Math.random() * 600;
      const y = 200 + Math.random() * 600;
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 20);
      ctx.stroke();
    }

    // Coffee ring
    ctx.strokeStyle = 'rgba(80, 55, 30, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(700, 300, 35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(80, 55, 30, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(700, 300, 38, 0, Math.PI * 2);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  return (
    <mesh position={[0, -1.2, 0]} receiveShadow>
      <boxGeometry args={[8, 0.15, 4]} />
      <meshStandardMaterial map={texture} roughness={0.7} metalness={0.05} />
    </mesh>
  );
}

// ─── MONITOR ───
function Monitor() {
  const groupRef = useRef<THREE.Group>(null);

  // CRT screen glow
  const screenGlow = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#080805';
    ctx.fillRect(0, 0, 512, 384);
    // Subtle phosphor glow center
    const grad = ctx.createRadialGradient(256, 192, 0, 256, 192, 300);
    grad.addColorStop(0, 'rgba(255, 176, 0, 0.08)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 384);
    // Scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let y = 0; y < 384; y += 3) {
      ctx.fillRect(0, y, 512, 1);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <group ref={groupRef} position={[0.8, -0.4, -0.3]} rotation={[0, -0.15, 0]}>
      {/* Monitor stand */}
      <mesh position={[0, -0.35, 0]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.6]} />
        <meshStandardMaterial color={GUNMETAL_DARK} roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Monitor body */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[2.2, 1.6, 1.2]} />
        <meshStandardMaterial color={GUNMETAL} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Bezel */}
      <mesh position={[0, 0.1, 0.61]}>
        <boxGeometry args={[2.0, 1.4, 0.05]} />
        <meshStandardMaterial color={GUNMETAL_DARK} roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Screen */}
      <mesh position={[0, 0.1, 0.64]}>
        <planeGeometry args={[1.8, 1.2]} />
        <meshBasicMaterial map={screenGlow} />
      </mesh>

      {/* Screen glass curvature overlay */}
      <mesh position={[0, 0.1, 0.66]}>
        <planeGeometry args={[1.8, 1.2, 16, 16]} />
        <meshStandardMaterial
          color="#000000"
          transparent
          opacity={0.15}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* Vents */}
      {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => (
        <mesh key={i} position={[x, -0.6, 0.4]}>
          <boxGeometry args={[0.15, 0.03, 0.4]} />
          <meshStandardMaterial color="#151518" />
        </mesh>
      ))}

      {/* Manufacturer plate */}
      <mesh position={[0, -0.55, 0.61]}>
        <planeGeometry args={[0.6, 0.1]} />
        <meshBasicMaterial color="#1a1a1e" />
      </mesh>
    </group>
  );
}

// ─── DESK LAMP ───
function DeskLamp() {
  return (
    <group position={[-1.2, -0.5, 0.5]}>
      {/* Base */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.08, 16]} />
        <meshStandardMaterial color="#8a7a5a" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.1, 0.25, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.02, 0.025, 0.5, 8]} />
        <meshStandardMaterial color="#7a6a4a" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Shade */}
      <mesh position={[0.25, 0.45, 0]} rotation={[0, 0, 0.5]} castShadow>
        <coneGeometry args={[0.12, 0.2, 16, 1, true]} />
        <meshStandardMaterial color="#6a5a3a" roughness={0.4} metalness={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Light bulb glow */}
      <pointLight
        position={[0.25, 0.4, 0]}
        color={TUNGSTEN}
        intensity={3}
        distance={6}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
    </group>
  );
}

// ─── KEYBOARD ───
function Keyboard() {
  return (
    <group position={[0.8, -1.12, 0.8]} rotation={[0.1, -0.15, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.0, 0.04, 0.4]} />
        <meshStandardMaterial color="#3a3a3e" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Keys */}
      {Array.from({ length: 40 }).map((_, i) => {
        const row = Math.floor(i / 10);
        const col = i % 10;
        return (
          <mesh key={i} position={[(col - 4.5) * 0.09, 0.03, (row - 1.5) * 0.09]}>
            <boxGeometry args={[0.06, 0.03, 0.06]} />
            <meshStandardMaterial color="#2a2a2e" roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── NOTEBOOK ───
function Notebook() {
  return (
    <group position={[-0.5, -1.1, 0.6]} rotation={[0, 0.3, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.03, 0.55]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.9} />
      </mesh>
      {/* Pages */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.38, 0.01, 0.53]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.95} />
      </mesh>
    </group>
  );
}

// ─── COFFEE MUG ───
function CoffeeMug() {
  return (
    <group position={[-1.8, -1.05, 0.3]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.08, 0.07, 0.18, 16]} />
        <meshStandardMaterial color="#6a5a4a" roughness={0.7} />
      </mesh>
      {/* Handle */}
      <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.04, 0.012, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#6a5a4a" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ─── EVIDENCE ENVELOPE ───
function EvidenceEnvelope() {
  return (
    <group position={[1.8, -1.08, 0.4]} rotation={[0, -0.2, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.35, 0.015, 0.25]} />
        <meshStandardMaterial color="#c4b090" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─── ARCHIVAL CABINETS (background) ───
function ArchivalCabinets() {
  return (
    <group position={[-3.5, 0, -3]}>
      {Array.from({ length: 3 }).map((_, i) => (
        <group key={i} position={[i * 1.2, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.0, 3.5, 0.8]} />
            <meshStandardMaterial color="#2a2520" roughness={0.8} />
          </mesh>
          {/* Drawers */}
          {[0.8, 0.2, -0.4, -1.0].map((y, j) => (
            <mesh key={j} position={[0, y, 0.41]}>
              <boxGeometry args={[0.85, 0.35, 0.02]} />
              <meshStandardMaterial color="#3a3530" roughness={0.7} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ─── BOOKSHELF (background) ───
function Bookshelf() {
  return (
    <group position={[3, 0.5, -3.5]}>
      <mesh castShadow>
        <boxGeometry args={[2.5, 3.5, 0.6]} />
        <meshStandardMaterial color="#3a3028" roughness={0.85} />
      </mesh>
      {/* Books */}
      {Array.from({ length: 20 }).map((_, i) => {
        const row = Math.floor(i / 7);
        const col = i % 7;
        const colors = ['#4a3a2a', '#5a4a3a', '#3a2e20', '#6a5a4a', '#4a4030'];
        return (
          <mesh key={i} position={[(col - 3) * 0.3, 1.2 - row * 0.9, 0.35]}>
            <boxGeometry args={[0.08 + Math.random() * 0.04, 0.7, 0.5]} />
            <meshStandardMaterial color={colors[i % colors.length]} roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── WALL MAP ───
function WallMap() {
  return (
    <group position={[0, 1.5, -4.2]}>
      <mesh>
        <planeGeometry args={[3, 2]} />
        <meshStandardMaterial color="#d4c8a8" roughness={0.9} />
      </mesh>
      {/* Frame */}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[3.1, 2.1, 0.04]} />
        <meshStandardMaterial color="#3a3028" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── WINDOW WITH RAIN ───
function Window() {
  return (
    <group position={[4, 1, -2]} rotation={[0, -0.5, 0]}>
      {/* Window frame */}
      <mesh>
        <boxGeometry args={[1.5, 2, 0.1]} />
        <meshStandardMaterial color="#2a2520" roughness={0.8} />
      </mesh>
      {/* Glass */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[1.3, 1.8]} />
        <meshStandardMaterial
          color="#1a2030"
          roughness={0.1}
          metalness={0.1}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}

// ─── CAMERA CONTROLLER ───
function CameraController({ mousePos }: { mousePos: { x: number; y: number } }) {
  const { camera } = useThree();
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });

  useFrame(() => {
    targetRotation.current.x = (mousePos.y - 0.5) * 0.08;
    targetRotation.current.y = (mousePos.x - 0.5) * 0.06;

    currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.03;
    currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.03;

    camera.rotation.x = currentRotation.current.x;
    camera.rotation.y = currentRotation.current.y;
  });

  return null;
}

// ─── MAIN SCENE ───
export function BootScene({ mousePos }: { mousePos: { x: number; y: number } }) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.5, 3.5], fov: 50, near: 0.1, far: 50 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.8 }}
      style={{ position: 'absolute', inset: 0, background: '#0a0806' }}
    >
      <CameraController mousePos={mousePos} />

      {/* Ambient — very dim, just enough to see shapes */}
      <ambientLight intensity={0.08} color="#4a4a5a" />

      {/* CRT screen glow — cool amber on the desk/wall behind */}
      <pointLight
        position={[0.8, 0.2, -0.5]}
        color={PHOSPHOR_AMBER}
        intensity={0.8}
        distance={4}
        decay={2}
      />

      {/* Very soft fill from above — moonlight/ambient building */}
      <directionalLight
        position={[2, 5, 2]}
        intensity={0.15}
        color="#8a9aaa"
        castShadow
      />

      <Desk />
      <Monitor />
      <DeskLamp />
      <Keyboard />
      <Notebook />
      <CoffeeMug />
      <EvidenceEnvelope />
      <ArchivalCabinets />
      <Bookshelf />
      <WallMap />
      <Window />
      <DustParticles count={120} />

      {/* Room walls — barely visible */}
      <mesh position={[0, 1, -4.5]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#1a1815" roughness={0.95} />
      </mesh>
      <mesh position={[-5, 1, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#1a1815" roughness={0.95} />
      </mesh>
      <mesh position={[5, 1, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#1a1815" roughness={0.95} />
      </mesh>
      {/* Floor */}
      <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#151210" roughness={0.95} />
      </mesh>

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
        />
        <Vignette
          offset={0.3}
          darkness={0.7}
          eskil={false}
        />
        <Noise
          opacity={0.08}
        />
      </EffectComposer>
    </Canvas>
  );
}