'use client';

import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, useProgress, useGLTF } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ───────────────────────────────────────────
   SCENE OBJECT REGISTRY
   Adjust position/scale if your GLB origins differ
   ─────────────────────────────────────────── */
const SCENE_OBJECTS = [
  { id: 'desk',     path: '/assets/models/desk/metal_office_desk_4k.glb',     pos: [0, -0.8, 0],    rot: [0, 0, 0],       scale: 1.2 },
  { id: 'crt',      path: '/assets/models/crt/television_02_4k.glb',          pos: [0.35, 0.05, -0.1], rot: [0, -0.15, 0],  scale: 0.9 },
  { id: 'lamp',     path: '/assets/models/lamp/industrial_pipe_lamp_4k.glb',  pos: [-0.6, 0.1, -0.2], rot: [0, 0.3, 0],    scale: 0.8 },
  { id: 'chair',    path: '/assets/models/chair/GreenChair_01_4k.glb',        pos: [0, -0.9, 1.2],    rot: [0, Math.PI, 0], scale: 1.0 },
  { id: 'notebook', path: '/assets/models/notebook/binder_notebook_4k.glb',   pos: [0.7, 0.02, 0.3],  rot: [0, -0.4, 0],   scale: 0.6 },
  { id: 'cassette', path: '/assets/models/cassette-player/cassette_player_4k.glb', pos: [-0.3, 0.02, 0.35], rot: [0, 0.2, 0], scale: 0.5 },
  { id: 'shelf',    path: '/assets/models/bookshelf/Shelf_01_4k.glb',         pos: [-2.2, -0.5, -2],  rot: [0, 0.4, 0],    scale: 1.4 },
  { id: 'books',    path: '/assets/models/books/book_encyclopedia_set_01_4k.glb', pos: [-2.0, 0.6, -1.8], rot: [0, 0.3, 0],   scale: 0.7 },
];

/* ───────────────────────────────────────────
   MODEL LOADER
   ─────────────────────────────────────────── */
function Model({ path, position, rotation, scale }: {
  path: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}) {
  const { scene } = useGLTF(path);
  const cloned = useMemo(() => scene.clone(), [scene]);
  return (
    <primitive
      object={cloned}
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow
      receiveShadow
    />
  );
}

/* ───────────────────────────────────────────
   DUST PARTICLES
   ─────────────────────────────────────────── */
function DustParticles({ count = 120 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 3,
        (Math.random() - 0.5) * 6
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.002,
        Math.random() * 0.001 + 0.0005,
        (Math.random() - 0.5) * 0.002
      ),
      scale: Math.random() * 0.015 + 0.005,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    particles.forEach((p, i) => {
      p.position.add(p.velocity);
      p.position.y += Math.sin(Date.now() * 0.001 + p.phase) * 0.0002;
      if (p.position.y > 3) p.position.y = 0;
      dummy.position.copy(p.position);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color="#d4c5a9"
        transparent
        opacity={0.25}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

/* ───────────────────────────────────────────
   CRT SCREEN TEXT (drei Html with transform)
   ─────────────────────────────────────────── */
function CRTScreenText({
  visibleCount,
  showPrompt,
  cursorOn,
}: {
  visibleCount: number;
  showPrompt: boolean;
  cursorOn: boolean;
}) {
  const bootLines = [
    { text: 'POWER RESTORED', color: '#6a9a5a' },
    { text: 'Loading Archive Kernel...', color: '#8a6000' },
    { text: 'Initializing Atlas...', color: '#8a6000' },
    { text: 'Checking Integrity...', color: '#8a6000' },
    { text: 'Loading Investigations...', color: '#8a6000' },
    { text: 'Synchronizing Evidence...', color: '#8a6000' },
    { text: 'Loading Local Cache...', color: '#8a6000' },
    { text: 'Dust Index: Stable', color: '#6a9a5a' },
    { text: 'Good evening, Investigator.', color: '#e8e0d0' },
  ];

  return (
    <Html
      transform
      occlude
      position={[0.35, 0.18, -0.05]}
      rotation={[0, -0.15, 0]}
      scale={0.18}
      style={{
        width: '420px',
        height: '320px',
        pointerEvents: 'none',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#ffb000',
        textShadow: '0 0 8px rgba(255,176,0,0.6), 0 0 16px rgba(255,176,0,0.2)',
        whiteSpace: 'pre-wrap',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          background: 'rgba(10,8,4,0.85)',
          padding: '24px',
          borderRadius: '2px',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)',
        }}
      >
        {bootLines.slice(0, visibleCount).map((line, i) => (
          <div
            key={i}
            style={{
              color: line.color,
              marginBottom: '6px',
              opacity: 0,
              animation: `phosphorFadeIn 80ms ease forwards`,
              animationDelay: `${i * 50}ms`,
            }}
          >
            {line.text}
            {i === visibleCount - 1 && cursorOn && (
              <span style={{ display: 'inline-block', width: '8px', height: '14px', background: line.color, marginLeft: '4px', verticalAlign: 'middle' }} />
            )}
          </div>
        ))}
        {showPrompt && (
          <div
            style={{
              marginTop: '16px',
              color: '#ffb000',
              fontSize: '12px',
              letterSpacing: '2px',
              textAlign: 'center',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            [ PRESS ENTER ]
          </div>
        )}
        <style>{`
          @keyframes phosphorFadeIn {
            from { opacity: 0; transform: translateX(4px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </Html>
  );
}

/* ───────────────────────────────────────────
   CAMERA CONTROLLER
   Smooth dolly from wide room to seated position
   ─────────────────────────────────────────── */
function CameraController({ active }: { active: boolean }) {
  const { camera } = useThree();
  const targetPos = useMemo(() => new THREE.Vector3(0.5, 0.3, 2.8), []);
  const startPos = useMemo(() => new THREE.Vector3(0, 2.5, 6), []);
  const progress = useRef(0);

  useEffect(() => {
    camera.position.copy(startPos);
    camera.lookAt(0, 0, 0);
  }, [camera, startPos]);

  useFrame((_, delta) => {
    if (!active) return;
    progress.current = Math.min(progress.current + delta * 0.12, 1);
    const t = progress.current;
    // Cubic ease-in-out
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    camera.position.lerpVectors(startPos, targetPos, ease);
    camera.lookAt(0.2, 0.1, 0);
  });

  return null;
}

/* ───────────────────────────────────────────
   LIGHTING SETUP
   Three-point: tungsten desk lamp + CRT glow + cool fill
   ─────────────────────────────────────────── */
function Lighting() {
  return (
    <>
      {/* Key light — warm tungsten desk lamp */}
      <pointLight
        position={[-0.6, 0.8, -0.2]}
        color="#ffaa55"
        intensity={2.5}
        distance={4}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* Fill — cool window/rain light */}
      <pointLight
        position={[2, 1.5, -1]}
        color="#445566"
        intensity={0.6}
        distance={5}
        decay={2}
      />
      {/* Rim — CRT phosphor glow */}
      <pointLight
        position={[0.35, 0.3, 0.2]}
        color="#ffb000"
        intensity={1.2}
        distance={2}
        decay={2}
      />
      {/* Ambient — barely there */}
      <ambientLight intensity={0.08} color="#1a1a2e" />
      {/* Directional — moonlight through window */}
      <directionalLight
        position={[3, 2, -2]}
        color="#667788"
        intensity={0.3}
        castShadow
      />
    </>
  );
}

/* ───────────────────────────────────────────
   LOADING SCREEN
   ─────────────────────────────────────────── */
function LoadingScreen() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div
        style={{
          color: '#8a6000',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '14px',
          letterSpacing: '2px',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '12px' }}>ARCHIVE SYSTEM LOADING</div>
        <div style={{ width: '200px', height: '2px', background: '#1a1a1e', margin: '0 auto' }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#ffb000',
              transition: 'width 0.2s ease',
              boxShadow: '0 0 8px rgba(255,176,0,0.4)',
            }}
          />
        </div>
        <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.6 }}>
          {Math.round(progress)}%
        </div>
      </div>
    </Html>
  );
}

/* ───────────────────────────────────────────
   SCENE COMPOSITION
   ─────────────────────────────────────────── */
function Scene({
  visibleCount,
  showPrompt,
  cursorOn,
  cameraActive,
}: {
  visibleCount: number;
  showPrompt: boolean;
  cursorOn: boolean;
  cameraActive: boolean;
}) {
  return (
    <>
      <CameraController active={cameraActive} />
      <Lighting />
      <fog attach="fog" args={['#0a0908', 3, 12]} />

      {/* HDRI fallback — subtle ambient bounce */}
      <Environment
        files="/assets/hdri/rainy-night/vignaioli_night_4k.exr"
        preset={undefined}
        background={false}
        blur={0.8}
      />

      {/* Models */}
      {SCENE_OBJECTS.map((obj) => (
        <Model
          key={obj.id}
          path={obj.path}
          position={obj.pos as [number, number, number]}
          rotation={obj.rot as [number, number, number]}
          scale={obj.scale}
        />
      ))}

      {/* CRT Screen Text */}
      <CRTScreenText
        visibleCount={visibleCount}
        showPrompt={showPrompt}
        cursorOn={cursorOn}
      />

      {/* Dust */}
      <DustParticles count={120} />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={0.4}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette
          offset={0.3}
          darkness={0.7}
          eskil={false}
        />
        <Noise
          opacity={0.04}
          premultiply
        />
      </EffectComposer>
    </>
  );
}

/* ───────────────────────────────────────────
   MAIN EXPORT
   ─────────────────────────────────────────── */
export default function BootScene({
  visibleCount,
  showPrompt,
  cursorOn,
  cameraActive,
}: {
  visibleCount: number;
  showPrompt: boolean;
  cursorOn: boolean;
  cameraActive: boolean;
}) {
  return (
    <Canvas
      shadows
      camera={{ fov: 45, near: 0.1, far: 50, position: [0, 2.5, 6] }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.9,
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#0a0908',
      }}
    >
      <Suspense fallback={<LoadingScreen />}>
        <Scene
          visibleCount={visibleCount}
          showPrompt={showPrompt}
          cursorOn={cursorOn}
          cameraActive={cameraActive}
        />
      </Suspense>
    </Canvas>
  );
}