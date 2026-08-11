"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useArtifactStore } from '@/state/artifactStore';
import { useAudioStore } from '@/state/audioStore';
import { colors, typography, spacing, microform } from '@/styles/theme';
import { 
  RotateCw, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Lightbulb, 
  Sparkles, 
  Cylinder,
  Ruler, 
  Scale, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  X 
} from 'lucide-react';


/* ═══════════════════════════════════════════════════════════════
   HIGH-FIDELITY WEBGL 3D RAYMARCHING SPECIMEN RENDERER
   ═══════════════════════════════════════════════════════════════ */
interface WebGLRendererProps {
  id: string;
  rotation: number;
  zoom: number;
  lampMode: string;
  className?: string;
}

const WebGLSpecimenRenderer: React.FC<WebGLRendererProps> = ({
  id,
  rotation,
  zoom,
  lampMode,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [glSupported, setGlSupported] = useState(true);

  const lampModeNum = lampMode === 'uv' ? 2 : lampMode === 'magnify' ? 1 : lampMode === 'measure' ? 3 : 0;

  const stateRef = useRef({ rotation, zoom, lampModeNum });
  useEffect(() => {
    stateRef.current = { rotation, zoom, lampModeNum };
  }, [rotation, zoom, lampModeNum]);
  const artifactType = id === 'art-solenoid' ? 0 : id === 'art-core' ? 1 : id === 'art-watch' ? 2 : id === 'art-asbestos' ? 3 : 4;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as any;
    if (!gl) {
      setGlSupported(false);
      return;
    }

    const vsSource = `
      attribute vec2 position;
      varying vec2 v_uv;
      void main() {
        v_uv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec2 v_uv;

      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_rotation;
      uniform float u_zoom;
      uniform int u_lamp_mode;
      uniform int u_artifact_type;

      vec3 rotateY(vec3 p, float a) {
        float c = cos(a), s = sin(a);
        return vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
      }
      vec3 rotateX(vec3 p, float a) {
        float c = cos(a), s = sin(a);
        return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
      }

      float sdCylinder(vec3 p, float r, float h) {
        vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
        return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
      }
      float sdTorus(vec3 p, vec2 t) {
        vec2 q = vec2(length(p.xz) - t.x, p.y);
        return length(q) - t.y;
      }
      float sdSphere(vec3 p, float r) {
        return length(p) - r;
      }
      float sdBox(vec3 p, vec3 b) {
        vec3 d = abs(p) - b;
        return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
      }

      float opRep(float p, float c) {
        return mod(p + 0.5 * c, c) - 0.5 * c;
      }

      float hash3(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
      }

      float map(vec3 p, out int mat) {
        mat = 0;
        p /= u_zoom;
        p = rotateY(p, u_rotation);
        p = rotateX(p, 0.35);

        if (u_artifact_type == 0) {
          float d_bracket = sdBox(p, vec3(0.5, 0.8, 0.5)) - 0.05;
          vec3 p_coil = p;
          p_coil.y = opRep(p_coil.y, 0.12);
          float d_coils = sdTorus(p_coil, vec2(0.42, 0.045));
          float d_sol = min(d_bracket, d_coils);
          mat = (d_sol == d_coils) ? 1 : 0;
          return d_sol * u_zoom;
        } else if (u_artifact_type == 1) {
          float d_cyl = sdCylinder(p, 0.52, 1.3);
          float crack_noise = sin(p.y * 12.0) * cos(p.x * 12.0) * 0.015;
          d_cyl += crack_noise;
          mat = 2;
          return d_cyl * u_zoom;
        } else if (u_artifact_type == 2) {
          float d_case = sdCylinder(p, 0.72, 0.14) - 0.05;
          float d_loop = sdTorus(rotateX(p - vec3(0.0, 0.85, 0.0), 1.57), vec2(0.15, 0.03));
          float d_watch = min(d_case, d_loop);
          mat = 3;
          return d_watch * u_zoom;
        } else if (u_artifact_type == 3) {
          float d_jar = sdCylinder(p, 0.6, 1.1) - 0.02;
          float d_needles = 100.0;
          for (int i = 0; i < 5; i++) {
            float angle = float(i) * 1.25;
            vec3 p_needle = rotateY(rotateX(p, angle * 0.2), angle);
            float d_n = sdCylinder(p_needle, 0.018, 0.85);
            d_needles = min(d_needles, d_n);
          }
          float d_tot = min(d_jar, d_needles);
          mat = (d_tot == d_jar) ? 4 : 5;
          return d_tot * u_zoom;
        } else {
          float d_body = sdCylinder(p - vec3(0.0, -0.2, 0.0), 0.55, 0.75) - 0.02;
          float d_neck = sdCylinder(p - vec3(0.0, 0.62, 0.0), 0.12, 0.15);
          float d_knob = sdSphere(p - vec3(0.0, 0.85, 0.0), 0.24);
          float d_weight = min(d_body, min(d_neck, d_knob));
          mat = 6;
          return d_weight * u_zoom;
        }
      }

      vec3 getNormal(vec3 p) {
        int mat;
        vec2 e = vec2(0.001, 0.0);
        return normalize(vec3(
          map(p + e.xyy, mat) - map(p - e.xyy, mat),
          map(p + e.yxy, mat) - map(p - e.yxy, mat),
          map(p + e.yyx, mat) - map(p - e.yyx, mat)
        ));
      }

      void main() {
        vec2 uv = v_uv - 0.5;
        uv.x *= u_resolution.x / u_resolution.y;

        vec3 ro = vec3(0.0, 0.0, 3.8);
        vec3 rd = normalize(vec3(uv, -1.0));

        float t = 0.0;
        int mat = -1;
        bool hit = false;
        vec3 p;

        for (int i = 0; i < 48; i++) {
          p = ro + rd * t;
          float d = map(p, mat);
          if (d < 0.001) {
            hit = true;
            break;
          }
          t += d;
          if (t > 8.0) break;
        }

        vec3 final_color = vec3(0.02, 0.015, 0.012);

        if (hit) {
          vec3 n = getNormal(p);
          vec3 light_dir = normalize(vec3(1.0, 1.2, 1.0));

          float diff = max(0.12, dot(n, light_dir));
          float spec = pow(max(0.0, dot(reflect(-light_dir, n), -rd)), 16.0);
          float rim = pow(1.0 - max(0.0, dot(n, -rd)), 4.0);

          vec3 base_color = vec3(0.4, 0.3, 0.15);
          float metallicity = 0.65;
          float roughness = 0.3;

          if (mat == 1) {
            base_color = vec3(0.72, 0.32, 0.14);
            metallicity = 0.85;
            roughness = 0.2;
          } else if (mat == 2) {
            float noise = hash3(floor(p / u_zoom * 40.0));
            base_color = mix(vec3(0.24, 0.21, 0.18), vec3(0.38, 0.34, 0.30), noise);
            metallicity = 0.0;
            roughness = 0.85;
          } else if (mat == 3) {
            base_color = vec3(0.55, 0.55, 0.58);
            metallicity = 0.95;
            roughness = 0.15;
          } else if (mat == 4) {
            base_color = vec3(0.12, 0.18, 0.22);
            metallicity = 0.1;
            roughness = 0.05;
          } else if (mat == 5) {
            base_color = vec3(0.14, 0.38, 0.84);
            metallicity = 0.4;
            roughness = 0.7;
          } else if (mat == 6) {
            float patina = hash3(floor(p / u_zoom * 22.0));
            base_color = mix(vec3(0.48, 0.36, 0.15), vec3(0.04, 0.35, 0.25), step(0.82, patina));
            metallicity = 0.5;
            roughness = 0.5;
          }

          vec3 shadow_mask = mix(vec3(0.32, 0.28, 0.24), vec3(1.0), diff);
          vec3 diffuse_layer = base_color * diff;
          vec3 specular_layer = vec3(spec * metallicity);
          vec3 rim_layer = vec3(rim * 0.18) * getNormal(p).y;

          final_color = diffuse_layer * shadow_mask + specular_layer + rim_layer;

          if (u_lamp_mode == 1) {
            final_color = final_color * vec3(1.2, 1.15, 0.9) * 1.35;
          } 
          else if (u_lamp_mode == 2) {
            float glow_pulse = 0.85 + sin(u_time * 2.8) * 0.15;
            
            if (u_artifact_type == 0) {
              float is_inscr = step(abs(p.y), 0.25) * step(abs(p.x), 0.18);
              vec3 uv_glow = vec3(0.2, 0.3, 1.0) * glow_pulse * 4.2;
              final_color = mix(final_color * 0.3, uv_glow, is_inscr);
            } 
            else if (u_artifact_type == 1) {
              float wave = step(abs(p.x - sin(p.y * 14.0) * 0.24), 0.035);
              vec3 uv_glow = vec3(0.0, 0.95, 0.85) * glow_pulse * 3.8;
              final_color = mix(final_color * 0.35, uv_glow, wave);
            } 
            else if (u_artifact_type == 2) {
              float clock_glow = step(length(p.xy), 0.4) * step(0.3, length(p.xy));
              vec3 uv_glow = vec3(0.1, 0.95, 0.2) * glow_pulse * 3.5;
              final_color = mix(final_color * 0.3, uv_glow, clock_glow);
            }
            else if (u_artifact_type == 3) {
              float stamp_glow = step(abs(p.y + 0.4), 0.15) * step(abs(p.x), 0.35);
              vec3 uv_glow = vec3(0.1, 0.6, 1.0) * glow_pulse * 4.0;
              final_color = mix(final_color * 0.3, uv_glow, stamp_glow);
            }
            else if (u_artifact_type == 4) {
              float stamp_glow = step(abs(p.y), 0.18) * step(abs(p.x), 0.32);
              vec3 uv_glow = vec3(0.1, 0.92, 0.35) * glow_pulse * 3.8;
              final_color = mix(final_color * 0.3, uv_glow, stamp_glow);
            }
          }
          else if (u_lamp_mode == 3) {
            float grid_y = step(abs(mod(p.y, 0.3) - 0.015), 0.012);
            vec3 laser_glow = vec3(0.1, 0.9, 0.45) * 1.5;
            final_color = mix(final_color, laser_glow, grid_y);
          }
        }

        gl_FragColor = vec4(final_color, 1.0);
      }
    `;

    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) {
      setGlSupported(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setGlSupported(false);
      return;
    }

    gl.useProgram(program);

    const vertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRotation = gl.getUniformLocation(program, 'u_rotation');
    const uZoom = gl.getUniformLocation(program, 'u_zoom');
    const uLampMode = gl.getUniformLocation(program, 'u_lamp_mode');
    const uArtifactType = gl.getUniformLocation(program, 'u_artifact_type');

    let animationFrameId: number;
    let startTime = Date.now();

    const render = () => {
      const c = canvasRef.current;
      if (!c) return;
      const width = c.clientWidth;
      const height = c.clientHeight;
      if (c.width !== width || c.height !== height) {
        c.width = width;
        c.height = height;
        gl.viewport(0, 0, width, height);
      }

      const elapsed = (Date.now() - startTime) / 1000;
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      const current = stateRef.current;
      gl.uniform1f(uRotation, (current.rotation * Math.PI) / 180);
      gl.uniform1f(uZoom, current.zoom);
      gl.uniform1i(uLampMode, current.lampModeNum);
      gl.uniform1i(uArtifactType, artifactType);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
    };
  }, [id, artifactType]);

  if (!glSupported) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`${className} w-full h-full border border-stone-900 shadow-inner`}
      style={{
        boxShadow: 'inset 0 0 32px rgba(0,0,0,0.95)',
        backgroundColor: '#070503'
      }}
    />
  );
};
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
      case 'magnify':
        return 'MICROSCOPIC FOCUSING LENS';
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
      case 'magnify':
        return '#fef08a'; // Focused warm light
      case 'measure':
        return '#34d399'; // Green laser lines
      default:
        return '#ffaa55'; // Standard Halogen
    }
  };

  // Render our gorgeous procedurally animated vector-SVGs of actual artifacts!
  const renderArtifactGraphic = () => {
    const scaleFactor = zoom;
    const rotateAngle = rotation;

    return (
      <div 
        className="relative w-72 h-72 flex items-center justify-center border border-stone-900 bg-[#070503]"
        style={{
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.95)',
        }}
      >

        {/* Render our gorgeous, high-fidelity WebGL 3D Specimen Scanner */}
        <WebGLSpecimenRenderer
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
        <div className="flex-1 flex min-h-0 divide-x" style={{ borderColor: colors.archive.grayDark }} onClick={(e) => e.stopPropagation()}>
          
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
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'standard', label: 'STANDARD', icon: Eye },
                  { id: 'magnify', label: 'MAGNIFY', icon: ZoomIn },
                  { id: 'uv', label: 'UV BLACKLIGHT', icon: Sparkles },
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
                      className="p-2.5 border text-left rounded-[1px] flex flex-col gap-1 transition-all active:scale-98"
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
                  <div className="flex flex-col items-center justify-center gap-1.5 opacity-40 text-center py-6">
                    <Sparkles size={16} className="text-stone-600 animate-pulse" />
                    <span className="text-[9px] text-stone-500 uppercase tracking-widest max-w-[180px]">
                      {lampMode === 'uv' 
                        ? "Inspect active markings (glowing coordinates) to decode insciptions"
                        : "Toggle UV Mode or scan for points on the artifact core"
                      }
                    </span>
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
