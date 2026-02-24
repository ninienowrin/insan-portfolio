"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// Seeded PRNG for deterministic values (avoids hydration mismatch)
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const PARTICLE_COUNT = 1500;
const ROAD_HALF = 14;
const SWEEP_SPEED = 0.5;

// ── Vehicle definitions ─────────────────────────────────────────────────────

const VEHICLES = [
  { axis: "x" as const, lane: -3.0, dir: 1, speed: 1.2, start: -10, vt: 0 },
  { axis: "x" as const, lane: -1.5, dir: 1, speed: 1.6, start: -3, vt: 1 },
  { axis: "x" as const, lane: -3.0, dir: 1, speed: 0.9, start: 5, vt: 2 },
  { axis: "x" as const, lane: 1.5, dir: -1, speed: 1.3, start: 8, vt: 0 },
  { axis: "x" as const, lane: 3.0, dir: -1, speed: 1.0, start: -1, vt: 1 },
  { axis: "z" as const, lane: -3.0, dir: 1, speed: 1.4, start: -8, vt: 0 },
  { axis: "z" as const, lane: -1.5, dir: 1, speed: 1.0, start: 2, vt: 2 },
  { axis: "z" as const, lane: 1.5, dir: -1, speed: 1.2, start: 6, vt: 1 },
  { axis: "z" as const, lane: 3.0, dir: -1, speed: 1.5, start: -5, vt: 0 },
  { axis: "z" as const, lane: -1.5, dir: 1, speed: 0.8, start: 11, vt: 1 },
];

const VTYPES = [
  { bW: 1.8, bH: 0.2, bD: 0.82, cW: 0.8, cH: 0.25, cD: 0.64, cX: -0.05 },
  { bW: 1.9, bH: 0.28, bD: 0.88, cW: 1.05, cH: 0.3, cD: 0.74, cX: -0.05 },
  { bW: 2.3, bH: 0.32, bD: 0.9, cW: 0.7, cH: 0.35, cD: 0.8, cX: 0.55 },
];

function getVehiclePos(v: (typeof VEHICLES)[0], time: number) {
  const range = ROAD_HALF * 2;
  const raw = v.start + time * v.speed * v.dir;
  const pos = ((((raw + ROAD_HALF) % range) + range) % range) - ROAD_HALF;
  if (v.axis === "x") return { x: pos, z: v.lane };
  return { x: v.lane, z: pos };
}

function sweepProximity(sweepAngle: number, x: number, z: number): number {
  const vAngle = Math.atan2(z, x) + Math.PI;
  const trail =
    (((sweepAngle - vAngle) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return Math.max(0, 1 - trail / 1.2);
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

    gl_PointSize = aSize * uPixelRatio * (160.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 0.5, 14.0);

    // Radar sweep detection
    float angle = atan(pos.z, pos.x) + 3.14159265;
    float trailDist = mod(uSweepAngle - angle + 6.28318530, 6.28318530);
    float sweepGlow = smoothstep(1.4, 0.0, trailDist);

    float dist = length(pos.xz);
    float rangeFactor = smoothstep(16.0, 0.0, dist);

    // Vehicle particles stay brighter overall
    float baseAlpha = aType > 0.5 ? 0.18 : 0.06;
    float brightness = baseAlpha + sweepGlow * (1.0 - baseAlpha) * rangeFactor;

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

    float core = 1.0 - smoothstep(0.0, 0.15, dist);
    float edge = 1.0 - smoothstep(0.0, 0.5, dist);
    float alpha = (core * 0.9 + edge * 0.3) * vAlpha;

    vec3 baseColor = vec3(0.024, 0.714, 0.831);
    vec3 detColor  = vec3(0.231, 0.510, 0.965);
    vec3 color = mix(baseColor, detColor, vType) * (0.8 + core * 0.5);

    gl_FragColor = vec4(color, alpha);
  }
`;

// ── Trail shader ────────────────────────────────────────────────────────────

const trailVertexShader = /* glsl */ `
  attribute float aAlpha;
  uniform float uPixelRatio;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = 2.5 * uPixelRatio * (160.0 / -mv.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 5.0);
  }
`;

const trailFragmentShader = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float alpha = (1.0 - smoothstep(0.0, 0.5, d)) * vAlpha * 0.5;
    gl_FragColor = vec4(0.024, 0.714, 0.831, alpha);
  }
`;

// ── Particle Field ──────────────────────────────────────────────────────────

interface VehicleParticle {
  idx: number;
  vIdx: number;
  ox: number;
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

    const roadWidth = 7.5;
    const laneOffsets = [-3.0, -1.5, 1.5, 3.0];

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
        // Vehicle detection particles
        const vIdx = Math.floor(rand() * VEHICLES.length);
        const v = VEHICLES[vIdx];
        const vt = VTYPES[v.vt];
        const localX = (rand() - 0.5) * vt.bW * 0.85;
        const localZ = (rand() - 0.5) * vt.bD * 0.85;
        const oy = rand() * (vt.bH + vt.cH) + 0.02;

        let ox: number, oz: number;
        if (v.axis === "x") {
          ox = localX * v.dir;
          oz = localZ;
        } else {
          ox = localZ;
          oz = localX * v.dir;
        }

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
      materialRef.current.uniforms.uSweepAngle.value = time * SWEEP_SPEED;
    }

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

// ── Vehicle Trails (radar contact history) ──────────────────────────────────

function VehicleTrails() {
  const TRAIL_LENGTH = 28;
  const totalPoints = VEHICLES.length * TRAIL_LENGTH;
  const posRef = useRef<THREE.BufferAttribute>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const frameCount = useRef(0);

  const { positions, alphas } = useMemo(() => {
    const pos = new Float32Array(totalPoints * 3);
    const alp = new Float32Array(totalPoints);

    for (let vi = 0; vi < VEHICLES.length; vi++) {
      const v = VEHICLES[vi];
      const vPos = getVehiclePos(v, 0);
      for (let t = 0; t < TRAIL_LENGTH; t++) {
        const idx = (vi * TRAIL_LENGTH + t) * 3;
        pos[idx] = vPos.x;
        pos[idx + 1] = 0.05;
        pos[idx + 2] = vPos.z;
        // Quadratic fade for more pronounced head/tail contrast
        alp[vi * TRAIL_LENGTH + t] = Math.pow(1 - t / TRAIL_LENGTH, 2);
      }
    }
    return { positions: pos, alphas: alp };
  }, [totalPoints]);

  const uniforms = useMemo(
    () => ({
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
    frameCount.current++;
    // Update every 3 frames for performance
    if (frameCount.current % 3 !== 0) return;
    if (!posRef.current) return;

    const arr = posRef.current.array as Float32Array;
    VEHICLES.forEach((v, vi) => {
      const base = vi * TRAIL_LENGTH * 3;
      const vPos = getVehiclePos(v, time);

      // Shift history back
      for (let t = TRAIL_LENGTH - 1; t >= 1; t--) {
        arr[base + t * 3] = arr[base + (t - 1) * 3];
        arr[base + t * 3 + 1] = arr[base + (t - 1) * 3 + 1];
        arr[base + t * 3 + 2] = arr[base + (t - 1) * 3 + 2];
      }
      arr[base] = vPos.x;
      arr[base + 1] = 0.05;
      arr[base + 2] = vPos.z;
    });
    posRef.current.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          ref={posRef}
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute attach="attributes-aAlpha" args={[alphas, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={trailVertexShader}
        fragmentShader={trailFragmentShader}
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
    const geo = new THREE.CircleGeometry(14, 64, 0, 0.45);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * SWEEP_SPEED;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.01, 0]}>
      {/* Sweep fan — wider, subtle gradient feel */}
      <mesh geometry={fanGeo}>
        <meshBasicMaterial
          color={0x06b6d4}
          transparent
          opacity={0.07}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Leading edge beam line */}
      <mesh position={[7, 0, 0]}>
        <boxGeometry args={[14, 0.01, 0.015]} />
        <meshBasicMaterial
          color={0x06b6d4}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Origin pulse */}
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial
          color={0x06b6d4}
          transparent
          opacity={1.0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Secondary glow ring at origin */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.25, 32]} />
        <meshBasicMaterial
          color={0x06b6d4}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ── Vehicle Detection Shapes ────────────────────────────────────────────────

function VehicleShapes() {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const bodyMatRefs = useRef<(THREE.LineBasicMaterial | null)[]>([]);
  const cabMatRefs = useRef<(THREE.LineBasicMaterial | null)[]>([]);
  const frontMatRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  const geos = useMemo(() => {
    return VEHICLES.map((v) => {
      const vt = VTYPES[v.vt];
      return {
        body: new THREE.EdgesGeometry(
          new THREE.BoxGeometry(vt.bW, vt.bH, vt.bD)
        ),
        cabin: new THREE.EdgesGeometry(
          new THREE.BoxGeometry(vt.cW, vt.cH, vt.cD)
        ),
        bodyW: vt.bW,
        bodyH: vt.bH,
        cabH: vt.cH,
        cabX: vt.cX,
      };
    });
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const sweep = time * SWEEP_SPEED;

    VEHICLES.forEach((v, i) => {
      const group = groupRefs.current[i];
      if (!group) return;

      const vPos = getVehiclePos(v, time);
      group.position.x = vPos.x;
      group.position.z = vPos.z;

      const glow = sweepProximity(sweep, vPos.x, vPos.z);
      const bodyOp = 0.3 + glow * 0.4;
      const cabOp = 0.25 + glow * 0.45;
      const frontOp = 0.4 + glow * 0.5;

      if (bodyMatRefs.current[i]) bodyMatRefs.current[i]!.opacity = bodyOp;
      if (cabMatRefs.current[i]) cabMatRefs.current[i]!.opacity = cabOp;
      if (frontMatRefs.current[i]) frontMatRefs.current[i]!.opacity = frontOp;
    });
  });

  return (
    <group>
      {VEHICLES.map((v, i) => {
        const yRot =
          v.axis === "x"
            ? v.dir === 1
              ? 0
              : Math.PI
            : v.dir === 1
              ? -Math.PI / 2
              : Math.PI / 2;

        const geo = geos[i];

        return (
          <group
            key={i}
            ref={(el) => {
              groupRefs.current[i] = el;
            }}
            rotation={[0, yRot, 0]}
          >
            <lineSegments
              geometry={geo.body}
              position={[0, geo.bodyH / 2, 0]}
            >
              <lineBasicMaterial
                ref={(el) => {
                  bodyMatRefs.current[i] = el;
                }}
                color={0x3b82f6}
                transparent
                opacity={0.3}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </lineSegments>
            <lineSegments
              geometry={geo.cabin}
              position={[geo.cabX, geo.bodyH + geo.cabH / 2, 0]}
            >
              <lineBasicMaterial
                ref={(el) => {
                  cabMatRefs.current[i] = el;
                }}
                color={0x06b6d4}
                transparent
                opacity={0.25}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </lineSegments>
            <mesh position={[geo.bodyW / 2 + 0.03, 0.02, 0]}>
              <boxGeometry args={[0.05, 0.05, 0.3]} />
              <meshBasicMaterial
                ref={(el) => {
                  frontMatRefs.current[i] = el;
                }}
                color={0x06b6d4}
                transparent
                opacity={0.4}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
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
      mat.opacity = 0.08;
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
      {/* Outer boundary — double ring */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[13.85, 14.0, 128]} />
        <meshBasicMaterial
          color={0x06b6d4}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[13.5, 13.55, 128]} />
        <meshBasicMaterial
          color={0x06b6d4}
          transparent
          opacity={0.12}
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
            opacity={0.12}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      {/* Cross-hair axis lines */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[28, 0.03]} />
        <meshBasicMaterial
          color={0x06b6d4}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh
        position={[0, -0.01, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      >
        <planeGeometry args={[28, 0.03]} />
        <meshBasicMaterial
          color={0x06b6d4}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Tick marks on axes every 3 units */}
      {[-12, -9, -6, -3, 3, 6, 9, 12].map((d) => (
        <group key={`tick-${d}`}>
          <mesh
            position={[d, -0.01, 0]}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          >
            <planeGeometry args={[0.4, 0.02]} />
            <meshBasicMaterial
              color={0x06b6d4}
              transparent
              opacity={0.2}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh position={[0, -0.01, d]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.4, 0.02]} />
            <meshBasicMaterial
              color={0x06b6d4}
              transparent
              opacity={0.2}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Camera Rig (removed — now using OrbitControls) ──────────────────────────

// ── Exported Scene ──────────────────────────────────────────────────────────

function Scene() {
  return (
    <>
      <ParticleField />
      <VehicleTrails />
      <VehicleShapes />
      <RadarBeam />
      <GroundElements />
      <OrbitControls
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.5}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.05}
        target={[-5, 0, 0]}
        autoRotate
        autoRotateSpeed={0.4}
      />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          intensity={0.6}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

function ReadySignal({ onReady }: { onReady?: () => void }) {
  const fired = useRef(false);
  useFrame(() => {
    if (!fired.current && onReady) {
      fired.current = true;
      onReady();
    }
  });
  return null;
}

export function HeroScene({ onReady }: { onReady?: () => void }) {
  return (
    <Canvas
      camera={{ position: [0, 20, 7], fov: 50, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      style={{ background: "#0A0F1A" }}
    >
      <Scene />
      <ReadySignal onReady={onReady} />
    </Canvas>
  );
}
