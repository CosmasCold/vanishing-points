'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

// ─── PALETTE ───
const PHOSPHOR = '#ffb000';
const PHOSPHOR_DIM = '#8a6000';
const GREEN_OK = '#5a8a4a';
const AMBER_WARN = '#b8943a';
const IVORY = '#e8e0d0';

// ─── ASSET PATHS ───
const ASSETS = {
  crt: '/assets/models/crt/television_02_4k.glb',
  desk: '/assets/models/desk/metal_office_desk_4k.glb',
  lamp: '/assets/models/lamp/industrial_pipe_lamp_4k.glb',
  chair: '/assets/models/chair/GreenChair_01_4k.glb',
  notebook: '/assets/models/notebook/binder_notebook_4k.glb',
  cassette: '/assets/models/cassette-player/cassette_player_4k.glb',
  shelf: '/assets/models/bookshelf/Shelf_01_4k.glb',
  books: '/assets/models/books/book_encyclopedia_set_01_4k.glb',
  camera: '/assets/models/camera/Camera_01_4k.glb',
  hdri: '/assets/hdri/rainy-night/vignaioli_night_4k.exr',
};

// ─── PRELOAD ALL ASSETS ───
if (typeof window !== 'undefined') {
  useGLTF.preload(ASSETS.crt);
  useGLTF.preload(ASSETS.desk);
  useGLTF.preload(ASSETS.lamp);
  useGLTF.preload(ASSETS.chair);
  useGLTF.preload(ASSETS.notebook);
  useGLTF.preload(ASSETS.cassette);
  useGLTF.preload(ASSETS.shelf);
  useGLTF.preload(ASSETS.books);
  useGLTF.preload(ASSETS.camera);
}

// ─── DUST PARTICLES ───
function DustParticles({ count = 120 }) {
  const ref = useRef<THREE.Points>(null);
  const particles = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = Math.random() * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      vel[i * 3] = (Math.random() - 0.5) * 0.0008;
      vel[i * 3 + 1] = Math.random() * 0.0003;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.0005;
    }
    return { pos, vel };
  }, [count]);

  useFrame(() => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += particles.vel[i * 3];
      arr[i * 3 + 1] += particles.vel[i * 3 + 1];
      arr[i * 3 + 2] += particles.vel[i * 3 + 2];
      if (arr[i * 3 + 1] > 6) arr[i * 3 + 1] = 0;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={particles.pos} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#c4b8a0" transparent opacity={0.35} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ─── CRT SCREEN WITH CANVAS TEXT ───
function CRTScreen({ visibleCount, showPrompt, cursorOn }: { visibleCount: number; showPrompt: boolean; cursorOn: boolean }) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const LINES = useMemo(() => [
    { text: 'POWER RESTORED', type: 'system' },
    { text: '', type: 'spacer' },
    { text: 'Loading Archive Kernel...', type: 'info' },
    { text: '  [OK]  Kernel v4.2.1-stable', type: 'ok' },
    { text: '  [OK]  Memory banks 1–16', type: 'ok' },
    { text: '  [OK]  Magnetic drum array', type: 'ok' },
    { text: '', type: 'spacer' },
    { text: 'Initializing Atlas...', type: 'info' },
    { text: '  [OK]  Geodetic reference frame loaded', type: 'ok' },
    { text: '  [OK]  159 locations indexed', type: 'ok' },
    { text: '  [WARN]  Coordinate drift in sector 7-B', type: 'warn' },
    { text: '', type: 'spacer' },
    { text: 'Checking Integrity...', type: 'info' },
    { text: '  [OK]  Document repository', type: 'ok' },
    { text: '  [OK]  Evidence chain verified', type: 'ok' },
    { text: '  [OK]  BUNKER_7 relay stable', type: 'ok' },
    { text: '', type: 'spacer' },
    { text: 'Loading Investigations...', type: 'info' },
    { text: '  [OK]  3 active cases', type: 'ok' },
    { text: '  [OK]  1 pending review', type: 'ok' },
    { text: '', type: 'spacer' },
    { text: 'Synchronizing Evidence...', type: 'info' },
    { text: '  [OK]  Cross-reference matrix built', type: 'ok' },
    { text: '', type: 'spacer' },
    { text: 'Loading Local Cache...', type: 'info' },
    { text: '  [OK]  847 artifacts recovered', type: 'ok' },
    { text: '', type: 'spacer' },
    { text: 'Dust Index: STABLE', type: 'ok' },
    { text: '', type: 'spacer' },
    { text: 'Good evening, Investigator.', type: 'final' },
  ], []);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    canvasRef.current = canvas;
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    setTexture(tex);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const tex = texture;
    if (!canvas || !tex) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a06';
    ctx.fillRect(0, 0, 1024, 768);

    const grad = ctx.createRadialGradient(512, 384, 0, 512, 384, 500);
    grad.addColorStop(0, 'rgba(255, 176, 0, 0.04)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 768);

    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < 768; y += 4) {
      ctx.fillRect(0, y, 1024, 2);
    }

    ctx.font = '22px "Courier New", monospace';
    ctx.textBaseline = 'top';
    const lineHeight = 32;
    const startY = 60;

    for (let i = 0; i < visibleCount && i < LINES.length; i++) {
      const line = LINES[i];
      const isLast = i === visibleCount - 1;
      let color = PHOSPHOR;
      if (line.type === 'ok') color = GREEN_OK;
      if (line.type === 'warn') color = AMBER_WARN;
      if (line.type === 'final') color = IVORY;

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = line.type === 'final' ? 12 : 6;
      ctx.fillText(line.text, 60, startY + i * lineHeight);
      ctx.shadowBlur = 0;

      if (isLast && !showPrompt && cursorOn) {
        ctx.fillStyle = color;
        ctx.fillRect(60 + ctx.measureText(line.text).width + 4, startY + i * lineHeight + 2, 12, 22);
      }
    }

    if (showPrompt) {
      const promptY = startY + LINES.length * lineHeight + 20;
      ctx.fillStyle = PHOSPHOR_DIM;
      ctx.fillText('Press ENTER to access the Archive', 60, promptY);
      if (cursorOn) {
        ctx.fillRect(60 + ctx.measureText('Press ENTER to access the Archive').width + 4, promptY + 2, 12, 22);
      }
    }

    tex.needsUpdate = true;
  }, [visibleCount, showPrompt, cursorOn, texture, LINES]);

  if (!texture) return null;

  return (
    <mesh position={[0, 0.38, 0.18]}>
      <planeGeometry args={[1.1, 0.82]} />
      <meshStandardMaterial
        map={texture}
        emissive={new THREE.Color(PHOSPHOR)}
        emissiveMap={texture}
        emissiveIntensity={0.4}
        roughness={0.2}
        metalness={0.1}
        transparent
      />
    </mesh>
  );
}

// ─── LOADED MODELS ───
function DeskModel() {
  const { scene } = useGLTF(ASSETS.desk);
  return <primitive object={scene.clone()} position={[0, -1.1, 0]} scale={1.2} />;
}

function CRTModel({ visibleCount, showPrompt, cursorOn }: { visibleCount: number; showPrompt: boolean; cursorOn: boolean }) {
  const { scene } = useGLTF(ASSETS.crt);
  return (
    <group position={[0.6, -0.15, -0.2]} rotation={[0, -0.12, 0]} scale={0.9}>
      <primitive object={scene.clone()} />
      <CRTScreen visibleCount={visibleCount} showPrompt={showPrompt} cursorOn={cursorOn} />
      <pointLight position={[0, 0.4, 0.3]} color={new THREE.Color(PHOSPHOR)} intensity={0.8} distance={3} decay={2} />
    </group>
  );
}

function LampModel() {
  const { scene } = useGLTF(ASSETS.lamp);
  return (
    <group position={[-1.0, -0.9, 0.4]} rotation={[0, 0.3, 0]} scale={0.7}>
      <primitive object={scene.clone()} />
      <pointLight position={[0.2, 0.6, 0]} color={new THREE.Color('#ffecd2')} intensity={5} distance={5} decay={2} castShadow />
    </group>
  );
}

function ChairModel() {
  const { scene } = useGLTF(ASSETS.chair);
  return <primitive object={scene.clone()} position={[-0.3, -1.1, 1.2]} rotation={[0, -0.4, 0]} scale={0.9} />;
}

function NotebookModel() {
  const { scene } = useGLTF(ASSETS.notebook);
  return <primitive object={scene.clone()} position={[-0.6, -1.05, 0.5]} rotation={[0, 0.5, 0]} scale={0.4} />;
}

function CassetteModel() {
  const { scene } = useGLTF(ASSETS.cassette);
  return <primitive object={scene.clone()} position={[1.2, -1.02, 0.3]} rotation={[0, -0.3, 0]} scale={0.3} />;
}

function ShelfModel() {
  const { scene } = useGLTF(ASSETS.shelf);
  return <primitive object={scene.clone()} position={[3.5, 0, -3]} rotation={[0, -0.2, 0]} scale={1.5} />;
}

function BooksModel() {
  const { scene } = useGLTF(ASSETS.books);
  return <primitive object={scene.clone()} position={[3.2, 0.85, -2.8]} rotation={[0, 0.1, 0]} scale={0.6} />;
}

function CameraModel() {
  const { scene } = useGLTF(ASSETS.camera);
  return <primitive object={scene.clone()} position={[-0.3, -1.02, 0.1]} rotation={[0, 0.8, 0]} scale={0.25} />;
}

// ─── ROOM SHELL ───
function Room() {
  return (
    <group>
      <mesh position={[0, 1.5, -4.5]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#1a1815" roughness={0.95} />
      </mesh>
      <mesh position={[-5, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#1a1815" roughness={0.95} />
      </mesh>
      <mesh position={[5, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#1a1815" roughness={0.95} />
      </mesh>
      <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#151210" roughness={0.95} />
      </mesh>
    </group>
  );
}

// ─── CAMERA ANIMATION ───
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function CameraRig() {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0.5, 0.3, 2.8));
  const startPos = useRef(new THREE.Vector3(0, 2.5, 6));
  const progress = useRef(0);

  useFrame((state, delta) => {
    progress.current = Math.min(progress.current + delta * 0.15, 1);
    const t = easeInOutCubic(progress.current);
    camera.position.lerpVectors(startPos.current, targetPos.current, t);
    camera.lookAt(0.5, 0, 0);
  });

  return null;
}

// ─── MAIN SCENE ───
export function BootScene({ visibleCount, showPrompt, cursorOn }: { visibleCount: number; showPrompt: boolean; cursorOn: boolean }) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2.5, 6], fov: 45, near: 0.1, far: 50 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.85 }}
      style={{ position: 'absolute', inset: 0, background: '#0a0806' }}
    >
      <CameraRig />

      <Environment files={ASSETS.hdri} background={false} />

      <ambientLight intensity={0.08} color="#4a4a5a" />
      <directionalLight position={[3, 4, 2]} intensity={0.15} color="#8a9aaa" castShadow />

      <DeskModel />
      <CRTModel visibleCount={visibleCount} showPrompt={showPrompt} cursorOn={cursorOn} />
      <LampModel />
      <ChairModel />
      <NotebookModel />
      <CassetteModel />
      <ShelfModel />
      <BooksModel />
      <CameraModel />
      <Room />
      <DustParticles />

      <EffectComposer>
        <Bloom intensity={0.35} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
        <Vignette offset={0.3} darkness={0.7} eskil={false} />
        <Noise opacity={0.06} />
      </EffectComposer>
    </Canvas>
  );
}