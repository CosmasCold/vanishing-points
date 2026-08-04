"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

/* ── DUST MOTES ── */
function DustField({ count = 400 }) {
  const mesh = useRef<THREE.Points>(null);
  const { viewport } = useThree();

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      vel[i * 3] = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 1] = Math.random() * 0.001 + 0.0005;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
    }
    return [pos, vel];
  }, [count]);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    const posAttr = mesh.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3];
      arr[i * 3 + 1] += velocities[i * 3 + 1];
      arr[i * 3 + 2] += velocities[i * 3 + 2];
      if (arr[i * 3 + 1] > 10) {
        arr[i * 3 + 1] = -10;
        arr[i * 3] = (Math.random() - 0.5) * 20;
      }
    }
    posAttr.needsUpdate = true;
    mesh.current.rotation.y += delta * 0.005;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#c4a882"
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ── FLOATING EMBER ORBS ── */
function EmberOrbs({ count = 12 }) {
  const group = useRef<THREE.Group>(null);
  const orbs = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 16,
      y: (Math.random() - 0.5) * 10,
      z: -5 - Math.random() * 5,
      speed: 0.2 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      radius: 0.03 + Math.random() * 0.06,
    }));
  }, [count]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      const orb = orbs[i];
      child.position.y = orb.y + Math.sin(clock.elapsedTime * orb.speed + orb.phase) * 0.8;
      child.position.x = orb.x + Math.cos(clock.elapsedTime * orb.speed * 0.5 + orb.phase) * 0.3;
      const scale = 1 + Math.sin(clock.elapsedTime * 2 + orb.phase) * 0.3;
      child.scale.setScalar(scale);
    });
  });

  return (
    <group ref={group}>
      {orbs.map((orb) => (
        <mesh key={orb.id} position={[orb.x, orb.y, orb.z]}>
          <sphereGeometry args={[orb.radius, 8, 8]} />
          <meshBasicMaterial color="#8b5a2b" transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/* ── VOLUMETRIC FOG PLANES ── */
function FogPlanes() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.z = clock.elapsedTime * 0.02;
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.03 + Math.sin(clock.elapsedTime * 0.1) * 0.01;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, -8]}>
      <planeGeometry args={[30, 20]} />
      <meshBasicMaterial color="#1a1410" transparent opacity={0.03} depthWrite={false} />
    </mesh>
  );
}

/* ── CAMERA RIG ── */
function CameraRig() {
  useFrame(({ camera, mouse }) => {
    camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.02;
    camera.position.y += (mouse.y * 0.3 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/* ── MAIN EXPORT ── */
export function AtmosphericBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: "transparent" }}
      >
        <CameraRig />
        <fog attach="fog" args={["#060504", 8, 25]} />
        <DustField count={300} />
        <EmberOrbs count={8} />
        <FogPlanes />
        <EffectComposer>
          <Bloom
            intensity={0.4}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Noise opacity={0.04} />
          <Vignette eskil={false} offset={0.3} darkness={0.7} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}