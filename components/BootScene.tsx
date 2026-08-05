"use client";

import { useRef, useMemo, useState, useEffect, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, useProgress, useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════
   SCENE OBJECT REGISTRY
   All paths map to public/assets/...
   Adjust position / rotation / scale if your GLB origins differ.
   ═══════════════════════════════════════════════════════════════ */
const SCENE_OBJECTS: {
  id: string;
  path: string;
  pos: [number, number, number];
  rot: [number, number, number];
  scale: number | [number, number, number];
}[] = [
  // ── Desk (centerpiece) ──
  {
    id: "desk",
    path: "/assets/models/desk/simple_office_desk_free.glb",
    pos: [0, -0.55, 0],
    rot: [0, 0, 0],
    scale: 1.0,
  },
  // ── Monitor on desk ──
  {
    id: "monitor",
    path: "/assets/models/crt/monitor.glb",
    pos: [0, 0.02, -0.15],
    rot: [0, 0, 0],
    scale: 1.0,
  },
  // ── Antique lamp on desk ──
  {
    id: "lamp",
    path: "/assets/models/lamp/antique_desk_lamp_-_game_model.glb",
    pos: [-0.55, 0.02, -0.1],
    rot: [0, 0.25, 0],
    scale: 0.9,
  },
  // ── Chair behind desk (camera POV sees chair back) ──
  {
    id: "chair",
    path: "/assets/models/chair/GreenChair_01_4k.glb",
    pos: [0, -0.45, 0.85],
    rot: [0, Math.PI, 0],
    scale: 0.5,
  },
  // ── Rug under desk ──
  {
    id: "rug",
    path: "/assets/models/rug/yellow_and_red_rug.glb",
    pos: [0, -0.58, 0.3],
    rot: [-Math.PI / 2, 0, 0],
    scale: 1.2,
  },
  // ── Bookshelf against left wall ──
  {
    id: "bookshelf",
    path: "/assets/models/bookshelf/old_bookshelf.glb",
    pos: [-2.4, -0.35, -1.2],
    rot: [0, 0.15, 0],
    scale: 1.1,
  },
  // ── Filing cabinets against right wall ──
  {
    id: "cabinets",
    path: "/assets/models/filing-cabinet/pair_of_filling_cabiinets.glb",
    pos: [2.3, -0.4, -1.0],
    rot: [0, -0.2, 0],
    scale: 1.0,
  },
  // ── Window behind desk ──
  {
    id: "window",
    path: "/assets/models/window/source/Untitled.glb",
    pos: [0, 0.9, -2.0],
    rot: [0, 0, 0],
    scale: 1.4,
  },
  // ── Wall clock ──
  {
    id: "clock",
    path: "/assets/models/clock/wall_clock.glb",
    pos: [1.3, 1.6, -2.35],
    rot: [0, -0.3, 0],
    scale: 0.35,
  },
  // ── Notebook on desk ──
  {
    id: "notebook",
    path: "/assets/models/notebook/binder_notebook_4k.glb",
    pos: [0.6, 0.02, 0.2],
    rot: [0, -0.4, 0],
    scale: 0.5,
  },
  // ── Cassette player on desk ──
  {
    id: "cassette",
    path: "/assets/models/cassette-player/cassette_player_4k.glb",
    pos: [-0.25, 0.02, 0.25],
    rot: [0, 0.15, 0],
    scale: 0.45,
  },
  // ── Books on desk ──
  {
    id: "books",
    path: "/assets/models/books/book_encyclopedia_set_01_4k.glb",
    pos: [0.45, 0.02, -0.05],
    rot: [0, 0.2, 0],
    scale: 0.55,
  },
];

/* ── CRT text offset relative to monitor position ──
   Tweak these if the text doesn't align with your monitor screen */
const CRT_TEXT_POS: [number, number, number] = [0, 0.18, -0.02];
const CRT_TEXT_ROT: [number, number, number] = [0, 0, 0];
const CRT_TEXT_SCALE = 0.14;

/* ═══════════════════════════════════════════════════════════════
   PROCEDURAL TEXTURES
   ═══════════════════════════════════════════════════════════════ */
function createBrickTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Mortar
  ctx.fillStyle = "#2e2a26";
  ctx.fillRect(0, 0, 512, 512);

  const brickW = 56;
  const brickH = 26;
  const gap = 3;

  for (let row = 0; row < 22; row++) {
    const offset = (row % 2) * (brickW / 2);
    for (let col = -1; col < 12; col++) {
      const x = col * (brickW + gap) + offset;
      const y = row * (brickH + gap);

      const h = 12 + Math.random() * 8;
      const s = 18 + Math.random() * 12;
      const l = 16 + Math.random() * 10;
      ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
      ctx.fillRect(x, y, brickW, brickH);

      // Grime overlay
      ctx.fillStyle = `rgba(10,8,6,${0.15 + Math.random() * 0.25})`;
      ctx.fillRect(x, y, brickW, brickH);

      // Edge wear
      ctx.strokeStyle = `rgba(0,0,0,0.3)`;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, brickW, brickH);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createDustTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(212, 197, 169, 0.9)");
  grad.addColorStop(0.4, "rgba(212, 197, 169, 0.3)");
  grad.addColorStop(1, "rgba(212, 197, 169, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ═══════════════════════════════════════════════════════════════
   MODEL LOADER
   ═══════════════════════════════════════════════════════════════ */
function Model({ path, position, rotation, scale }: {
  path: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number | [number, number, number];
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

/* ═══════════════════════════════════════════════════════════════
   ROOM ARCHITECTURE
   ═══════════════════════════════════════════════════════════════ */
function BrickWall() {
  const texture = useMemo(() => createBrickTexture(), []);
  return (
    <mesh position={[0, 0.8, -2.6]} receiveShadow>
      <planeGeometry args={[10, 5]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.92}
        metalness={0.02}
      />
    </mesh>
  );
}

function Floor() {
  return (
    <mesh position={[0, -0.62, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[14, 14]} />
      <meshStandardMaterial
        color="#161412"
        roughness={0.95}
        metalness={0.0}
      />
    </mesh>
  );
}

function LeftWall() {
  return (
    <mesh position={[-3.5, 0.8, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
      <planeGeometry args={[8, 5]} />
      <meshStandardMaterial color="#1e1c1a" roughness={0.9} metalness={0.02} />
    </mesh>
  );
}

function RightWall() {
  return (
    <mesh position={[3.5, 0.8, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
      <planeGeometry args={[8, 5]} />
      <meshStandardMaterial color="#1e1c1a" roughness={0.9} metalness={0.02} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DUST PARTICLES (soft, circular, additive)
   ═══════════════════════════════════════════════════════════════ */
function DustParticles({ count = 180 }) {
  const pointsRef = useRef<THREE.Points>(null);
  const texture = useMemo(() => createDustTexture(), []);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel: { x: number; y: number; z: number; phase: number }[] = [];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = Math.random() * 4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      vel.push({
        x: (Math.random() - 0.5) * 0.0008,
        y: Math.random() * 0.0004 + 0.00015,
        z: (Math.random() - 0.5) * 0.0008,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return [pos, vel];
  }, [count]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const arr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const t = Date.now() * 0.0005;
    for (let i = 0; i < count; i++) {
      const v = velocities[i];
      arr[i * 3] += v.x + Math.sin(t + v.phase) * 0.00008;
      arr[i * 3 + 1] += v.y;
      arr[i * 3 + 2] += v.z + Math.cos(t * 0.7 + v.phase) * 0.00008;

      if (arr[i * 3 + 1] > 4) arr[i * 3 + 1] = 0;
      if (arr[i * 3] > 4) arr[i * 3] = -4;
      if (arr[i * 3] < -4) arr[i * 3] = 4;
      if (arr[i * 3 + 2] > 4) arr[i * 3 + 2] = -4;
      if (arr[i * 3 + 2] < -4) arr[i * 3 + 2] = 4;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        map={texture}
        transparent
        opacity={0.35}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        color="#d4c5a9"
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CRT SCREEN TEXT (drei Html, locked to monitor)
   ═══════════════════════════════════════════════════════════════ */
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
    { text: "POWER RESTORED", color: "#6a9a5a" },
    { text: "Loading Archive Kernel...", color: "#8a6000" },
    { text: "Initializing Atlas...", color: "#8a6000" },
    { text: "Checking Integrity...", color: "#8a6000" },
    { text: "Loading Investigations...", color: "#8a6000" },
    { text: "Synchronizing Evidence...", color: "#8a6000" },
    { text: "Loading Local Cache...", color: "#8a6000" },
    { text: "Dust Index: Stable", color: "#6a9a5a" },
    { text: "Good evening, Investigator.", color: "#e8e0d0" },
  ];

  return (
    <Html
      transform
      occlude={false}
      position={CRT_TEXT_POS}
      rotation={CRT_TEXT_ROT}
      scale={CRT_TEXT_SCALE}
      style={{
        width: "480px",
        height: "360px",
        pointerEvents: "none",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "13px",
        lineHeight: "1.7",
        color: "#ffb000",
        textShadow: "0 0 6px rgba(255,176,0,0.5), 0 0 14px rgba(255,176,0,0.15)",
        whiteSpace: "pre-wrap",
        userSelect: "none",
      }}
    >
      <div
        style={{
          background: "rgba(8,6,3,0.88)",
          padding: "28px",
          borderRadius: "2px",
          boxShadow: "inset 0 0 50px rgba(0,0,0,0.9)",
        }}
      >
        {bootLines.slice(0, visibleCount).map((line, i) => (
          <div
            key={i}
            style={{
              color: line.color,
              marginBottom: "5px",
              opacity: 0,
              animation: `phosphorIn 70ms ease forwards`,
              animationDelay: `${i * 40}ms`,
            }}
          >
            {line.text}
            {i === visibleCount - 1 && cursorOn && (
              <span
                style={{
                  display: "inline-block",
                  width: "7px",
                  height: "13px",
                  background: line.color,
                  marginLeft: "4px",
                  verticalAlign: "middle",
                }}
              />
            )}
          </div>
        ))}
        {showPrompt && (
          <div
            style={{
              marginTop: "18px",
              color: "#ffb000",
              fontSize: "11px",
              letterSpacing: "2.5px",
              textAlign: "center",
              animation: "pulsePrompt 2.2s ease-in-out infinite",
            }}
          >
            [ PRESS ENTER ]
          </div>
        )}
        <style>{`
          @keyframes phosphorIn {
            from { opacity: 0; transform: translateX(3px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes pulsePrompt {
            0%, 100% { opacity: 0.35; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </Html>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CAMERA CONTROLLER
   ═══════════════════════════════════════════════════════════════ */
function CameraController({ active }: { active: boolean }) {
  const { camera } = useThree();
  const startPos = useMemo(() => new THREE.Vector3(0, 2.2, 7), []);
  const endPos = useMemo(() => new THREE.Vector3(0.4, 0.25, 3.2), []);
  const progress = useRef(0);

  useEffect(() => {
    camera.position.copy(startPos);
    camera.lookAt(0.2, 0, 0);
  }, [camera, startPos]);

  useFrame((_, delta) => {
    if (!active) return;
    progress.current = Math.min(progress.current + delta * 0.1, 1);
    const t = progress.current;
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    camera.position.lerpVectors(startPos, endPos, ease);
    camera.lookAt(0.15, 0.05, -0.3);
  });

  return null;
}

/* ═══════════════════════════════════════════════════════════════
   LIGHTING
   ═══════════════════════════════════════════════════════════════ */
function Lighting() {
  return (
    <>
      {/* Key — warm tungsten desk lamp */}
      <pointLight
        position={[-0.55, 0.7, -0.1]}
        color="#ffaa55"
        intensity={1.8}
        distance={4}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.001}
      />
      {/* Fill — cool window light (rain/moon) */}
      <pointLight
        position={[0, 1.4, -1.6]}
        color="#556677"
        intensity={0.5}
        distance={5}
        decay={2}
      />
      {/* Rim — CRT phosphor glow */}
      <pointLight
        position={[0, 0.25, 0.1]}
        color="#ffb000"
        intensity={0.8}
        distance={1.8}
        decay={2}
      />
      {/* Ambient — barely there */}
      <ambientLight intensity={0.06} color="#1a1a2e" />
      {/* Directional — moonlight through window */}
      <directionalLight
        position={[2, 3, -3]}
        color="#667788"
        intensity={0.25}
        castShadow
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LOADING SCREEN (inside Canvas)
   ═══════════════════════════════════════════════════════════════ */
function LoadingScreen() {
  const { progress, active } = useProgress();
  const bootSteps = [
    "> Initializing Archive kernel...",
    "> Mounting asset volumes...",
    "> Verifying geometry integrity...",
    "> Loading texture banks...",
    "> Synchronizing scene graph...",
    "> Calibrating render pipeline...",
  ];

  const visibleSteps = Math.min(
    Math.floor((progress / 100) * bootSteps.length) + 1,
    bootSteps.length
  );

  return (
    <Html center zIndexRange={[100, 0]}>
      <div
        style={{
          color: "#8a6000",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "13px",
          letterSpacing: "1.5px",
          textAlign: "left",
          width: "380px",
          lineHeight: "1.8",
        }}
      >
        <div style={{ marginBottom: "16px", color: "#ffb000", fontSize: "11px", letterSpacing: "3px" }}>
          ARCHIVE TERMINAL
        </div>
        <div style={{ width: "100%", height: "1px", background: "#2a2520", marginBottom: "16px" }} />
        {bootSteps.slice(0, visibleSteps).map((step, i) => (
          <div key={i} style={{ opacity: i === visibleSteps - 1 && active ? 0.7 : 1 }}>
            {step}
            <span style={{ color: "#6a9a5a", marginLeft: "12px" }}>[OK]</span>
          </div>
        ))}
        <div style={{ marginTop: "20px" }}>
          <div style={{ width: "100%", height: "2px", background: "#1a1815" }}>
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#ffb000",
                transition: "width 0.3s ease",
                boxShadow: "0 0 6px rgba(255,176,0,0.3)",
              }}
            />
          </div>
          <div style={{ marginTop: "8px", fontSize: "10px", opacity: 0.5, textAlign: "right" }}>
            {Math.round(progress)}%
          </div>
        </div>
      </div>
    </Html>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCENE READY TRACKER
   Notifies parent when all Suspense assets have loaded.
   ═══════════════════════════════════════════════════════════════ */
function SceneReadyTracker({ onReady }: { onReady: () => void }) {
  const { active } = useProgress();
  useEffect(() => {
    if (!active) {
      const t = setTimeout(onReady, 400);
      return () => clearTimeout(t);
    }
  }, [active, onReady]);
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   SCENE COMPOSITION
   ═══════════════════════════════════════════════════════════════ */
function Scene({
  visibleCount,
  showPrompt,
  cursorOn,
  cameraActive,
  onReady,
}: {
  visibleCount: number;
  showPrompt: boolean;
  cursorOn: boolean;
  cameraActive: boolean;
  onReady: () => void;
}) {
  return (
    <>
      <SceneReadyTracker onReady={onReady} />
      <CameraController active={cameraActive} />
      <Lighting />
      <fog attach="fog" args={["#0a0908", 4, 14]} />

      {/* HDRI — subtle ambient bounce, non-blocking */}
      <Environment
        files="/assets/hdri/rainy-night/vignaioli_night_4k.exr"
        background={false}
        blur={0.8}
      />

      {/* Room architecture */}
      <BrickWall />
      <Floor />
      <LeftWall />
      <RightWall />

      {/* Props */}
      {SCENE_OBJECTS.map((obj) => (
        <Model
          key={obj.id}
          path={obj.path}
          position={obj.pos}
          rotation={obj.rot}
          scale={obj.scale}
        />
      ))}

      {/* CRT text on monitor */}
      <CRTScreenText
        visibleCount={visibleCount}
        showPrompt={showPrompt}
        cursorOn={cursorOn}
      />

      {/* Atmosphere */}
      <DustParticles count={180} />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom intensity={0.35} luminanceThreshold={0.25} luminanceSmoothing={0.9} mipmapBlur />
        <Vignette offset={0.35} darkness={0.65} eskil={false} />
        <Noise opacity={0.035} premultiply />
      </EffectComposer>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════ */
export default function BootScene({
  visibleCount,
  showPrompt,
  cursorOn,
  cameraActive,
  onReady,
}: {
  visibleCount: number;
  showPrompt: boolean;
  cursorOn: boolean;
  cameraActive: boolean;
  onReady: () => void;
}) {
  return (
    <Canvas
      shadows
      camera={{ fov: 40, near: 0.1, far: 50, position: [0, 2.2, 7] }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.85,
      }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "#0a0908",
      }}
    >
      <Suspense fallback={<LoadingScreen />}>
        <Scene
          visibleCount={visibleCount}
          showPrompt={showPrompt}
          cursorOn={cursorOn}
          cameraActive={cameraActive}
          onReady={onReady}
        />
      </Suspense>
    </Canvas>
  );
}