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

const PARTICLE_COUNT = 3500;

// ── Shaders ─────────────────────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uSweepAngle;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Gentle floating motion
    vec3 pos = position;
    pos.y += sin(uTime * 0.5 + aPhase) * 0.15;
    pos.x += cos(uTime * 0.3 + aPhase * 1.3) * 0.06;
    pos.z += sin(uTime * 0.35 + aPhase * 0.8) * 0.06;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Point size with distance attenuation
    gl_PointSize = aSize * uPixelRatio * (200.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 40.0);

    // Radar sweep detection — particles glow as the beam passes
    float angle = atan(position.z, position.x) + 3.14159265;
    float trailDist = mod(uSweepAngle - angle + 6.28318530, 6.28318530);

    // Bright at sweep line, fading trail behind
    float sweepGlow = smoothstep(1.8, 0.0, trailDist);

    // Particles closer to center are more affected by sweep
    float dist = length(position.xz);
    float rangeFactor = smoothstep(14.0, 0.0, dist);

    float brightness = 0.12 + sweepGlow * 0.88 * rangeFactor;

    vColor = aColor;
    vAlpha = brightness;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;

    // Dual-layer: bright core + soft glow halo
    float core = 1.0 - smoothstep(0.0, 0.12, dist);
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);

    float alpha = (core * 0.7 + glow * 0.5) * vAlpha;
    vec3 color = vColor * (1.0 + core * 0.6);

    gl_FragColor = vec4(color, alpha);
  }
`;

// ── Particle Field ──────────────────────────────────────────────────────────

function ParticleField() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, colors, sizes, phases } = useMemo(() => {
    const rand = seededRandom(42);
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const sz = new Float32Array(PARTICLE_COUNT);
    const ph = new Float32Array(PARTICLE_COUNT);

    const cyan = new THREE.Color(0x06b6d4);
    const blue = new THREE.Color(0x3b82f6);
    const violet = new THREE.Color(0x8b5cf6);
    const amber = new THREE.Color(0xf59e0b);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const type = rand();

      if (type < 0.25) {
        // Road grid — cross-shaped intersection pattern
        if (rand() < 0.5) {
          pos[i3] = (rand() - 0.5) * 24;
          pos[i3 + 1] = (rand() - 0.5) * 0.4;
          pos[i3 + 2] = (rand() - 0.5) * 3;
        } else {
          pos[i3] = (rand() - 0.5) * 3;
          pos[i3 + 1] = (rand() - 0.5) * 0.4;
          pos[i3 + 2] = (rand() - 0.5) * 24;
        }
        col[i3] = cyan.r * 0.5;
        col[i3 + 1] = cyan.g * 0.5;
        col[i3 + 2] = cyan.b * 0.5;
        sz[i] = 3 + rand() * 4;
      } else if (type < 0.45) {
        // Vehicle detection clusters — 6 distinct clusters
        const clusterIdx = Math.floor(rand() * 6);
        const angles = [0.3, 1.2, 2.5, 3.8, 4.5, 5.5];
        const radii = [4, 7, 5, 8, 3, 6];
        const cx = Math.cos(angles[clusterIdx]) * radii[clusterIdx];
        const cz = Math.sin(angles[clusterIdx]) * radii[clusterIdx];

        pos[i3] = cx + (rand() - 0.5) * 1.5;
        pos[i3 + 1] = rand() * 1.0 + 0.2;
        pos[i3 + 2] = cz + (rand() - 0.5) * 0.8;

        const vc = rand() < 0.25 ? amber : rand() < 0.5 ? violet : blue;
        col[i3] = vc.r;
        col[i3 + 1] = vc.g;
        col[i3 + 2] = vc.b;
        sz[i] = 5 + rand() * 8;
      } else if (type < 0.65) {
        // Rising data stream — vertical column particles
        const streamAngle = rand() * Math.PI * 2;
        const streamR = 2 + rand() * 8;
        pos[i3] = Math.cos(streamAngle) * streamR;
        pos[i3 + 1] = rand() * 10 - 1;
        pos[i3 + 2] = Math.sin(streamAngle) * streamR;

        col[i3] = cyan.r * 0.25;
        col[i3 + 1] = cyan.g * 0.25;
        col[i3 + 2] = cyan.b * 0.25;
        sz[i] = 2 + rand() * 2;
      } else {
        // Ambient atmosphere scatter
        pos[i3] = (rand() - 0.5) * 30;
        pos[i3 + 1] = (rand() - 0.5) * 15;
        pos[i3 + 2] = (rand() - 0.5) * 30;

        const ac = rand() < 0.5 ? cyan : blue;
        col[i3] = ac.r * 0.15;
        col[i3 + 1] = ac.g * 0.15;
        col[i3 + 2] = ac.b * 0.15;
        sz[i] = 1.5 + rand() * 3;
      }

      ph[i] = rand() * Math.PI * 2;
    }

    return { positions: pos, colors: col, sizes: sz, phases: ph };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSweepAngle: { value: 0 },
      uPixelRatio: { value: 1 },
    }),
    []
  );

  // Set pixel ratio after mount (avoid SSR mismatch)
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
        clock.getElapsedTime() * 0.6;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
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

  // Flat fan/cone shape for the sweep trail
  const fanGeo = useMemo(() => {
    const geo = new THREE.CircleGeometry(12, 32, 0, 0.3);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.6;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.05, 0]}>
      {/* Sweep fan trail */}
      <mesh geometry={fanGeo}>
        <meshBasicMaterial
          color={0x06b6d4}
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Sweep leading edge line */}
      <mesh position={[6, 0, 0]}>
        <boxGeometry args={[12, 0.03, 0.03]} />
        <meshBasicMaterial
          color={0x06b6d4}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Center emitter dot */}
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial
          color={0x06b6d4}
          transparent
          opacity={0.9}
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
      mat.opacity = 0.05;
      mat.transparent = true;
      mat.depthWrite = false;
    }
  }, []);

  return (
    <group>
      <gridHelper
        ref={gridRef}
        args={[30, 30, 0x06b6d4, 0x06b6d4]}
        position={[0, -0.5, 0]}
      />
      {/* Concentric range rings */}
      {[3, 6, 9, 12].map((r) => (
        <mesh
          key={r}
          position={[0, -0.45, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[r - 0.015, r + 0.015, 64]} />
          <meshBasicMaterial
            color={0x06b6d4}
            transparent
            opacity={0.08}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Sensor Nodes ────────────────────────────────────────────────────────────

function SensorNodes() {
  const nodesRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!nodesRef.current) return;
    const t = clock.getElapsedTime();
    nodesRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + Math.sin(t * 1.5 + i * 2.1) * 0.3;
    });
  });

  const nodes: [number, number, number, number][] = [
    [5, 0.6, 5, 0x06b6d4],
    [-4, 0.6, -6, 0x3b82f6],
    [6, 0.6, -3, 0x8b5cf6],
  ];

  return (
    <group ref={nodesRef}>
      {nodes.map(([x, y, z, color], i) => (
        <mesh key={i} position={[x, y, z]}>
          <icosahedronGeometry args={[0.18, 1]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
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
      (targetMouse.current.x - smoothMouse.current.x) * 0.02;
    smoothMouse.current.y +=
      (targetMouse.current.y - smoothMouse.current.y) * 0.02;

    const t = clock.getElapsedTime() * 0.05;
    const mx = smoothMouse.current.x;
    const my = smoothMouse.current.y;

    camera.position.x = Math.cos(t) * 14 + mx * 3;
    camera.position.y = 10 - my * 2;
    camera.position.z = Math.sin(t) * 14;
    camera.lookAt(0, 0, 0);
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
      <SensorNodes />
      <CameraRig />
    </>
  );
}

export function HeroScene() {
  return (
    <Canvas
      camera={{ position: [12, 10, 12], fov: 55, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Scene />
    </Canvas>
  );
}
