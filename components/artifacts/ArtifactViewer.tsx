import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useArtifactStore } from '@/state/artifactStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useProgressionStore } from '@/state/progressionStore';
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
  inspectionYaw?: number;
  inspectionPitch?: number;
  onAnomalyDiscovered?: () => void;
  className?: string;
}


/**
 * Micro-wear shader for the M-11A. The GLB supplies the macro geometry and
 * this shader supplies the missing forensic surface story: pitting, abrasion,
 * fine scratches, tarnish islands and tiny roughness variation without using
 * a UV texture atlas.
 */
const applySolenoidWearShader = (material: THREE.MeshStandardMaterial, type: number) => {
  material.userData.solenoidWearType = type;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWearType = { value: type };
    shader.vertexShader = `
      varying vec3 vSolenoidWearWorld;
      ${shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\n        vSolenoidWearWorld = worldPosition.xyz;'
      )}
    `;

    shader.fragmentShader = `
      varying vec3 vSolenoidWearWorld;
      uniform float uWearType;

      float wearHash(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }

      float wearNoise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float n000 = wearHash(i + vec3(0.0,0.0,0.0));
        float n100 = wearHash(i + vec3(1.0,0.0,0.0));
        float n010 = wearHash(i + vec3(0.0,1.0,0.0));
        float n110 = wearHash(i + vec3(1.0,1.0,0.0));
        float n001 = wearHash(i + vec3(0.0,0.0,1.0));
        float n101 = wearHash(i + vec3(1.0,0.0,1.0));
        float n011 = wearHash(i + vec3(0.0,1.0,1.0));
        float n111 = wearHash(i + vec3(1.0,1.0,1.0));
        float nx00 = mix(n000,n100,f.x);
        float nx10 = mix(n010,n110,f.x);
        float nx01 = mix(n001,n101,f.x);
        float nx11 = mix(n011,n111,f.x);
        return mix(mix(nx00,nx10,f.y),mix(nx01,nx11,f.y),f.z);
      }

      float wearFbm(vec3 p) {
        float n = 0.0;
        float a = 0.5;
        n += wearNoise(p) * a; p *= 2.03; a *= 0.5;
        n += wearNoise(p) * a; p *= 2.01; a *= 0.5;
        n += wearNoise(p) * a; p *= 2.07; a *= 0.5;
        n += wearNoise(p) * a;
        return n;
      }

      float wearPits(vec3 p) {
        float coarse = wearFbm(p * 8.0);
        float fine = wearFbm(p * 34.0);
        float islands = smoothstep(0.68, 0.90, coarse);
        float pores = smoothstep(0.70, 0.96, fine);
        return islands * pores;
      }

      float wearScratches(vec3 p) {
        vec3 q = p * vec3(38.0, 13.0, 31.0);
        float a = abs(sin(q.x + sin(q.y * 0.71) * 2.0));
        float b = abs(sin(q.z + sin(q.x * 0.37) * 1.5));
        float c = abs(sin((q.x + q.y + q.z) * 0.41));
        float scratches = 1.0 - smoothstep(0.985, 0.998, max(a, max(b,c)));
        return scratches * smoothstep(0.28, 0.72, wearNoise(p * 9.0));
      }

      ${shader.fragmentShader.replace(
        '#include <normal_fragment_begin>',
        `#include <normal_fragment_begin>
          float wearHeight = wearPits(vSolenoidWearWorld);
          float wearEdge = wearScratches(vSolenoidWearWorld);
          vec2 wearGrad = vec2(dFdx(wearHeight + wearEdge * 0.28), dFdy(wearHeight + wearEdge * 0.28));
          normal = normalize(normal + vec3(-wearGrad.x, -wearGrad.y, 0.0) * (uWearType < 1.5 ? 0.85 : 0.48));`
      ).replace(
        '#include <color_fragment>',
        `#include <color_fragment>
          float wear = wearPits(vSolenoidWearWorld);
          float scratches = wearScratches(vSolenoidWearWorld);
          float stain = wearFbm(vSolenoidWearWorld * 3.2);

          if (uWearType < 0.5) {
            // Brass: pitted dark islands + green/brown oxidation + bright rubbed edges.
            diffuseColor.rgb *= mix(1.0, 0.56, wear * 0.72);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.19,0.15,0.09), wear * 0.28);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.22,0.28,0.16), smoothstep(0.78,0.94,stain) * 0.16);
            diffuseColor.rgb *= 1.0 + scratches * 0.16;
          } else if (uWearType < 1.5) {
            // Copper: tarnish islands, dark heat bloom and fine abrasion.
            diffuseColor.rgb *= mix(1.0, 0.43, wear * 0.62);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.07,0.035,0.018), smoothstep(0.78,0.97,stain) * 0.42);
            diffuseColor.rgb *= 1.0 + scratches * 0.22;
          } else if (uWearType < 2.5) {
            // Iron: dry oxidation and small corrosion pits.
            diffuseColor.rgb *= mix(1.0, 0.46, wear * 0.78);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13,0.09,0.06), smoothstep(0.72,0.95,stain) * 0.30);
          } else {
            // Ceramic: chalking, stains and tiny abrasion.
            diffuseColor.rgb *= mix(1.0, 0.74, wear * 0.36);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.30,0.27,0.22), smoothstep(0.76,0.96,stain) * 0.13);
          }`
      ).replace(
        '#include <roughness_fragment>',
        `#include <roughness_fragment>
          float microWear = wearPits(vSolenoidWearWorld);
          float microScratch = wearScratches(vSolenoidWearWorld);
          roughnessFactor = clamp(roughnessFactor + microWear * 0.22 - microScratch * 0.09, 0.16, 1.0);`
      )}
    `;
  };
  material.needsUpdate = true;
};

const ThreeSpecimenRenderer: React.FC<ThreeRendererProps> = ({
  id,
  rotation,
  zoom,
  lampMode,
  inspectionYaw = 0,
  inspectionPitch = 0,
  onAnomalyDiscovered,
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
  const anomalyMeshRef = useRef<THREE.Mesh | null>(null);
  const anomalyCallbackRef = useRef(onAnomalyDiscovered);

  // Synchronize state props into a non-reactive ref to eliminate re-compilation leaks
  const stateRef = useRef({ rotation, zoom, lampMode, inspectionYaw, inspectionPitch });
  useEffect(() => {
    stateRef.current = { rotation, zoom, lampMode, inspectionYaw, inspectionPitch };
    anomalyCallbackRef.current = onAnomalyDiscovered;
  }, [rotation, zoom, lampMode, inspectionYaw, inspectionPitch, onAnomalyDiscovered]);

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
    // Temporary neutral archival backdrop. The eventual static examination-room
    // background will replace this, but the specimen must remain readable now.
    scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    // Physical cassettes are examined close-up. Keep the existing camera architecture,
    // but frame this specimen like an object on an examination bench rather than
    // a distant display model.
    camera.position.z = id === 'art-vance-cassette' ? 5.75 : id === 'art-solenoid' ? 4.9 : 8;
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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Wipe previous canvas blocks safely to prevent duplicate attachments
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const handleAnomalyPointerDown = (event: PointerEvent) => {
      if (!anomalyMeshRef.current?.visible) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(anomalyMeshRef.current, false)[0];
      if (hit) {
        event.stopPropagation();
        anomalyCallbackRef.current?.();
      }
    };
    renderer.domElement.addEventListener('pointerdown', handleAnomalyPointerDown);

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    // 2. Setup Hyper-Realistic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xa49b8d, 3.15);
    scene.add(ambientLight);

    // Bright radial Halogen lamp spot light
    const keyLight = new THREE.SpotLight(0xfff4d2, 12.5);
    keyLight.position.set(3, 4, 5);
    keyLight.angle = Math.PI / 6;
    keyLight.penumbra = 0.8;
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Cold fluorescent fill light representing the computer terminal's backglow
    const fillLight = new THREE.DirectionalLight(0xc1d1d8, 4.8);
    fillLight.position.set(-4, -2, 2);
    scene.add(fillLight);

    // Warm tungsten bounce light representing the desk lamp reflection
    const bounceLight = new THREE.DirectionalLight(0xffc58d, 2.15);
    bounceLight.position.set(0, -4, -1);
    scene.add(bounceLight);

    // 3. Compile Specimen Geometry & Advanced PBR Material
    let geometry: THREE.BufferGeometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
    let material: THREE.Material = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
      metalness: 0,
    });

    const cassetteLoadGroup = new THREE.Group();
    group.add(cassetteLoadGroup);

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
      // M-11A is a real manufactured GLB specimen. Do not approximate it with
      // primitive Box/Cylinder/Sphere stand-ins. The asset contains the brass
      // frame, iron core, ceramic former, individual copper windings, fused
      // winding sections, terminals, mounting hardware and scorch residue.
      const loader = new GLTFLoader();
      loader.load(
        '/models/solenoid.glb',
        (gltf) => {
          const specimen = gltf.scene;
          specimen.name = 'FusedSolenoidCore_M11A';
          specimen.updateMatrixWorld(true);

          // Normalize the authored GLB around its actual visual center so the
          // shared inspection controls rotate the physical specimen cleanly.
          cassetteLoadGroup.updateMatrixWorld(true);
          const bounds = new THREE.Box3().setFromObject(specimen);
          const worldCenter = bounds.getCenter(new THREE.Vector3());
          const localCenter = cassetteLoadGroup.worldToLocal(worldCenter.clone());
          specimen.position.sub(localCenter);
          specimen.updateMatrixWorld(true);

          // The authored asset already contains the physical wear geometry.
          // This pass makes that wear read as age rather than a pristine CAD
          // specimen: uneven copper tarnish, dulled brass, ceramic staining,
          // darkened fasteners, and restrained handling abrasion.
          // Helsingr's asset is already a finished manufactured solenoid with its
          // own authored geometry/material treatment. Preserve that asset rather
          // than overlaying procedural wear that can fight its textures.
          specimen.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            child.visible = true;
            child.castShadow = true;
            child.receiveShadow = true;

            // Preserve Helsingr's authored material type, maps, and textures.
            // Only adjust the shared PBR values that the inspection room needs.
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            const cloned = materials.map((source: THREE.Material) => {
              const m = source.clone() as any;
              if ('envMapIntensity' in m) m.envMapIntensity = 0.8;
              if ('roughness' in m && m.roughness < 0.28) m.roughness = 0.28;
              m.needsUpdate = true;
              return m;
            });
            child.material = Array.isArray(child.material) ? cloned : cloned[0];
          });

          // Normalize from the actual largest dimension. Do not assume the GLB's
          // authored Y axis is its height, because downloaded assets may be Z-up.
          specimen.updateMatrixWorld(true);
          const normalizedBounds = new THREE.Box3().setFromObject(specimen);
          const normalizedSize = normalizedBounds.getSize(new THREE.Vector3());
          const targetDimension = 2.15;
          const maxDimension = Math.max(normalizedSize.x, normalizedSize.y, normalizedSize.z);
          if (Number.isFinite(maxDimension) && maxDimension > 0) {
            specimen.scale.setScalar(targetDimension / maxDimension);
            specimen.updateMatrixWorld(true);
          }

          const scaledBounds = new THREE.Box3().setFromObject(specimen);
          const scaledCenter = scaledBounds.getCenter(new THREE.Vector3());
          specimen.position.sub(scaledCenter);
          specimen.updateMatrixWorld(true);

          cassetteLoadGroup.add(specimen);

          const firstMesh = specimen.getObjectByProperty('isMesh', true) as THREE.Mesh | undefined;
          if (firstMesh) {
            const firstMaterial = Array.isArray(firstMesh.material)
              ? firstMesh.material[0]
              : firstMesh.material;
            standardMaterialRef.current = firstMaterial;
          }
        },
        undefined,
        (error) => {
          console.error('Failed to load M-11A solenoid GLB', error);
        },
      );

      // The GLB owns the physical specimen. Keep the placeholder invisible.
      geometry = new THREE.BoxGeometry(0.001, 0.001, 0.001);
      material = new THREE.MeshStandardMaterial({ visible: false });

    } else if (id === 'art-vance-cassette') {
      // Load the cassette as a real GLB specimen rather than approximating
      // a manufactured cassette from UI primitives. The mesh carries the
      // complete front/rear shell, reel wells, hubs and molded details.
      material = new THREE.MeshStandardMaterial({
        color: 0x3a3935,
        roughness: 0.52,
        metalness: 0.03,
      });

      const loader = new GLTFLoader();
      loader.load(
        '/models/Cassette.glb',
        (gltf) => {
          const specimen = gltf.scene;
          specimen.name = 'KeeperFinalLogCassette';

          // Normalize the supplied cassette asset around its visual center so
          // the shared examination controls rotate the physical object rather
          // than its exported scene origin. The source GLB is retained intact.
          // Normalize the GLB's world-space offset so the physical specimen is
          // centered in the examination field regardless of how the source asset
          // was authored. Some GLB exports carry a non-zero scene origin.
          specimen.updateMatrixWorld(true);
          const bounds = new THREE.Box3().setFromObject(specimen);
          const center = bounds.getCenter(new THREE.Vector3());
          specimen.position.sub(center);
          specimen.updateMatrixWorld(true);

          // Re-center once more after applying the source transform. This keeps
          // the cassette's visual mass on the inspection axis, not in a corner.
          const correctedBounds = new THREE.Box3().setFromObject(specimen);
          const correctedCenter = correctedBounds.getCenter(new THREE.Vector3());
          specimen.position.sub(correctedCenter);

          const shellNames = new Set([
            'Cassette',
            'cassette_sides',
            'cassette_top',
            'Cassette_bottom',
            'Cassette._rough',
          ]);

          specimen.traverse((child) => {
            if (!(child instanceof THREE.Mesh)) return;
            child.castShadow = true;
            child.receiveShadow = true;

            const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
            const remapped = sourceMaterials.map((source: THREE.Material) => {
              const name = source.name || '';

              // The source asset contains excellent physical geometry and useful
              // internal/reel textures, but its shell albedo is a photographed
              // brown/black cassette surface. Rebuild only the shell material
              // so the object reads as aged molded plastic under our lighting.
              if (shellNames.has(name)) {
                // A cassette this old should not have a perfectly uniform shell.
                // Build a restrained, UV-space surface map containing fine molding
                // variation, tiny scuffs and isolated handling marks. These are
                // deliberately low-contrast so the artifact still reads as molded
                // plastic rather than painted noise.
                const surfaceCanvas = document.createElement('canvas');
                surfaceCanvas.width = 1024;
                surfaceCanvas.height = 1024;
                const sctx = surfaceCanvas.getContext('2d')!;
                sctx.fillStyle = '#303634';
                sctx.fillRect(0, 0, 1024, 1024);

                // Fine molded-plastic grain.
                for (let i = 0; i < 18000; i++) {
                  const x = (i * 197 + 31) % 1024;
                  const y = (i * 113 + 71) % 1024;
                  const tone = 38 + ((i * 17) % 24);
                  const alpha = 0.035 + (((i * 13) % 10) / 100);
                  sctx.fillStyle = `rgba(${tone},${tone + 5},${tone + 4},${alpha})`;
                  sctx.fillRect(x, y, 1 + (i % 2), 1 + ((i >> 2) % 2));
                }

                // Sparse, directional handling scuffs.
                for (let i = 0; i < 75; i++) {
                  const x = (i * 347 + 91) % 980;
                  const y = (i * 181 + 143) % 980;
                  const len = 6 + ((i * 29) % 42);
                  sctx.strokeStyle = i % 3 === 0
                    ? 'rgba(155,165,160,0.16)'
                    : 'rgba(8,10,10,0.18)';
                  sctx.lineWidth = i % 4 === 0 ? 1.2 : 0.7;
                  sctx.beginPath();
                  sctx.moveTo(x, y);
                  sctx.lineTo(x + len, y + ((i % 5) - 2) * 0.7);
                  sctx.stroke();
                }

                // A few broader, soft handling patches.
                for (let i = 0; i < 12; i++) {
                  const gx = (i * 283 + 130) % 1024;
                  const gy = (i * 421 + 210) % 1024;
                  const grad = sctx.createRadialGradient(gx, gy, 2, gx, gy, 45 + (i % 4) * 12);
                  grad.addColorStop(0, 'rgba(175,180,168,0.045)');
                  grad.addColorStop(1, 'rgba(175,180,168,0)');
                  sctx.fillStyle = grad;
                  sctx.beginPath();
                  sctx.arc(gx, gy, 55, 0, Math.PI * 2);
                  sctx.fill();
                }

                const surfaceMap = new THREE.CanvasTexture(surfaceCanvas);
                surfaceMap.colorSpace = THREE.SRGBColorSpace;
                surfaceMap.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

                const shell = new THREE.MeshPhysicalMaterial({
                  name: `VP_${name}`,
                  map: surfaceMap,
                  bumpMap: surfaceMap,
                  bumpScale: 0.012,
                  color: new THREE.Color(0xffffff),
                  roughness: name === 'Cassette._rough' ? 0.68 : 0.56,
                  metalness: 0.015,
                  clearcoat: 0.035,
                  clearcoatRoughness: 0.58,
                  envMapIntensity: 0.8,
                });
                shell.userData.sourceMaterial = name;
                shell.userData.surfaceMap = surfaceMap;
                return shell;
              }

              // Keep the authored tape, reel, pressure-pad and internal materials.
              if ('toneMapped' in source) (source as any).toneMapped = true;
              return source;
            });

            child.material = Array.isArray(child.material) ? remapped : remapped[0];
          });

          // The cassette is intentionally presented as the physical artifact itself.
          // Do not add a floating/procedural paper label here. Identification belongs
          // to the surrounding evidence UI; the 3D specimen should remain mechanically
          // honest and inspectable from every angle.

          // Keep the authored GLB at physical scale and let the shared
          // examination camera provide the close inspection framing.
          specimen.rotation.x = 0;
          specimen.rotation.z = 0;
          cassetteLoadGroup.add(specimen);

          if (anomalyMeshRef.current) {
            const specimenBounds = new THREE.Box3().setFromObject(specimen);
            const size = specimenBounds.getSize(new THREE.Vector3());
            anomalyMeshRef.current.position.set(
              specimenBounds.min.x + size.x * 0.28,
              specimenBounds.min.y + size.y * 0.72,
              specimenBounds.max.z + 0.018
            );
          }

          const shellCandidate = specimen.getObjectByName('Shell');
          if (shellCandidate instanceof THREE.Mesh) {
            standardMaterialRef.current = Array.isArray(shellCandidate.material)
              ? shellCandidate.material[0]
              : shellCandidate.material;
          }
        },
        undefined,
        (error) => {
          console.error('Failed to load Keeper Final Log cassette GLB', error);
        },
      );

      // Authored St. Elmo discovery marker. It lives in the specimen hierarchy,
      // so it follows the cassette through free physical inspection.
      if (id === 'art-vance-cassette') {
        const anomalyMaterial = new THREE.MeshBasicMaterial({
          color: 0xd6b56a,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthTest: false,
        });
        const anomaly = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 16, 12),
          anomalyMaterial
        );
        anomaly.name = 'KeeperCassetteMechanicalWear';
        anomaly.visible = false;
        anomaly.userData.forensicAnomaly = true;
        anomalyMeshRef.current = anomaly;
        cassetteLoadGroup.add(anomaly);
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

    if (id !== 'art-solenoid' && id !== 'art-asbestos' && id !== 'art-vance-cassette') {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    if (id !== 'art-solenoid') {
      standardMaterialRef.current = material;
    }

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

        // The player discovers the response through ordinary examination. No
        // target angle or recipe is exposed to the player.
        if (id === 'art-vance-cassette' && anomalyMeshRef.current) {
          const yaw = ((current.rotation + current.inspectionYaw) % 360 + 360) % 360;
          const centeredYaw = yaw > 180 ? yaw - 360 : yaw;
          const inspectionReady =
            Math.abs(centeredYaw) <= 32 &&
            Math.abs(current.inspectionPitch) <= 24 &&
            current.zoom >= 1.25 &&
            (current.lampMode === 'standard' || current.lampMode === 'magnify');

          anomalyMeshRef.current.visible = inspectionReady;
          const markerMaterial = anomalyMeshRef.current.material as THREE.MeshBasicMaterial;
          markerMaterial.opacity = inspectionReady
            ? 0.12 + Math.sin(elapsed * 2.8) * 0.035
            : 0;
          anomalyMeshRef.current.scale.setScalar(
            inspectionReady ? 1 + Math.sin(elapsed * 2.8) * 0.08 : 0.8
          );
        }

        // Linear interpolation mapping rotation/zoom targets exactly
        const targetRotRad = THREE.MathUtils.degToRad(current.rotation + current.inspectionYaw);
        groupRef.current.rotation.y += (targetRotRad - groupRef.current.rotation.y) * 0.12;

        // Physical inspection pitch is independent of evidence calibration.
        const targetPitchRad = THREE.MathUtils.degToRad(current.inspectionPitch);
        groupRef.current.rotation.x += (targetPitchRad - groupRef.current.rotation.x) * 0.14;
        
        const baseScale = id === 'art-vance-cassette' ? 1.35 : 1.0;
        const targetScale = current.zoom * baseScale;
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
      cassetteLoadGroup.traverse((child: any) => {
        if (child.geometry?.dispose) child.geometry.dispose();
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m: any) => m?.dispose?.());
        }
      });
      if (textures) {
        textures.diffuse?.dispose();
        textures.normal?.dispose();
        textures.roughness?.dispose();
      }
      renderer?.domElement.removeEventListener('pointerdown', handleAnomalyPointerDown);
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
    if (id === 'art-vance-cassette') {
      if (mat.color && !isUvActive && !String(mat.name || '').startsWith('VP_')) mat.color.setHex(0x303632);
    } else if (mat.color) {
      if (isUvActive) {
        mat.color.setHex(0x101528); // Saturated deep co-axial indigo glow
        if (mat.roughness !== undefined) mat.roughness = 0.85;
        if (mat.metalness !== undefined) mat.metalness = 0.05;
      } else {
        // Restore standard tungsten palette
        if (id === 'art-core') mat.color.setHex(0x6d5e53);
        else if (id === 'art-solenoid') mat.color.setHex(0x876f4e);
        else if (id === 'art-watch') mat.color.setHex(0x9c9ca3);
         else if (id === 'art-vance-cassette') mat.color.setHex(0x303632);
        
        if (mat.roughness !== undefined) mat.roughness = id === 'art-watch' ? 0.22 : 0.52;
        if (mat.metalness !== undefined) mat.metalness = id === 'art-core' ? 0.12 : (id === 'art-vance-cassette' ? 0.03 : 0.85);
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
  // --- INJECTED TACTILE SCANNER STATE CONTROLS ---
  const [caliperPoints, setCaliperPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDraggingSpecimen, setIsDraggingSpecimen] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [inspectionYaw, setInspectionYaw] = useState(0);
  const [inspectionPitch, setInspectionPitch] = useState(0);

  const caliperDistance = useMemo(() => {
    if (caliperPoints.length !== 2) return 0;
    const dx = caliperPoints[0].x - caliperPoints[1].x;
    const dy = caliperPoints[0].y - caliperPoints[1].y;
    return Math.sqrt(dx * dx + dy * dy) * 0.45; // scale factor to mm
  }, [caliperPoints]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (lampMode === 'measure') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCaliperPoints(prev => {
        if (prev.length >= 2) return [{ x, y }];
        return [...prev, { x, y }];
      });
      if (typeof play === 'function') play('type');
      return;
    }
    setIsDraggingSpecimen(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    (e.target as any).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSpecimen) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    const yawDelta = deltaX * 0.5;
    setInspectionYaw(prev => prev + yawDelta);

    // Vertical drag changes only the visual inspection pitch, clamped to avoid
    // flipping the artifact upside-down. Physical inspection applies to every
    // specimen; forensic calibration remains independent.
    setInspectionPitch(prev =>
      THREE.MathUtils.clamp(prev - deltaY * 0.5, -88, 88)
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingSpecimen(false);
    try {
      (e.target as any).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Physical inspection orientation is intentionally separate from evidence
  // calibration. Store rotation remains the forensic progression value.
  useEffect(() => {
    setCaliperPoints([]);
    setInspectionYaw(0);
    setInspectionPitch(0);
  }, [lampMode, activeArtifact]);
  

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
      const progression = useProgressionStore.getState();
      
      // Trigger a deep resonant geophone confirmation chime
      if (audio && typeof audio.play === 'function') {
        audio.play('return');
      }
      
      // Update local artifact database state in store
      useArtifactStore.getState().updateArtifact(activeArtifact.id, { hasBeenScanned: true });
      
      // Award Dust for unredaction sequence
      progression.addDust(8);
      progression.addSessionWork(1);
      
      console.log(gateMsg);
    }
  }, [rotation, zoom, lampMode, activeArtifact]);
  
  const am = activeMarking as any;
  const { click, play } = useAudioStore();
  const { addEvidence, markEvidenceAnalysed } = useProgressionStore();
  const { addEvidence: catalogueEvidence } = useInvestigationStore();
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

  const handleCassetteAnomalyDiscovered = () => {
    if (activeArtifact.id !== 'art-vance-cassette' || activeArtifact.hasBeenScanned) return;

    const evidenceId = 'evidence-stelmo-mechanical-exposure';
    const discovered = addEvidence(evidenceId);
    markEvidenceAnalysed(evidenceId);

    if (discovered) {
      catalogueEvidence('stelmo-light', {
        id: evidenceId,
        type: 'artifact',
        title: 'Mechanical Exposure Record',
        description:
          'Localized mechanical wear around the cassette label and housing seam is inconsistent with ordinary archival handling. The physical record establishes wear, but not who or what produced it.',
        source: "Keeper's Final Log Cassette",
        status: 'analyzed',
        relatedTo: ['stelmo-light', 'doc-stelmo-001'],
        timestamp: activeArtifact.dateRecovered,
        metadata: {
          artifactId: activeArtifact.id,
          markingId: 'mark-vance-mechanical-wear',
          provenance: 'physical-examination',
        },
      });
    }

    useArtifactStore.getState().updateArtifact(activeArtifact.id, {
      hasBeenScanned: true,
      relatedEvidenceIds: Array.from(
        new Set([...activeArtifact.relatedEvidenceIds, evidenceId])
      ),
    });

    click();
    play('return');
  };

  // Render our gorgeous procedurally animated vector-SVGs of actual artifacts!
  const renderArtifactGraphic = () => {
    return (
      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-[min(68vw,680px)] aspect-square flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none" 
        style={{ boxShadow: '0 18px 60px rgba(0,0,0,0.20)', }}
      >
        {/* Render our gorgeous, high-fidelity WebGL 3D Specimen Scanner */}
        <ThreeSpecimenRenderer
          id={activeArtifact.id}
          rotation={rotation}
          inspectionYaw={inspectionYaw}
          zoom={zoom}
          lampMode={lampMode}
          inspectionPitch={inspectionPitch}
          onAnomalyDiscovered={handleCassetteAnomalyDiscovered}
          className="absolute inset-0 z-0"
        />

        {/* Geodetic Calipers Laser Layer */}
        {lampMode === 'measure' && (
          <svg className="absolute inset-0 z-10 pointer-events-none w-full h-full">
            {/* Grid coordinates overlay */}
            <g stroke="#34d399" strokeWidth={1} opacity={0.35} strokeDasharray="4,4">
              <line x1="50%" y1="0" x2="50%" y2="100%" />
              <line x1="0" y1="50%" x2="100%" y2="50%" />
            </g>
            {caliperPoints.length > 0 && (
              <g>
                {caliperPoints.map((pt, idx) => (
                  <g key={idx}>
                    <circle cx={pt.x} cy={pt.y} r={6} fill="#34d399" />
                    <circle cx={pt.x} cy={pt.y} r={12} stroke="#34d399" strokeWidth={1.5} fill="none" className="animate-ping" />
                    <text x={pt.x + 10} y={pt.y - 10} fill="#34d399" className="font-mono text-[9px]">
                      {idx === 0 ? 'POINT_α' : 'POINT_β'}
                    </text>
                  </g>
                ))}
                {caliperPoints.length === 2 && (
                  <>
                    <line 
                      x1={caliperPoints[0].x} 
                      y1={caliperPoints[0].y} 
                      x2={caliperPoints[1].x} 
                      y2={caliperPoints[1].y} 
                      stroke="#34d399" 
                      strokeWidth={1.5} 
                    />
                    <g transform={`translate(${(caliperPoints[0].x + caliperPoints[1].x) / 2 - 50}, ${(caliperPoints[0].y + caliperPoints[1].y) / 2 - 12})`}>
                      <rect 
                        width={100} 
                        height={18} 
                        fill="#070503" 
                        stroke="#34d399" 
                        strokeWidth={1} 
                      />
                      <text 
                        x={50} 
                        y={12} 
                        fill="#34d399" 
                        textAnchor="middle" 
                        className="font-mono text-[8px] font-bold"
                      >
                        SPAN: {caliperDistance.toFixed(1)} mm
                      </text>
                    </g>
                  </>
                )}
              </g>
            )}
          </svg>
        )}
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
          backgroundColor: "rgba(18, 15, 11, 0.97)",
        }}
        onClick={closeArtifact}
      >
        {/* Top Header toolbar */}
        <div 
          className="flex items-center justify-between px-6 h-12 border-b shrink-0" 
          style={{ borderColor: colors.archive.grayDark, backgroundColor: "#0f0d0a" }}
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
          <div
            className="flex-1 flex flex-col items-center justify-center gap-6 p-8 relative overflow-hidden"
            style={{
              backgroundImage: "url('/images/desktop-final.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundColor: "#17110d",
            }}
          >
            {/* Static archival examination room. The photographic environment supplies
                the physical context while restrained overlays preserve specimen legibility. */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, rgba(7,5,3,.34) 0%, rgba(7,5,3,.10) 42%, rgba(7,5,3,.30) 100%), radial-gradient(ellipse at center, rgba(45,31,20,.04) 0%, rgba(4,3,2,.38) 100%)",
              }}
            />

            {/* Main Interactive render */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">{renderArtifactGraphic()}</div>

            {/* Rotator and Zoom Controls bar */}
            <div className="flex items-center gap-2.5 z-10">
              <button
                onClick={() => { click(); rotate(-15); }}
                className="p-2 border hover:bg-[#1a1714] active:scale-95 transition-all text-stone-400"
                style={{ borderColor: colors.archive.grayDark, backgroundColor: "#0f0d0a" }}
                title="Rotate Counter-Clockwise"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => { click(); rotate(15); }}
                className="p-2 border hover:bg-[#1a1714] active:scale-95 transition-all text-stone-400"
                style={{ borderColor: colors.archive.grayDark, backgroundColor: "#0f0d0a" }}
                title="Rotate Clockwise"
              >
                <RotateCw size={14} />
              </button>
              <div className="w-px h-6 bg-stone-900 mx-1" />
              <button
                onClick={() => { click(); adjustZoom(0.15); }}
                className="p-2 border hover:bg-[#1a1714] active:scale-95 transition-all text-stone-400"
                style={{ borderColor: colors.archive.grayDark, backgroundColor: "#0f0d0a" }}
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => { click(); adjustZoom(-0.15); }}
                className="p-2 border hover:bg-[#1a1714] active:scale-95 transition-all text-stone-400"
                style={{ borderColor: colors.archive.grayDark, backgroundColor: "#0f0d0a" }}
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Diagnostic Controls & Markings Readout */}
          <div className="w-80 flex flex-col p-6 overflow-y-auto gap-4 bg-[#12100d]">
            
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
                    {activeArtifact.id === 'art-vance-cassette' ? (
                      <div className="p-2.5 border border-amber-900/30 bg-amber-950/5 text-stone-400 rounded-[1px] text-[10px] space-y-1">
                        <div className="font-bold text-[#bf9f62] uppercase flex items-center gap-1">
                          <Eye size={11} />
                          <span>MICRO-SURFACE RESPONSE</span>
                        </div>
                        <p className="text-stone-500 text-[9px] leading-normal">
                          {activeArtifact.hasBeenScanned
                            ? 'Localized mechanical wear has been recorded and filed as derived evidence.'
                            : zoom >= 1.25 && (lampMode === 'standard' || lampMode === 'magnify')
                              ? 'A faint localized response is present somewhere on the specimen.'
                              : 'No distinctive surface response.'}
                        </p>
                      </div>
                    ) : (
                      activeArtifact.markings.map((m) => {
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
                      })
                    )}
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