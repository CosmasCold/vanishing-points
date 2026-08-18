"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  className?: string;
};

/**
 * Physical archive desk layer.
 *
 * This intentionally follows the proven ArtifactViewer rendering model:
 * real Three.js geometry, PBR materials, shadow-casting lights, subtle
 * camera drift, and procedural paper/leather/metal variation.
 *
 * ReactFlow remains responsible for evidence nodes and connections. This
 * component is only the physical desk surface and archival instruments.
 */
export const EvidenceBoardPhysicalScene: React.FC<Props> = ({ className = "" }) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const width = host.clientWidth || 1200;
    const height = host.clientHeight || 800;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090705);

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 8.7, 12.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;

    host.innerHTML = "";
    host.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const disposables: Array<THREE.Object3D | THREE.Material | THREE.BufferGeometry> = [];

    const addMesh = (
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      position: THREE.Vector3,
      rotation?: THREE.Euler,
      parent: THREE.Object3D = root
    ) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      if (rotation) mesh.rotation.copy(rotation);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      disposables.push(geometry, material);
      return mesh;
    };

    const makeCanvasTexture = (
      widthPx: number,
      heightPx: number,
      painter: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
    ) => {
      const canvas = document.createElement("canvas");
      canvas.width = widthPx;
      canvas.height = heightPx;
      const ctx = canvas.getContext("2d")!;
      painter(ctx, widthPx, heightPx);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      return texture;
    };

    const makeNoiseTexture = (
      base: [number, number, number],
      variation: number,
      grain: number
    ) => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const image = ctx.createImageData(size, size);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 4;
          const low = Math.sin(x * 0.035) * Math.cos(y * 0.041);
          const mid = Math.sin(x * 0.18 + low * 2.2) * Math.cos(y * 0.16);
          const fine = Math.random() - 0.5;
          const n = (low * 0.45 + mid * 0.25 + fine * grain) * variation;

          image.data[i] = Math.max(0, Math.min(255, base[0] + n));
          image.data[i + 1] = Math.max(0, Math.min(255, base[1] + n));
          image.data[i + 2] = Math.max(0, Math.min(255, base[2] + n));
          image.data[i + 3] = 255;
        }
      }

      ctx.putImageData(image, 0, 0);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3, 3);
      return texture;
    };

    const feltTex = makeNoiseTexture([20, 15, 11], 13, 0.9);
    const woodTex = makeNoiseTexture([47, 28, 17], 18, 1.2);
    const leatherTex = makeNoiseTexture([42, 20, 13], 12, 0.8);

    // ---------------------------------------------------------------------
    // Physical surface
    // ---------------------------------------------------------------------

    const deskMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.74,
      metalness: 0.02,
    });

    const feltMat = new THREE.MeshStandardMaterial({
      map: feltTex,
      roughness: 0.94,
      metalness: 0,
    });

    addMesh(
      new THREE.BoxGeometry(18, 0.35, 11),
      deskMat,
      new THREE.Vector3(0, -0.35, 0)
    );

    addMesh(
      new THREE.BoxGeometry(17.5, 0.18, 10.5),
      feltMat,
      new THREE.Vector3(0, -0.08, 0)
    );

    // Subtle inset leather rail around the working surface.
    const railMat = new THREE.MeshStandardMaterial({
      map: leatherTex,
      roughness: 0.86,
      metalness: 0.02,
    });

    [
      [0, 0.03, -5.15, 17.6, 0.08, 0.22],
      [0, 0.03, 5.15, 17.6, 0.08, 0.22],
      [-8.65, 0.03, 0, 0.22, 0.08, 10.1],
      [8.65, 0.03, 0, 0.22, 0.08, 10.1],
    ].forEach(([x, y, z, sx, sy, sz]) => {
      addMesh(
        new THREE.BoxGeometry(sx, sy, sz),
        railMat,
        new THREE.Vector3(x, y, z)
      );
    });

    // ---------------------------------------------------------------------
    // Paper / card helpers
    // ---------------------------------------------------------------------

    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xd8c8ad,
      roughness: 0.88,
      metalness: 0,
      side: THREE.DoubleSide,
    });

    const manilaMat = new THREE.MeshStandardMaterial({
      color: 0xb78f5e,
      roughness: 0.79,
      metalness: 0.01,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0x80612d,
      roughness: 0.27,
      metalness: 0.88,
    });

    const darkBrassMat = new THREE.MeshStandardMaterial({
      color: 0x49371d,
      roughness: 0.38,
      metalness: 0.82,
    });

    const paper = (x: number, z: number, w: number, h: number, rot: number, mat = paperMat) =>
      addMesh(
        new THREE.BoxGeometry(w, 0.035, h),
        mat,
        new THREE.Vector3(x, 0.09, z),
        new THREE.Euler(0, rot, 0)
      );

    // Scattered physical paper underneath the interactive ReactFlow layer.
    paper(-5.2, -2.8, 2.9, 2.05, -0.06);
    paper(4.8, -2.4, 2.7, 1.85, 0.05);
    paper(-3.9, 2.9, 2.5, 1.75, 0.08);
    paper(3.3, 2.8, 2.6, 1.8, -0.04);

    // Brass photo corners/tacks.
    const tack = (x: number, z: number) => {
      const group = new THREE.Group();
      group.position.set(x, 0.22, z);
      root.add(group);

      addMesh(
        new THREE.SphereGeometry(0.095, 16, 12),
        brassMat,
        new THREE.Vector3(0, 0, 0),
        undefined,
        group
      );

      addMesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8),
        darkBrassMat,
        new THREE.Vector3(0, -0.09, 0),
        new THREE.Euler(Math.PI / 2, 0, 0),
        group
      );
    };

    [
      [-6.2, -3.65],
      [-4.2, -1.95],
      [4.0, -3.15],
      [5.8, -1.65],
      [-4.95, 2.2],
      [-2.75, 3.7],
      [2.05, 2.0],
      [4.45, 3.55],
    ].forEach(([x, z]) => tack(x, z));

    // ---------------------------------------------------------------------
    // Observer Journal: leather cover + page block + strap + metal corners
    // ---------------------------------------------------------------------

    const journal = new THREE.Group();
    journal.position.set(5.55, 0.28, 2.95);
    journal.rotation.y = -0.12;
    root.add(journal);

    const journalCoverMat = new THREE.MeshStandardMaterial({
      map: leatherTex,
      color: 0x3a1c13,
      roughness: 0.77,
      metalness: 0.02,
    });

    addMesh(
      new THREE.BoxGeometry(2.65, 0.19, 1.9),
      journalCoverMat,
      new THREE.Vector3(0, 0, 0),
      new THREE.Euler(0, 0, 0),
      journal
    );

    addMesh(
      new THREE.BoxGeometry(2.45, 0.12, 1.72),
      new THREE.MeshStandardMaterial({
        color: 0xd1bd97,
        roughness: 0.96,
        metalness: 0,
      }),
      new THREE.Vector3(0, 0.12, 0),
      undefined,
      journal
    );

    const strap = new THREE.Mesh(
      new THREE.BoxGeometry(0.31, 0.035, 1.94),
      darkBrassMat
    );
    strap.position.set(-0.72, 0.15, 0);
    strap.castShadow = true;
    journal.add(strap);
    disposables.push(strap.geometry);

    // Gold title plate, deliberately understated.
    addMesh(
      new THREE.BoxGeometry(1.15, 0.035, 0.48),
      brassMat,
      new THREE.Vector3(0.38, 0.145, -0.04),
      undefined,
      journal
    );

    // ---------------------------------------------------------------------
    // Magnifying glass: actual glass lens + brass rim + wooden handle
    // ---------------------------------------------------------------------

    const magnifier = new THREE.Group();
    magnifier.position.set(-5.45, 0.42, -3.2);
    magnifier.rotation.y = -0.55;
    root.add(magnifier);

    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xe8edf0,
      transparent: true,
      opacity: 0.22,
      transmission: 0.82,
      thickness: 0.12,
      ior: 1.46,
      roughness: 0.06,
      metalness: 0,
    });

    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.83, 0.83, 0.10, 64),
      lensMat
    );
    lens.rotation.x = Math.PI / 2;
    lens.castShadow = false;
    lens.receiveShadow = false;
    magnifier.add(lens);
    disposables.push(lens.geometry, lensMat);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.84, 0.105, 18, 64),
      brassMat
    );
    rim.rotation.x = Math.PI / 2;
    rim.castShadow = true;
    magnifier.add(rim);
    disposables.push(rim.geometry);

    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x24150f,
      roughness: 0.68,
      metalness: 0.04,
    });

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.13, 2.45, 18),
      handleMat
    );
    handle.position.set(1.62, 0, 0);
    handle.rotation.z = Math.PI / 2;
    handle.castShadow = true;
    magnifier.add(handle);
    disposables.push(handle.geometry, handleMat);

    // ---------------------------------------------------------------------
    // Desk lamp: physical shade, stem, brass base, and actual illumination
    // ---------------------------------------------------------------------

    const lamp = new THREE.Group();
    lamp.position.set(6.35, 0.25, -3.65);
    lamp.rotation.y = -0.28;
    root.add(lamp);

    const greenMetal = new THREE.MeshStandardMaterial({
      color: 0x253126,
      roughness: 0.48,
      metalness: 0.58,
    });

    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.95, 0.75, 48, 1, true),
      greenMetal
    );
    shade.position.y = 1.75;
    shade.rotation.x = Math.PI;
    shade.castShadow = true;
    lamp.add(shade);
    disposables.push(shade.geometry);

    const shadeRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.94, 0.045, 12, 48),
      brassMat
    );
    shadeRim.position.y = 1.39;
    lamp.add(shadeRim);
    disposables.push(shadeRim.geometry);

    addMesh(
      new THREE.CylinderGeometry(0.055, 0.055, 1.5, 16),
      darkBrassMat,
      new THREE.Vector3(0, 0.85, 0),
      new THREE.Euler(0, 0, -0.22),
      lamp
    );

    addMesh(
      new THREE.CylinderGeometry(0.62, 0.7, 0.18, 40),
      brassMat,
      new THREE.Vector3(0, 0.12, 0),
      undefined,
      lamp
    );

    addMesh(
      new THREE.SphereGeometry(0.18, 24, 16),
      brassMat,
      new THREE.Vector3(0, 0.32, 0),
      undefined,
      lamp
    );

    const lampLight = new THREE.SpotLight(0xffd28a, 38, 8.5, Math.PI / 5.5, 0.78, 1.4);
    lampLight.position.set(0, 1.45, 0);
    lampLight.target.position.set(-0.2, 0, 0.5);
    lampLight.castShadow = true;
    lampLight.shadow.mapSize.set(1024, 1024);
    lampLight.shadow.bias = -0.0005;
    lamp.add(lampLight);
    lamp.add(lampLight.target);

    // Warm bulb.
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd89a })
    );
    bulb.position.set(0, 1.38, 0);
    lamp.add(bulb);
    disposables.push(bulb.geometry, bulb.material as THREE.Material);

    // ---------------------------------------------------------------------
    // Archive dossier stack
    // ---------------------------------------------------------------------

    const dossier = new THREE.Group();
    dossier.position.set(3.65, 0.19, -3.7);
    dossier.rotation.y = 0.08;
    root.add(dossier);

    const dossierMats = [
      new THREE.MeshStandardMaterial({ color: 0x6f4b2b, roughness: 0.84 }),
      new THREE.MeshStandardMaterial({ color: 0x84603a, roughness: 0.82 }),
      new THREE.MeshStandardMaterial({ color: 0x5e4027, roughness: 0.86 }),
    ];

    [0, 0.13, 0.26].forEach((y, i) => {
      addMesh(
        new THREE.BoxGeometry(3.0 - i * 0.08, 0.12, 1.75),
        dossierMats[i],
        new THREE.Vector3(i * 0.03, y, i * -0.025),
        new THREE.Euler(0, (i - 1) * 0.015, 0),
        dossier
      );
    });

    // ---------------------------------------------------------------------
    // Lighting rig based directly on ArtifactViewer's proven recipe.
    // ---------------------------------------------------------------------

    const ambient = new THREE.AmbientLight(0x8c867a, 1.15);
    scene.add(ambient);

    const key = new THREE.SpotLight(0xfff5cb, 4.2);
    key.position.set(3, 7, 6);
    key.angle = Math.PI / 4;
    key.penumbra = 0.78;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.001;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xa5c5d8, 1.05);
    fill.position.set(-5, 3, 4);
    scene.add(fill);

    const bounce = new THREE.DirectionalLight(0xffbf80, 0.72);
    bounce.position.set(2, -2, -5);
    scene.add(bounce);

    // ---------------------------------------------------------------------
    // Animation / resize
    // ---------------------------------------------------------------------

    const clock = new THREE.Clock();
    let frame = 0;

    const render = () => {
      const elapsed = clock.getElapsedTime();

      // Almost invisible camera breathing. The physical objects stay still.
      camera.position.x = Math.sin(elapsed * 0.19) * 0.045;
      camera.position.y = 8.7 + Math.cos(elapsed * 0.17) * 0.025;
      camera.lookAt(0, 0, 0);

      // Lamp intensity breathes within a tiny physical range.
      lampLight.intensity = 36.5 + Math.sin(elapsed * 0.8) * 0.65;

      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };

    render();

    const resize = () => {
      if (!host) return;
      const w = host.clientWidth || 1200;
      const h = host.clientHeight || 800;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();

      for (const item of disposables) {
        if (item instanceof THREE.Mesh) {
          item.geometry.dispose();
          if (Array.isArray(item.material)) item.material.forEach((m) => m.dispose());
          else item.material.dispose();
        } else if (item instanceof THREE.Material) {
          item.dispose();
        } else if (item instanceof THREE.BufferGeometry) {
          item.dispose();
        }
      }

      feltTex.dispose();
      woodTex.dispose();
      leatherTex.dispose();

      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      aria-hidden="true"
      style={{
        zIndex: 0,
        isolation: "isolate",
      }}
    />
  );
};

export default EvidenceBoardPhysicalScene;