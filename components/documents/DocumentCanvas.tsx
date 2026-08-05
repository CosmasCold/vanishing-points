'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { DocumentArtifact } from '@/types/documents';
import { useDocumentStore } from '@/state/documentStore';
import { colors } from '@/styles/theme';

// ─── PAPER MESH ───

interface PaperMeshProps {
  doc: DocumentArtifact;
  corruptionIntensity: number;
  onClose: () => void;
}

const PaperMesh: React.FC<PaperMeshProps> = ({ doc, corruptionIntensity, onClose }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const { viewport, pointer } = useThree();

  // Procedural paper normal map via canvas
  const paperTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Base paper color
    ctx.fillStyle = '#f5f0e8';
    ctx.fillRect(0, 0, 512, 512);
    
    // Add grain
    for (let i = 0; i < 50000; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.03})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
    }
    
    // Fold marks
    if (doc.foldMarks) {
      for (let i = 0; i < doc.foldMarks; i++) {
        const y = (512 / (doc.foldMarks + 1)) * (i + 1);
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }
    }
    
    // Coffee stain
    if (doc.coffeeStain) {
      ctx.fillStyle = 'rgba(101, 67, 33, 0.06)';
      ctx.beginPath();
      ctx.arc(400, 100, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(101, 67, 33, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(400, 100, 38, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Burn marks for corrupted docs
    if (doc.corruptionLevel > 0.3) {
      const burnCount = Math.floor(doc.corruptionLevel * 5);
      for (let i = 0; i < burnCount; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = 10 + Math.random() * 30;
        ctx.fillStyle = 'rgba(30, 20, 10, 0.15)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }, [doc.foldMarks, doc.coffeeStain, doc.corruptionLevel]);

  // Custom shader material for corruption effects
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: paperTexture },
        uCorruption: { value: doc.corruptionLevel + corruptionIntensity * 0.3 },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(512, 512) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float uCorruption;
        uniform float uTime;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Paper refuses to lie flat when corrupted
          float warp = sin(pos.x * 3.0 + uTime * 0.5) * uCorruption * 0.02;
          warp += sin(pos.y * 2.0 + uTime * 0.3) * uCorruption * 0.015;
          pos.z += warp;
          
          vPosition = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uCorruption;
        uniform float uTime;
        uniform vec2 uResolution;
        varying vec2 vUv;
        
        // Pseudo-random
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        // Noise
        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
        
        void main() {
          vec2 uv = vUv;
          
          // Chromatic aberration for corrupted docs
          float aberration = uCorruption * 0.003;
          float r = texture2D(uTexture, uv + vec2(aberration, 0.0)).r;
          float g = texture2D(uTexture, uv).g;
          float b = texture2D(uTexture, uv - vec2(aberration, 0.0)).b;
          vec4 color = vec4(r, g, b, 1.0);
          
          // Edge erosion
          float edgeDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
          float erosion = noise(uv * 8.0 + uTime * 0.1) * uCorruption;
          if (edgeDist < 0.05 + erosion * 0.1) {
            float alpha = smoothstep(0.0, 0.05 + erosion * 0.1, edgeDist);
            color.a *= alpha;
          }
          
          // Text flicker (subtle)
          float flicker = step(0.97, random(vec2(uv.y * 100.0, floor(uTime * 10.0))));
          if (flicker > 0.0 && uCorruption > 0.5) {
            color.rgb = mix(color.rgb, vec3(0.9, 0.1, 0.1), 0.3);
          }
          
          gl_FragColor = color;
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, [paperTexture, doc.corruptionLevel, corruptionIntensity]);

  // Mouse-following light
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.position.x = pointer.x * viewport.width * 0.5;
      lightRef.current.position.y = pointer.y * viewport.height * 0.5;
      lightRef.current.position.z = 2;
    }
    if (shaderMaterial) {
      shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    }
    // Gentle hover animation
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.005 * doc.corruptionLevel;
    }
  });

  const aspect = 1.414; // A4 ratio
  const width = 3.5;
  const height = width * aspect;

  return (
    <group>
      {/* Ambient light */}
      <ambientLight intensity={0.3} color={colors.archive.white} />
      
      {/* Mouse-following desk lamp */}
      <pointLight
        ref={lightRef}
        intensity={2}
        distance={8}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      {/* The paper */}
      <mesh
        ref={meshRef}
        material={shaderMaterial}
        castShadow
        receiveShadow
        position={[0, 0, 0]}
      >
        <planeGeometry args={[width, height, 32, 32]} />
      </mesh>
      
      {/* Shadow plane (the desk) */}
      <mesh position={[0, 0, -0.1]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={colors.archive.black} roughness={0.9} />
      </mesh>

      {/* HTML overlay for actual text content */}
      <Html
        transform
        occlude
        position={[0, 0, 0.01]}
        style={{
          width: `${width * 100}px`,
          height: `${height * 100}px`,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <DocumentContent doc={doc} onClose={onClose} />
      </Html>
    </group>
  );
};

// ─── DOCUMENT CONTENT (HTML OVERLAY) ───

const DocumentContent: React.FC<{ doc: DocumentArtifact; onClose: () => void }> = ({
  doc,
  onClose,
}) => {
  const [showCorrupted, setShowCorrupted] = React.useState(false);
  const content = showCorrupted && doc.corruptedContent ? doc.corruptedContent : doc.content;
  
  const typewriterFonts: Record<string, string> = {
    typewriter: '"Courier New", Courier, monospace',
    ballpoint: '"Georgia", serif',
    fountain: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
    carbon: '"Courier New", monospace',
    print: '"Times New Roman", Times, serif',
    marker: '"Arial", sans-serif',
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: '40px 50px',
        fontFamily: typewriterFonts[doc.inkType] || typewriterFonts.typewriter,
        fontSize: '11px',
        lineHeight: 1.6,
        color: '#2a2520',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '1px solid #c4b8a0', paddingBottom: '12px', marginBottom: '20px' }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#8b7355', textTransform: 'uppercase' }}>
          {doc.source.replace('_', ' ')} — {doc.type.replace('_', ' ')}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px', color: '#1a1510' }}>
          {doc.title}
        </div>
        <div style={{ fontSize: '9px', color: '#8b7355', marginTop: '4px' }}>
          {doc.date} | {doc.condition.toUpperCase()} | {doc.pages} PAGE{doc.pages > 1 ? 'S' : ''}
        </div>
      </div>

      {/* Body */}
      <div style={{ textAlign: 'justify', hyphens: 'auto' }}>
        {content.split('\n\n').map((paragraph, i) => (
          <p key={i} style={{ marginBottom: '12px', textIndent: '24px' }}>
            {paragraph}
          </p>
        ))}
      </div>

      {/* Corruption toggle (Tier 2+) */}
      {doc.corruptedContent && (
        <button
          onClick={() => setShowCorrupted(!showCorrupted)}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            background: 'transparent',
            border: '1px solid #8b0000',
            color: '#8b0000',
            padding: '4px 8px',
            fontSize: '8px',
            fontFamily: 'monospace',
            cursor: 'pointer',
            letterSpacing: '0.1em',
          }}
        >
          {showCorrupted ? 'SHOW OFFICIAL VERSION' : 'SHOW CORRUPTED VERSION'}
        </button>
      )}

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50px',
          fontSize: '8px',
          color: '#8b7355',
          letterSpacing: '0.05em',
        }}
      >
        RECOVERED: {doc.recoveredAt} | VERIFICATION: {doc.verificationStatus}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'transparent',
          border: 'none',
          color: '#8b7355',
          fontSize: '16px',
          cursor: 'pointer',
          fontFamily: 'monospace',
        }}
      >
        ×
      </button>
    </div>
  );
};

// ─── MAIN CANVAS ───

interface DocumentCanvasProps {
  doc: DocumentArtifact;
  onClose: () => void;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({ doc, onClose }) => {
  const { corruptionIntensity } = useDocumentStore();

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: colors.archive.black }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <PaperMesh doc={doc} corruptionIntensity={corruptionIntensity} onClose={onClose} />
      </Canvas>
    </div>
  );
};