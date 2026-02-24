"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Seeded PRNG for deterministic values (avoids hydration mismatch)
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const PARTICLE_COUNT = 2000;

// ── Shaders ─────────────────────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aType;

  uniform float uTime;
  uniform float uSweepAngle;
  uniform float uPixelRatio;

  varying float vAlpha;
  varying float vType;

  void main() {
    vec3 pos = position;

    // Subtle drift — point cloud data with slight measurement noise
    pos.y += sin(uTime * 0.4 + aPhase) * 0.05;
    pos.x += cos(uTime * 0.25 + aPhase * 1.3) * 0.03;
    pos.z += sin(uTime * 0.3 + aPhase * 0.8) * 0.03;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Crisp points — sized for top-down view distance
    gl_PointSize = aSize * uPixelRatio * (160.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 0.5, 14.0);

    // Radar sweep — particles illuminate as beam passes
    float angle = atan(position.z, position.x) + 3.14159265;
    float trailDist = mod(uSweepAngle - angle + 6.28318530, 6.28318530);

    // Sharp leading edge, soft trail
    float sweepGlow = smoothstep(1.4, 0.0, trailDist);

    // Distance falloff from center
    float dist = length(position.xz);
    float rangeFactor = smoothstep(16.0, 0.0, dist);

    // Base dim + sweep highlight
    float brightness = 0.08 + sweepGlow * 0.92 * rangeFactor;

    vAlpha = brightness;
    vType = aType;
  }
`;

const fragmentShader = /* glsl */ `
  varying float vAlpha;
  varying float vType;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    // Sharp core, minimal glow — crisp point cloud look
    float core = 1.0 - smoothstep(0.0, 0.2, dist);
    float edge = 1.0 - smoothstep(0.0, 0.5, dist);
    float alpha = (core * 0.8 + edge * 0.3) * vAlpha;

    // Monochrome cyan, brighter for detections (type=1)
    vec3 baseColor = vec3(0.024, 0.714, 0.831); // #06B6D4
    vec3 detColor  = vec3(0.231, 0.510, 0.965); // #3B82F6
    vec3 color = mix(baseColor, detColor, vType) * (0.8 + core * 0.4);

    gl_FragColor = vec4(color, alpha);
  }
`;

// ── Particle Field ──────────────────────────────────────────────────────────

function ParticleField() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, sizes, phases, types } = useMemo(() => {
    const rand = seededRandom(42);
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const sz = new Float32Array(PARTICLE_COUNT);
    const ph = new Float32Array(PARTICLE_COUNT);
    const tp = new Float32Array(PARTICLE_COUNT); // 0=infrastructure, 1=detection

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const type = rand();

      if (type < 0.4) {
        // Road surface — flat cross intersection, hugging ground
        if (rand() < 0.5) {
          pos[i3] = (rand() - 0.5) * 26;
          pos[i3 + 1] = rand() * 0.08;
          pos[i3 + 2] = (rand() - 0.5) * 2.5;
        } else {
          pos[i3] = (rand() - 0.5) * 2.5;
          pos[i3 + 1] = rand() * 0.08;
          pos[i3 + 2] = (rand() - 0.5) * 26;
        }
        sz[i] = 1.2 + rand() * 1.5;
        tp[i] = 0;
      } else if (type < 0.65) {
        // Vehicle detections — tight clusters, slight height for 3D box feel
        const clusterIdx = Math.floor(rand() * 8);
        const cx = [3, -5, 7, -2, 9, -8, 1, -6][clusterIdx];
        const cz = [1, -3, -1, 5, 3, 1, -7, -5][clusterIdx];

        pos[i3] = cx + (rand() - 0.5) * 0.7;
        pos[i3 + 1] = rand() * 0.5;
        pos[i3 + 2] = cz + (rand() - 0.5) * 0.4;
        sz[i] = 1.8 + rand() * 2.0;
        tp[i] = 1;
      } else {
        // Ground-level scatter — sensor noise, all flat on the surface
        const r = 1 + rand() * 13;
        const a = rand() * Math.PI * 2;
        pos[i3] = Math.cos(a) * r;
        pos[i3 + 1] = rand() * 0.05;
        pos[i3 + 2] = Math.sin(a) * r;
        sz[i] = 0.8 + rand() * 1.0;
        tp[i] = 0;
      }

      ph[i] = rand() * Math.PI * 2;
    }

    return { positions: pos, sizes: sz, phases: ph, types: tp };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSweepAngle: { value: 0 },
      uPixelRatio: { value: 1 },
    }),
    []
  );

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uPixelRatio.value = Math.min(
        window.devicePixelRatio,
        2
      );
    }
  }, []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uSweepAngle.value =
        clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aType" args={[types, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ── Radar Sweep Beam ────────────────────────────────────────────────────────

function RadarBeam() {
  const groupRef = useRef<THREE.Group>(null);

  const fanGeo = useMemo(() => {
    const geo = new THREE.CircleGeometry(14, 48, 0, 0.3);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.01, 0]}>
      <mesh geometry={fanGeo}>
        <meshBasicMaterial
          color={0x06b6d4}
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Leading edge */}
      <mesh position={[7, 0, 0]}>
        <boxGeometry args={[14, 0.01, 0.01]} />
        <meshBasicMaterial
          color={0x06b6d4}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Center dot */}
      <mesh>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial
          color={0x06b6d4}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ── Ground Elements ─────────────────────────────────────────────────────────

function GroundElements() {
  const gridRef = useRef<THREE.GridHelper>(null);

  useEffect(() => {
    if (gridRef.current) {
      const mat = gridRef.current.material as THREE.Material;
      mat.opacity = 0.1;
      mat.transparent = true;
      mat.depthWrite = false;
    }
  }, []);

  return (
    <group>
      <gridHelper
        ref={gridRef}
        args={[30, 30, 0x06b6d4, 0x06b6d4]}
        position={[0, -0.05, 0]}
      />
      {/* Outer boundary — frames the radar display */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[13.9, 14.0, 128]} />
        <meshBasicMaterial
          color={0x06b6d4}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Range rings */}
      {[3, 6, 9, 12].map((r) => (
        <mesh
          key={r}
          position={[0, -0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[r - 0.02, r + 0.02, 96]} />
          <meshBasicMaterial
            color={0x06b6d4}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      {/* Cross-hair axis lines through center */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 0.02]} />
        <meshBasicMaterial
          color={0x06b6d4}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[26, 0.02]} />
        <meshBasicMaterial
          color={0x06b6d4}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ── Camera Rig ──────────────────────────────────────────────────────────────

function CameraRig() {
  const smoothMouse = useRef({ x: 0, y: 0 });
  const targetMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      targetMouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  useFrame(({ clock, camera }) => {
    smoothMouse.current.x +=
      (targetMouse.current.x - smoothMouse.current.x) * 0.015;
    smoothMouse.current.y +=
      (targetMouse.current.y - smoothMouse.current.y) * 0.015;

    const t = clock.getElapsedTime() * 0.04;
    const mx = smoothMouse.current.x;
    const my = smoothMouse.current.y;

    // Steep top-down view — radar display fills viewport, not empty void
    camera.position.x = Math.cos(t) * 5 + mx * 1.5 + 2;
    camera.position.y = 18 - my * 1;
    camera.position.z = Math.sin(t) * 5 + 3;
    camera.lookAt(mx * 0.5, 0, my * 0.5);
  });

  return null;
}

// ── Exported Scene ──────────────────────────────────────────────────────────

function Scene() {
  return (
    <>
      <ParticleField />
      <RadarBeam />
      <GroundElements />
      <CameraRig />
    </>
  );
}

export function HeroScene() {
  return (
    <Canvas
      camera={{ position: [2, 18, 3], fov: 50, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Scene />
    </Canvas>
  );
}
