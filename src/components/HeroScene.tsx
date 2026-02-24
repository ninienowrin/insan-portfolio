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
const ROAD_HALF = 14; // vehicles wrap at ±14

// ── Vehicle definitions ─────────────────────────────────────────────────────

// axis: which axis the vehicle moves along
// lane: position on the perpendicular axis
// dir: +1 or -1 movement direction
// speed: units per second
// start: initial position on the movement axis
const VEHICLES = [
  // East-west road — eastbound (negative-z lanes)
  { axis: "x" as const, lane: -1.2, dir: 1, speed: 1.2, start: -10 },
  { axis: "x" as const, lane: -0.4, dir: 1, speed: 1.6, start: -3 },
  { axis: "x" as const, lane: -1.2, dir: 1, speed: 0.9, start: 5 },
  // East-west road — westbound (positive-z lanes)
  { axis: "x" as const, lane: 0.4, dir: -1, speed: 1.3, start: 8 },
  { axis: "x" as const, lane: 1.2, dir: -1, speed: 1.0, start: -1 },
  // North-south road — southbound (negative-x lanes)
  { axis: "z" as const, lane: -1.2, dir: 1, speed: 1.4, start: -8 },
  { axis: "z" as const, lane: -0.4, dir: 1, speed: 1.0, start: 2 },
  // North-south road — northbound (positive-x lanes)
  { axis: "z" as const, lane: 0.4, dir: -1, speed: 1.2, start: 6 },
  { axis: "z" as const, lane: 1.2, dir: -1, speed: 1.5, start: -5 },
  { axis: "z" as const, lane: -0.4, dir: 1, speed: 0.8, start: 11 },
];

function getVehiclePos(v: (typeof VEHICLES)[0], time: number) {
  const range = ROAD_HALF * 2;
  // Wrap position to [-ROAD_HALF, ROAD_HALF]
  const raw = v.start + time * v.speed * v.dir;
  const pos = ((((raw + ROAD_HALF) % range) + range) % range) - ROAD_HALF;
  if (v.axis === "x") return { x: pos, z: v.lane };
  return { x: v.lane, z: pos };
}

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

    // Subtle drift for non-vehicle particles
    if (aType < 0.5) {
      pos.y += sin(uTime * 0.4 + aPhase) * 0.05;
      pos.x += cos(uTime * 0.25 + aPhase * 1.3) * 0.03;
      pos.z += sin(uTime * 0.3 + aPhase * 0.8) * 0.03;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Crisp points
    gl_PointSize = aSize * uPixelRatio * (160.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 0.5, 14.0);

    // Radar sweep
    float angle = atan(pos.z, pos.x) + 3.14159265;
    float trailDist = mod(uSweepAngle - angle + 6.28318530, 6.28318530);
    float sweepGlow = smoothstep(1.4, 0.0, trailDist);

    float dist = length(pos.xz);
    float rangeFactor = smoothstep(16.0, 0.0, dist);

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

    float core = 1.0 - smoothstep(0.0, 0.2, dist);
    float edge = 1.0 - smoothstep(0.0, 0.5, dist);
    float alpha = (core * 0.8 + edge * 0.3) * vAlpha;

    vec3 baseColor = vec3(0.024, 0.714, 0.831);
    vec3 detColor  = vec3(0.231, 0.510, 0.965);
    vec3 color = mix(baseColor, detColor, vType) * (0.8 + core * 0.4);

    gl_FragColor = vec4(color, alpha);
  }
`;

// ── Particle Field ──────────────────────────────────────────────────────────

interface VehicleParticle {
  idx: number; // index into position array (i * 3)
  vIdx: number; // which vehicle
  ox: number; // offset from vehicle center
  oy: number;
  oz: number;
}

function ParticleField() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const posAttrRef = useRef<THREE.BufferAttribute>(null);

  const { positions, sizes, phases, types, vehicleParticles } = useMemo(() => {
    const rand = seededRandom(42);
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const sz = new Float32Array(PARTICLE_COUNT);
    const ph = new Float32Array(PARTICLE_COUNT);
    const tp = new Float32Array(PARTICLE_COUNT);
    const vps: VehicleParticle[] = [];

    const roadWidth = 3.5;
    const laneOffsets = [-1.2, -0.4, 0.4, 1.2];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const type = rand();

      if (type < 0.35) {
        // Road surface
        if (rand() < 0.5) {
          pos[i3] = (rand() - 0.5) * 28;
          pos[i3 + 1] = rand() * 0.04;
          pos[i3 + 2] = (rand() - 0.5) * roadWidth * 2;
        } else {
          pos[i3] = (rand() - 0.5) * roadWidth * 2;
          pos[i3 + 1] = rand() * 0.04;
          pos[i3 + 2] = (rand() - 0.5) * 28;
        }
        sz[i] = 1.0 + rand() * 1.2;
        tp[i] = 0;
      } else if (type < 0.45) {
        // Lane markings
        const isEW = rand() < 0.5;
        const lineZ = laneOffsets[Math.floor(rand() * 4)];
        const along = (rand() - 0.5) * 26;
        if (isEW) {
          pos[i3] = along;
          pos[i3 + 1] = 0.02;
          pos[i3 + 2] = lineZ + (rand() - 0.5) * 0.06;
        } else {
          pos[i3] = lineZ + (rand() - 0.5) * 0.06;
          pos[i3 + 1] = 0.02;
          pos[i3 + 2] = along;
        }
        sz[i] = 1.4 + rand() * 0.8;
        tp[i] = 0;
      } else if (type < 0.7) {
        // Vehicle detection particles — store offset from vehicle center
        const vIdx = Math.floor(rand() * VEHICLES.length);
        const v = VEHICLES[vIdx];
        const vw = v.axis === "x" ? 1.6 : 0.8;
        const vh = v.axis === "x" ? 0.8 : 1.6;
        const ox = (rand() - 0.5) * vw;
        const oy = rand() * 0.6 + 0.02;
        const oz = (rand() - 0.5) * vh;

        // Set initial position (will be overwritten each frame)
        const vPos = getVehiclePos(v, 0);
        pos[i3] = vPos.x + ox;
        pos[i3 + 1] = oy;
        pos[i3 + 2] = vPos.z + oz;

        vps.push({ idx: i3, vIdx, ox, oy, oz });
        sz[i] = 1.8 + rand() * 2.2;
        tp[i] = 1;
      } else {
        // Ground scatter
        const r = 0.5 + rand() * 12;
        const a = rand() * Math.PI * 2;
        pos[i3] = Math.cos(a) * r;
        pos[i3 + 1] = rand() * 0.03;
        pos[i3 + 2] = Math.sin(a) * r;
        sz[i] = 0.6 + rand() * 0.8;
        tp[i] = 0;
      }

      ph[i] = rand() * Math.PI * 2;
    }

    return {
      positions: pos,
      sizes: sz,
      phases: ph,
      types: tp,
      vehicleParticles: vps,
    };
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
    const time = clock.getElapsedTime();

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uSweepAngle.value = time * 0.5;
    }

    // Update vehicle particle positions
    if (posAttrRef.current) {
      const arr = posAttrRef.current.array as Float32Array;
      for (const vp of vehicleParticles) {
        const vPos = getVehiclePos(VEHICLES[vp.vIdx], time);
        arr[vp.idx] = vPos.x + vp.ox;
        arr[vp.idx + 1] = vp.oy;
        arr[vp.idx + 2] = vPos.z + vp.oz;
      }
      posAttrRef.current.needsUpdate = true;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          ref={posAttrRef}
          attach="attributes-position"
          args={[positions, 3]}
        />
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

// ── Detection Bounding Boxes ────────────────────────────────────────────────

function BoundingBoxes() {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    VEHICLES.forEach((v, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;
      const vPos = getVehiclePos(v, time);
      mesh.position.x = vPos.x;
      mesh.position.z = vPos.z;
      // Subtle pulse
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.22 + Math.sin(time * 2 + i * 0.7) * 0.1;
    });
  });

  return (
    <group>
      {VEHICLES.map((v, i) => {
        const w = v.axis === "x" ? 1.8 : 0.9;
        const d = v.axis === "x" ? 0.9 : 1.8;
        return (
          <mesh
            key={i}
            ref={(el) => {
              meshRefs.current[i] = el;
            }}
            position={[0, 0.35, 0]}
          >
            <boxGeometry args={[w, 0.7, d]} />
            <meshBasicMaterial
              color={0x3b82f6}
              transparent
              opacity={0.25}
              wireframe
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        );
      })}
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
      {/* Outer boundary */}
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
      {/* Cross-hair axis lines */}
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
      <mesh
        position={[0, -0.01, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      >
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

    camera.position.x = Math.cos(t) * 3 + mx * 1;
    camera.position.y = 20;
    camera.position.z = Math.sin(t) * 3 + 4;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ── Exported Scene ──────────────────────────────────────────────────────────

function Scene() {
  return (
    <>
      <ParticleField />
      <BoundingBoxes />
      <RadarBeam />
      <GroundElements />
      <CameraRig />
    </>
  );
}

export function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 20, 4], fov: 50, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Scene />
    </Canvas>
  );
}
