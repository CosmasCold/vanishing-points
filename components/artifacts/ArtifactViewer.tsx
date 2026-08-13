import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { useArtifactStore } from '@/state/artifactStore';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography, spacing } from '@/styles/theme';
import { 
  RotateCw, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Lightbulb, 
  Sparkles, 
  Cylinder,
  Ruler, 
  Eye, 
  Info,
  AlertTriangle
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   HIGH-FIDELITY PROCEDURAL THREE.JS SPECIMEN RENDERER
   Generates photorealistic PBR materials without loading external files.
   ═══════════════════════════════════════════════════════════════ */
interface ThreeRendererProps {
  id: string;
  rotation: number;
  zoom: number;
  lampMode: string;
  className?: string;
}

const ThreeSpecimenRenderer: React.FC<ThreeRendererProps> = ({
  id,
  rotation,
  zoom,
  lampMode,
  className
}) => {
  const [glSupported, setGlSupported] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const uvMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const standardMaterialRef = useRef<THREE.Material | null>(null);
  const measurementGroupRef = useRef<THREE.Group | null>(null);

  // Synchronize state props into a non-reactive ref to eliminate re-compilation leaks
  const stateRef = useRef({ rotation, zoom, lampMode });
  useEffect(() => {
    stateRef.current = { rotation, zoom, lampMode };
  }, [rotation, zoom, lampMode]);

  // Procedurally generate a high-frequency normal and roughness map
  const textures = useMemo(() => {
    if (typeof window === 'undefined') return null;

    const size = 512;
    
    // 1. Granite Texture (Kola Core Segment)
    const graniteCanvas = document.createElement('canvas');
    graniteCanvas.width = size;
    graniteCanvas.height = size;
    const gCtx = graniteCanvas.getContext('2d')!;
    
    // 2. Normal Map Canvas
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = size;
    normalCanvas.height = size;
    const nCtx = normalCanvas.getContext('2d')!;

    // 3. Roughness Canvas
    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = size;
    roughCanvas.height = size;
    const rCtx = roughCanvas.getContext('2d')!;

    const imgData = gCtx.createImageData(size, size);
    const normData = nCtx.createImageData(size, size);
    const roughData = rCtx.createImageData(size, size);

    // Generate procedural Perlin-like cellular noise
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        
        // Octave 1: Base low-frequency rock grain
        const n1 = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 0.5 + 0.5;
        // Octave 2: Mid-frequency mineral veins
        const n2 = Math.sin(x * 0.25 + n1 * 4) * Math.cos(y * 0.25) * 0.25 + 0.5;
        // Octave 3: High-frequency granite crystal flecks
        const val3 = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const n3 = (val3 - Math.floor(val3)) || Math.random();

        const noiseVal = Math.min(1.0, Math.max(0.0, n1 * 0.5 + n2 * 0.35 + (n3 > 0.94 ? 0.45 : 0)));

        // Diffuse mapping
        if (id === 'art-core') {
          // Dark basalt/granite mineral blend
          const r = Math.floor(25 + noiseVal * 32);
          const g = Math.floor(22 + noiseVal * 28);
          const b = Math.floor(18 + noiseVal * 24);
          imgData.data[idx] = r;
          imgData.data[idx+1] = g;
          imgData.data[idx+2] = b;
        } else if (id === 'art-solenoid') {
          // Dark, heavily oxidized copper wire
          const r = Math.floor(65 + noiseVal * 45);
          const g = Math.floor(26 + noiseVal * 15);
          const b = Math.floor(12 + noiseVal * 8);
          imgData.data[idx] = r;
          imgData.data[idx+1] = g;
          imgData.data[idx+2] = b;
        } else {
          // Tarnished, melted silver casing
          const val = Math.floor(110 + noiseVal * 45);
          imgData.data[idx] = val;
          imgData.data[idx+1] = val;
          imgData.data[idx+2] = val + 4;
        }
        imgData.data[idx+3] = 255;

        // Roughness mapping (crystalline spots are ultra-glossy, basalt is dull)
        const isFleck = n3 > 0.94;
        roughData.data[idx] = isFleck ? 25 : Math.floor(120 + (1 - noiseVal) * 85);
        roughData.data[idx+1] = roughData.data[idx];
        roughData.data[idx+2] = roughData.data[idx];
        roughData.data[idx+3] = 255;
      }
    }

    gCtx.putImageData(imgData, 0, 0);
    rCtx.putImageData(roughData, 0, 0);

    // Sobel Filter to generate physically correct normal maps from height gradients
    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        const getVal = (px: number, py: number) => {
          const idx = (py * size + px) * 4;
          return roughData.data[idx] / 255; // Use roughness height density
        };

        // Sobel kernels
        const dX = (
          -1 * getVal(x-1, y-1) + 1 * getVal(x+1, y-1) +
          -2 * getVal(x-1, y)   + 2 * getVal(x+1, y) +
          -1 * getVal(x-1, y+1) + 1 * getVal(x+1, y+1)
        );

        const dY = (
          -1 * getVal(x-1, y-1) - 2 * getVal(x, y-1) - 1 * getVal(x+1, y-1) +
          1 * getVal(x-1, y+1) + 2 * getVal(x, y+1) + 1 * getVal(x+1, y+1)
        );

        // Calculate unit normal vector
        const normalVector = new THREE.Vector3(-dX * 4.0, -dY * 4.0, 1.0).normalize();

        const idx = (y * size + x) * 4;
        // Map [-1..1] to [0..255] RGB normal colors
        normData.data[idx] = Math.floor((normalVector.x * 0.5 + 0.5) * 255);
        normData.data[idx+1] = Math.floor((normalVector.y * 0.5 + 0.5) * 255);
        normData.data[idx+2] = Math.floor((normalVector.z * 0.5 + 0.5) * 255);
        normData.data[idx+3] = 255;
      }
    }
    nCtx.putImageData(normData, 0, 0);

    // Convert canvases to Three.js high-performance textures
    const diffuseTex = new THREE.CanvasTexture(graniteCanvas);
    const normalTex = new THREE.CanvasTexture(normalCanvas);
    const roughTex = new THREE.CanvasTexture(roughCanvas);

    diffuseTex.wrapS = THREE.RepeatWrapping;
    diffuseTex.wrapT = THREE.RepeatWrapping;
    normalTex.wrapS = THREE.RepeatWrapping;
    normalTex.wrapT = THREE.RepeatWrapping;
    roughTex.wrapS = THREE.RepeatWrapping;
    roughTex.wrapT = THREE.RepeatWrapping;

    return { diffuse: diffuseTex, normal: normalTex, roughness: roughTex };
  }, [id]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !textures) return;

    // 1. Initialize stable Three.js context
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 8;
    cameraRef.current = camera;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) {
      setGlSupported(false);
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Wipe previous canvas blocks safely to prevent duplicate attachments
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    // 2. Setup Hyper-Realistic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0x8c867a, 1.6);
    scene.add(ambientLight);

    // Bright radial Halogen lamp spot light
    const keyLight = new THREE.SpotLight(0xfff5cb, 6.5);
    keyLight.position.set(3, 4, 5);
    keyLight.angle = Math.PI / 6;
    keyLight.penumbra = 0.8;
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Cold fluorescent fill light representing the computer terminal's backglow
    const fillLight = new THREE.DirectionalLight(0xa5c5d8, 2.2);
    fillLight.position.set(-4, -2, 2);
    scene.add(fillLight);

    // Warm tungsten bounce light representing the desk lamp reflection
    const bounceLight = new THREE.DirectionalLight(0xffbf80, 1.25);
    bounceLight.position.set(0, -4, -1);
    scene.add(bounceLight);

    // 3. Compile Specimen Geometry & Advanced PBR Material
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    if (id === 'art-core') {
      // Hyper-detailed granite cylinder borehole core
      geometry = new THREE.CylinderGeometry(0.85, 0.85, 2.5, 48, 24);
      
      // Procedurally deform the cylinder vertices to make it look organically weathered and chipped
      const posAttr = geometry.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < posAttr.count; i++) {
        v.fromBufferAttribute(posAttr, i);
        // Avoid modifying the flat top/bottom end caps
        if (Math.abs(v.y) < 1.2) {
          const angle = Math.atan2(v.z, v.x);
          // Jagged basalt fractures scrawled directly on geometry vertices
          const noise = Math.sin(v.y * 12.0) * Math.cos(angle * 8.0) * 0.015 +
                        Math.sin(v.y * 42.0) * Math.sin(angle * 18.0) * 0.004;
          v.x += Math.cos(angle) * noise;
          v.z += Math.sin(angle) * noise;
          posAttr.setXYZ(i, v.x, v.y, v.z);
        }
      }
      geometry.computeVertexNormals();

      material = new THREE.MeshStandardMaterial({
        map: textures.diffuse,
        normalMap: textures.normal,
        roughnessMap: textures.roughness,
        normalScale: new THREE.Vector2(1.2, 1.2),
        metalness: 0.12,
        roughness: 1.0,
      });

    } else if (id === 'art-solenoid') {
      // 3D Telegraph electromagnetic solenoid core with coiled copper wire
      geometry = new THREE.Group() as any;
      const groupGeom = group as any;

      // Brass casing block
      const bracketGeom = new THREE.BoxGeometry(1.3, 1.8, 1.3);
      const bracketMat = new THREE.MeshStandardMaterial({
        color: 0x876f4e,
        roughness: 0.32,
        metalness: 0.85,
        normalMap: textures.normal,
        normalScale: new THREE.Vector2(0.3, 0.3),
      });
      const bracketMesh = new THREE.Mesh(bracketGeom, bracketMat);
      bracketMesh.castShadow = true;
      bracketMesh.receiveShadow = true;
      groupGeom.add(bracketMesh);

      // Core spool cylinders
      const spoolGeom = new THREE.CylinderGeometry(0.48, 0.48, 1.4, 32);
      const spoolMat = new THREE.MeshStandardMaterial({
        map: textures.diffuse,
        normalMap: textures.normal,
        roughnessMap: textures.roughness,
        metalness: 0.95,
        roughness: 0.15,
      });
      const spoolMesh = new THREE.Mesh(spoolGeom, spoolMat);
      spoolMesh.position.set(0, 0, 0);
      spoolMesh.castShadow = true;
      spoolMesh.receiveShadow = true;
      groupGeom.add(spoolMesh);

      // High-voltage arc blast scorch marks overlay
      const blastGeom = new THREE.SphereGeometry(0.55, 32, 16);
      const blastMat = new THREE.MeshStandardMaterial({
        color: 0x0a0502,
        roughness: 0.98,
        metalness: 0.0,
        transparent: true,
        opacity: 0.85,
      });
      const blastMesh = new THREE.Mesh(blastGeom, blastMat);
      blastMesh.position.set(0, 0, 0.35);
      groupGeom.add(blastMesh);

      material = bracketMat; // Ref for cleanup

    } else if (id === 'art-watch') {
      // Charred, melted silver pocketwatch casing
      geometry = new THREE.SphereGeometry(1.0, 32, 24);
      geometry.scale(1.0, 1.0, 0.28); // Flatten into a pocketwatch pouch shape
      
      // Melt and scorch vertices
      const posAttr = geometry.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < posAttr.count; i++) {
        v.fromBufferAttribute(posAttr, i);
        // Warp bottom half of watch casing to represent catastrophic heat melt
        if (v.y < 0) {
          v.y *= 1.15;
          v.x += Math.sin(v.y * 4.0) * 0.12;
          posAttr.setXYZ(i, v.x, v.y, v.z);
        }
      }
      geometry.computeVertexNormals();

      material = new THREE.MeshStandardMaterial({
        color: 0x9c9ca3,
        metalness: 0.95,
        roughness: 0.22,
        normalMap: textures.normal,
        normalScale: new THREE.Vector2(0.65, 0.65),
      });

    } else if (id === 'art-asbestos') {
      // Wittenoom blue asbestos fiber inside a thick clear glass jar
      geometry = new THREE.CylinderGeometry(0.72, 0.72, 1.8, 32);
      const jarMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
        roughness: 0.04,
        metalness: 0.1,
        transmission: 0.92, // Hyper-realistic glass light refraction
        thickness: 0.15,
        ior: 1.5,
      });
      material = jarMat;

      const jarMesh = new THREE.Mesh(geometry, jarMat);
      group.add(jarMesh);

      // Procedural asbestos needles block inside jar
      const needleMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        roughness: 0.75,
        metalness: 0.2,
      });

      for (let i = 0; i < 28; i++) {
        const needleGeom = new THREE.CylinderGeometry(0.015, 0.015, 1.1, 8);
        const needleMesh = new THREE.Mesh(needleGeom, needleMat);
        needleMesh.rotation.set(
          Math.random() * 0.45,
          Math.random() * Math.PI,
          Math.random() * 0.45
        );
        needleMesh.position.set(
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.25,
          (Math.random() - 0.5) * 0.15
        );
        group.add(needleMesh);
      }

    } else {
      // Humberstone saltpeter morgue scale weight (Oxidized dark brass)
      geometry = new THREE.CylinderGeometry(0.7, 0.75, 1.2, 32);
      material = new THREE.MeshStandardMaterial({
        color: 0x7a633c,
        roughness: 0.52,
        metalness: 0.72,
        normalMap: textures.normal,
        normalScale: new THREE.Vector2(0.5, 0.5),
      });
    }

    if (id !== 'art-solenoid' && id !== 'art-asbestos') {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    standardMaterialRef.current = material;

    // 4. Glowing Fluorescent UV Ink Layer
    // Overlay mesh that sits 0.02 units proud of the standard object
    if (id === 'art-core') {
      const uvGeom = new THREE.CylinderGeometry(0.86, 0.86, 2.52, 48, 1);
      const uvMat = new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.0, // Faded in on UV mode
        blending: THREE.AdditiveBlending,
      });
      const uvMesh = new THREE.Mesh(uvGeom, uvMat);
      group.add(uvMesh);
      uvMaterialRef.current = uvMat;
    }

    // 5. Active Geodetic Caliper Laser scan lines
    const mGroup = new THREE.Group();
    measurementGroupRef.current = mGroup;
    scene.add(mGroup);

    // Laser plane 1
    const laser1Geom = new THREE.BoxGeometry(3.5, 0.015, 3.5);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    const laser1 = new THREE.Mesh(laser1Geom, laserMat);
    laser1.position.y = 0.5;
    mGroup.add(laser1);

    // 6. Handle active component resizing & rendering frame loops
    let animationId: number;
    let clock = new THREE.Clock();

    const render = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth mechanical glide towards standard targets
      if (groupRef.current) {
        const current = stateRef.current;
        // Linear interpolation mapping rotation/zoom targets exactly
        const targetRotRad = (current.rotation * Math.PI) / 180;
        groupRef.current.rotation.y += (targetRotRad - groupRef.current.rotation.y) * 0.12;
        
        const targetScale = current.zoom;
        groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.12));
      }

      // Procedural floating camera breathing cycle [1]
      camera.position.x = Math.sin(elapsed * 0.45) * 0.08;
      camera.position.y = Math.cos(elapsed * 0.3) * 0.06;
      camera.lookAt(scene.position);

      const currentLampMode = stateRef.current.lampMode;
      // Modulate laser beam positions under measure mode
      if (currentLampMode === 'measure') {
        laser1.position.y = Math.sin(elapsed * 1.8) * 0.85;
      }

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(render);
    };

    render();

    // 7. Cleanup WebGL bindings safely on unmount to prevent dismount crashes
    return () => {
      cancelAnimationFrame(animationId);
      if (geometry && typeof (geometry as any).dispose === 'function') {
        (geometry as any).dispose();
      }
      if (material && typeof (material as any).dispose === 'function') {
        (material as any).dispose();
      }
      if (textures) {
        textures.diffuse?.dispose();
        textures.normal?.dispose();
        textures.roughness?.dispose();
      }
      renderer?.dispose();
    };
  }, [id, textures]);

  // Adjust material parameters dynamically under different lighting spectrum filters
  useEffect(() => {
    if (!rendererRef.current || !standardMaterialRef.current) return;

    const isUvActive = lampMode === 'uv';
    const isMeasureActive = lampMode === 'measure';

    // 1. Modulate standard material properties to accommodate UV dark spectrums
    const mat = standardMaterialRef.current as any;
    if (mat.color) {
      if (isUvActive) {
        mat.color.setHex(0x101528); // Saturated deep co-axial indigo glow
        if (mat.roughness !== undefined) mat.roughness = 0.85;
        if (mat.metalness !== undefined) mat.metalness = 0.05;
      } else {
        // Restore standard tungsten palette
        if (id === 'art-core') mat.color.setHex(0x6d5e53);
        else if (id === 'art-solenoid') mat.color.setHex(0x876f4e);
        else if (id === 'art-watch') mat.color.setHex(0x9c9ca3);
        
        if (mat.roughness !== undefined) mat.roughness = id === 'art-watch' ? 0.22 : 0.52;
        if (mat.metalness !== undefined) mat.metalness = id === 'art-core' ? 0.12 : 0.85;
      }
    }

    // 2. Fade in/out fluorescent UV ink textures
    if (uvMaterialRef.current) {
      uvMaterialRef.current.opacity = isUvActive ? 0.95 : 0.0;
    }

    // 3. Fade in/out caliper lasers
    if (measurementGroupRef.current) {
      measurementGroupRef.current.traverse((child: any) => {
        if (child.material) {
          child.material.opacity = isMeasureActive ? 0.35 : 0.0;
        }
      });
    }

  }, [lampMode, id]);

  if (!glSupported) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-stone-500">
        WebGL accelerated environment failed to load.
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`${className} w-full h-full`}
      style={{ minWidth: 0, minHeight: 0 }}
    />
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export const ArtifactViewer: React.FC = () => {
  const {
    activeArtifact,
    rotation,
    zoom,
    lampMode,
    activeMarking,
    closeArtifact,
    rotate,
    setZoom,
    adjustZoom,
    setLampMode,
    inspectMarking,
  } = useArtifactStore();

  // PRIORITY-3: Dynamic Web Audio drag friction solenoid tick loop
  const prevRotationRef = React.useRef(rotation);
  React.useEffect(() => {
    if (rotation !== prevRotationRef.current) {
      const delta = Math.abs(rotation - prevRotationRef.current);
      prevRotationRef.current = rotation;
      
      // Play high-fidelity mechanical click on drag threshold crossing
      if (delta > 1.5) {
        const audio = useAudioStore.getState();
        if (audio && typeof audio.play === 'function') {
          audio.play('type'); // procedural click
        }
      }
    }
  }, [rotation]);

    // PRIORITY-3: Alignment gate state coupling logic
  React.useEffect(() => {
    if (!activeArtifact) return;
    const rot = rotation % 360;
    const normRot = rot < 0 ? rot + 360 : rot;
    
    let aligned = false;
    let gateMsg = "";
    
    if (activeArtifact.id === 'art-solenoid' && lampMode === 'uv' && normRot >= 165 && normRot <= 195 && zoom >= 1.5) {
      aligned = true;
      gateMsg = "BUNKER_7: Fused Solenoid Core vector locked at " + Math.round(normRot) + "° [UV FLUX OVERLAP]. Unredacting Lebanon coordinates: 38.000°N, 97.000°W.";
    } else if (activeArtifact.id === 'art-core' && lampMode === 'uv' && normRot >= 75 && normRot <= 105 && zoom >= 1.8) {
      aligned = true;
      gateMsg = "BUNKER_7: Kola segment mineral fractures aligned at " + Math.round(normRot) + "° [BEDROCK SIGNAL LOCK]. Triangulating 4.5 Hz seismic carrier signal.";
    } else if (activeArtifact.id === 'art-watch' && lampMode === 'uv' && normRot >= 255 && normRot <= 285 && zoom >= 2.0) {
      aligned = true;
      gateMsg = "BUNKER_7: Pocketwatch dial gears meshed at " + Math.round(normRot) + "° [TEMPORAL SLIP DISPLACEMENT LOCK]. Hands locked forever at 01:23:45 AM.";
    } else if (activeArtifact.id === 'art-asbestos' && lampMode === 'standard' && zoom >= 1.8) {
      aligned = true;
      gateMsg = "BUNKER_7: Wittenoom Blue Crocidolite base stamp scanned under standard lighting [WITTENOOM ERASURE EXPOSURE]. Degazetted coordinates unredacted: -22.14°S, 118.33°E.";
    } else if (activeArtifact.id === 'art-scale' && lampMode === 'uv' && normRot >= 105 && normRot <= 135 && zoom >= 2.0) {
      aligned = true;
      gateMsg = "BUNKER_7: Humberstone scale weight calibrated at " + Math.round(normRot) + "° [ORGAN MASS ALIGNMENT]. Etched coordinates secured: -20.2085°S, -69.7945°W. Mass aligned: 1.2 kg.";
    }

    if (aligned && !activeArtifact.hasBeenScanned) {
      const audio = useAudioStore.getState();
      const ui = useUIStore.getState();
      
      // Trigger a deep resonant geophone confirmation chime
      if (audio && typeof audio.play === 'function') {
        audio.play('return');
      }
      
      // Update local artifact database state in store
      useArtifactStore.getState().updateArtifact(activeArtifact.id, { hasBeenScanned: true });
      
      // Award Dust for unredaction sequence
      ui.updateStatus({
        dustIndex: Math.min(100, ui.status.dustIndex + 8),
        sessionWorkDone: ui.status.sessionWorkDone + 1
      });
      
      log('success', gateMsg);
    }
  }, [rotation, zoom, lampMode, activeArtifact]);
  
  const am = activeMarking as any;
  const { click, play } = useAudioStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!activeArtifact) return;
      e.preventDefault();
      adjustZoom(e.deltaY > 0 ? -0.12 : 0.12);
    };
    const el = containerRef.current;
    if (el) el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el?.removeEventListener('wheel', handleWheel);
  }, [activeArtifact, adjustZoom]);

  if (!activeArtifact) return null;

  // Helper to determine if a marking's physical alignment is currently locked
  const getMarkingLockStatus = (m: any) => {
    const rot = rotation % 360;
    const normRot = rot < 0 ? rot + 360 : rot;
    
    if (m.id === 'mark-coils') {
      const rotOk = normRot >= 165 && normRot <= 195;
      const zoomOk = zoom >= 1.5;
      return { ok: rotOk && zoomOk, targetRot: 180, targetZoom: 1.5 };
    }
    if (m.id === 'mark-fractures') {
      const rotOk = normRot >= 75 && normRot <= 105;
      const zoomOk = zoom >= 1.8;
      return { ok: rotOk && zoomOk, targetRot: 90, targetZoom: 1.8 };
    }
    if (m.id === 'mark-hands') {
      const rotOk = normRot >= 255 && normRot <= 285;
      const zoomOk = zoom >= 2.0;
      return { ok: rotOk && zoomOk, targetRot: 270, targetZoom: 2.0 };
    }
    if (m.id === 'mark-fibers') {
      const rotOk = normRot >= 345 || normRot <= 15;
      const zoomOk = zoom >= 1.8;
      return { ok: rotOk && zoomOk, targetRot: 0, targetZoom: 1.8 };
    }
    if (m.id === 'mark-weights') {
      const rotOk = normRot >= 105 && normRot <= 135;
      const zoomOk = zoom >= 2.0;
      return { ok: rotOk && zoomOk, targetRot: 120, targetZoom: 2.0 };
    }
    return { ok: true, targetRot: 0, targetZoom: 1.0 };
  };

  // Determine lamp indicator styling
  const getLampLabel = () => {
    switch (lampMode) {
      case 'uv':
        return 'ULTRAVIOLET CO-AXIAL FLUX';
      case 'measure':
        return 'GEODETIC CALIPER SPEC';
      default:
        return 'STANDARD RADIAL ILLUMINATION';
    }
  };

  const getLampColor = () => {
    switch (lampMode) {
      case 'uv':
        return '#818cf8'; // Neon purple/blue glow
      case 'measure':
        return '#34d399'; // Green laser lines
      default:
        return '#ffaa55'; // Standard Halogen
    }
  };

  // Render our gorgeous procedurally animated vector-SVGs of actual artifacts!
  const renderArtifactGraphic = () => {
    return (
      <div 
        className="relative w-72 h-72 flex items-center justify-center border border-stone-900 bg-[#070503]"
        style={{
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.95)',
        }}
      >
        {/* Render our gorgeous, high-fidelity WebGL 3D Specimen Scanner */}
        <ThreeSpecimenRenderer
          id={activeArtifact.id}
          rotation={rotation}
          zoom={zoom}
          lampMode={lampMode}
          className="absolute inset-0 z-0"
        />

        {/* Dynamic active marking anchor bullseye */}
        {activeArtifact.markings.map((m: any) => {
          const isSelected = activeMarking?.id === m.id;
          const isLampOk = !m.requiresUV || lampMode === 'uv';
          const { ok: isAlignmentOk } = getMarkingLockStatus(m);

          // Only show the interactive bullseye if both lamp and physical alignment constraints are met!
          if (!isLampOk || !isAlignmentOk) return null;

          return (
            <div
              key={m.id}
              onClick={(e) => {
                e.stopPropagation();
                click();
                inspectMarking(isSelected ? null : m);
              }}
              className="absolute w-4 h-4 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 z-10"
              style={{
                left: `calc(${m.coordinates.x}% - 8px)`,
                top: `calc(${m.coordinates.y}% - 8px)`,
                border: `1.2px solid ${isSelected ? getLampColor() : 'rgba(255,255,255,0.22)'}`,
                backgroundColor: isSelected ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)',
                boxShadow: isSelected ? `0 0 8px ${getLampColor()}` : 'none',
              }}
            >
              <div 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ backgroundColor: isSelected ? getLampColor() : 'rgba(255,255,255,0.45)' }} 
              />
            </div>
          );
        })}

      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 flex flex-col font-mono text-xs select-none"
        style={{
          marginLeft: spacing.rail,
          marginBottom: spacing.statusBar,
          backgroundColor: "rgba(10, 8, 6, 0.96)",
        }}
        onClick={closeArtifact}
      >
        {/* Top Header toolbar */}
        <div 
          className="flex items-center justify-between px-6 h-12 border-b shrink-0" 
          style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.black }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <Cylinder size={14} style={{ color: colors.archive.amber }} />
            <div>
              <div className="text-[8.5px] uppercase tracking-widest" style={{ color: colors.archive.gray }}>Anomalous Object Inspection Suite</div>
              <div className="text-sm font-bold text-white tracking-wide">{activeArtifact.name.toUpperCase()}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Lamp Mode Display Badge */}
            <div className="flex items-center gap-2 border px-3 py-1 bg-void" style={{ borderColor: colors.archive.grayDark }}>
              <Lightbulb size={11} style={{ color: getLampColor() }} />
              <span className="text-[9px] font-bold" style={{ color: getLampColor() }}>{getLampLabel()}</span>
            </div>

            <button
              onClick={() => {
                click();
                closeArtifact();
              }}
              className="px-3 py-1.5 border hover:border-stone-700 transition-colors"
              style={{ borderColor: colors.archive.grayDark, color: colors.archive.gray }}
            >
              × CLOSE WARD
            </button>
          </div>
        </div>

        {/* Main Content Splits */}
        <div className="flex-1 flex min-h-0 divide-x" style={{ borderColor: colors.archive.grayDark }} onClick={(e) => e.stopPropagation()}>\n          
          {/* LEFT COLUMN: Visual Magnifier Table */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-[#050403] relative">
            
            {/* Grid Coordinates backdrop */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-5"
              style={{
                backgroundImage: 'radial-gradient(ellipse at center, transparent 20%, #1c1917 100%), repeating-linear-gradient(0deg, transparent, transparent 19px, #fff 19px, #fff 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #fff 19px, #fff 20px)',
                backgroundSize: '100% 100%, 20px 20px, 20px 20px',
              }}
            />

            {/* Main Interactive render */}
            {renderArtifactGraphic()}

            {/* Rotator and Zoom Controls bar */}
            <div className="flex items-center gap-2.5 z-10">
              <button
                onClick={() => { click(); rotate(-15); }}
                className="p-2 border hover:bg-[#1a1714] active:scale-95 transition-all text-stone-400"
                style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.black }}
                title="Rotate Counter-Clockwise"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => { click(); rotate(15); }}
                className="p-2 border hover:bg-[#1a1714] active:scale-95 transition-all text-stone-400"
                style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.black }}
                title="Rotate Clockwise"
              >
                <RotateCw size={14} />
              </button>
              <div className="w-px h-6 bg-stone-900 mx-1" />
              <button
                onClick={() => { click(); adjustZoom(0.15); }}
                className="p-2 border hover:bg-[#1a1714] active:scale-95 transition-all text-stone-400"
                style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.black }}
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => { click(); adjustZoom(-0.15); }}
                className="p-2 border hover:bg-[#1a1714] active:scale-95 transition-all text-stone-400"
                style={{ borderColor: colors.archive.grayDark, backgroundColor: colors.archive.black }}
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Diagnostic Controls & Markings Readout */}
          <div className="w-80 flex flex-col p-6 overflow-y-auto gap-4 bg-[#0a0806]">
            
            {/* Spectral Lamp Mode Selectors */}
            <div className="space-y-2 shrink-0">
              <div className="text-[9px] tracking-[0.15em] font-bold text-stone-500 uppercase">Analyzer Lamp Mode</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'standard', label: 'STANDARD', icon: Eye },
                  { id: 'uv', label: 'UV LIGHT', icon: Sparkles },
                  { id: 'measure', label: 'MEASURE', icon: Ruler },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = lampMode === mode.id;

                  return (
                    <button
                      key={mode.id}
                      onClick={() => {
                        play('click');
                        setLampMode(mode.id as any);
                      }}
                      className="p-2 border rounded-[1px] flex flex-col gap-1 items-center text-center justify-center transition-all active:scale-98"
                      style={{
                        borderColor: isSelected ? getLampColor() : colors.archive.grayDark,
                        backgroundColor: isSelected ? 'rgba(20, 18, 16, 0.4)' : colors.archive.black,
                      }}
                    >
                      <Icon size={12} style={{ color: isSelected ? getLampColor() : colors.archive.gray }} />
                      <span className="text-[8.5px] font-bold" style={{ color: isSelected ? colors.archive.white : colors.archive.grayLight }}>
                        {mode.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Core Artifact Dossier Spec sheet */}
            <div className="space-y-2 border-t pt-4 border-stone-900 shrink-0 text-left">
              <div className="text-[9px] tracking-[0.15em] font-bold text-stone-500 uppercase flex items-center gap-1.5">
                <Info size={11} style={{ color: colors.archive.amber }} />
                <span>Object Specifications</span>
              </div>
              <div className="p-3 border space-y-1.5 text-[9.5px] leading-relaxed text-stone-400 bg-void rounded-[1px]" style={{ borderColor: colors.archive.grayDark }}>
                <div className="flex justify-between border-b pb-1 border-stone-950">
                  <span className="text-stone-600">CONDITION</span>
                  <span className="font-bold text-white uppercase">{activeArtifact.condition}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-stone-950">
                  <span className="text-stone-600">STRUCTURE</span>
                  <span className="font-bold text-white uppercase">{activeArtifact.material}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-stone-950">
                  <span className="text-stone-600">TOTAL MASS</span>
                  <span className="font-bold text-white">{activeArtifact.weight}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-stone-950">
                  <span className="text-stone-600">DIMENSIONS</span>
                  <span className="font-bold text-white">{activeArtifact.dimensions}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-stone-950">
                  <span className="text-stone-600">RECOVERY DATE</span>
                  <span className="font-bold text-white">{activeArtifact.dateRecovered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">SOURCE SITE</span>
                  <span className="font-bold text-white truncate max-w-[130px]" title={activeArtifact.origin}>{activeArtifact.origin}</span>
                </div>
              </div>
            </div>

            {/* Interactive Markings Readout panel */}
            <div className="flex-1 flex flex-col gap-2 border-t pt-4 border-stone-900 text-left">
              <div className="text-[9px] tracking-[0.15em] font-bold text-stone-500 uppercase">Micro-Inscription Analysis</div>
              
              <div 
                className="flex-1 border p-4 bg-void max-h-48 overflow-y-auto flex flex-col justify-center rounded-[1px]"
                style={{ borderColor: colors.archive.grayDark }}
              >
                {activeMarking ? (
                  <motion.div
                    key={am.id}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 text-[10.5px] leading-relaxed"
                  >
                    <div className="flex justify-between items-baseline border-b pb-1 border-stone-900">
                      <span className="font-bold text-white uppercase">{am.label}</span>
                      <span className="text-[8px] px-1 bg-[#1a1613] text-[#bf9f62] uppercase rounded-[1px] font-bold">
                        {am.location}
                      </span>
                    </div>
                    <p style={{ color: colors.archive.grayLight }}>{am.description}</p>
                    
                    {/* Clue transcription block */}
                    <div className="p-2 border border-amber-900/25 bg-amber-950/5 text-[#bf9f62] rounded-[1px] font-mono text-[9px] leading-normal border-t mt-2">
                      <div className="font-bold text-[7.5px] uppercase opacity-65 mb-1">Decoded Transcript:</div>
                      {am.clueText}
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col justify-start gap-2.5 py-2">
                    {/* List each marking as either locked or resolved */}
                    {activeArtifact.markings.map((m) => {
                      const { ok: isAligned, targetRot, targetZoom } = getMarkingLockStatus(m);
                      const isLampOk = !m.requiresUV || lampMode === 'uv';

                      if (isAligned && isLampOk) {
                        return (
                          <div key={`hint-${m.id}`} className="p-2 border border-green-900/30 bg-green-950/5 text-green-500 rounded-[1px] text-[10px]">
                            <div className="font-bold uppercase mb-0.5">● MARKING ALIGNED</div>
                            <div>Click the glowing indicator on the artifact to decode.</div>
                          </div>
                        );
                      }

                      return (
                        <div key={`hint-${m.id}`} className="p-2.5 border border-red-950/40 bg-red-950/5 text-stone-400 rounded-[1px] text-[10px] space-y-1">
                          <div className="font-bold text-red-500 uppercase flex items-center gap-1">
                            <AlertTriangle size={11} />
                            <span>ANOMALY DETECTED but UNRESOLVED</span>
                          </div>
                          <p className="text-stone-500 text-[9px] leading-normal">
                            Object scanning matrices indicate a micro-marking is buried here. You must calibrate alignment parameters to resolve:
                          </p>
                          <div className="font-mono text-[8.5px] text-amber-600/70 pl-2 space-y-0.5 border-l border-amber-900/30">
                            <div>• ROTATION TARGET: {targetRot}° (Current: {Math.round(rotation % 360)}°)</div>
                            <div>• RESOLUTION: {targetZoom}x (Current: {zoom.toFixed(2)}x)</div>
                            <div>• LIGHTING: {m.requiresUV ? "UV BLACKLIGHT" : "ANY"} (Current: {getLampLabel()})</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ArtifactViewer;