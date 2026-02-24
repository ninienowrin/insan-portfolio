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

    // Road geometry: 4-lane intersection (two roads crossing)
    // Lanes at z = -1.5, -0.5, 0.5, 1.5 for east-west road
    // Lanes at x = -1.5, -0.5, 0.5, 1.5 for north-south road
    const roadWidth = 3.5; // half-width of road
    const laneOffsets = [-1.2, -0.4, 0.4, 1.2]; // 4 lane centers

    // Vehicle positions: on lanes, at realistic spacing
    // Format: [laneX, laneZ, heading] — heading 0=east, 1=north
    const vehicles = [
      // East-west road vehicles
      { x: -8, z: -1.2, heading: 0 },
      { x: -4.5, z: -0.4, heading: 0 },
      { x: 3, z: 0.4, heading: 0 },
      { x: 7, z: 1.2, heading: 0 },
      { x: 10, z: -1.2, heading: 0 },
      // North-south road vehicles
      { x: -1.2, z: -7, heading: 1 },
      { x: -0.4, z: -3.5, heading: 1 },
      { x: 0.4, z: 4, heading: 1 },
      { x: 1.2, z: 8, heading: 1 },
      { x: -0.4, z: 11, heading: 1 },
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const type = rand();

      if (type < 0.35) {
        // Road surface particles — clear lane structure
        if (rand() < 0.5) {
          // East-west road
          pos[i3] = (rand() - 0.5) * 28;
          pos[i3 + 1] = rand() * 0.04;
          pos[i3 + 2] = (rand() - 0.5) * roadWidth * 2;
        } else {
          // North-south road
          pos[i3] = (rand() - 0.5) * roadWidth * 2;
          pos[i3 + 1] = rand() * 0.04;
          pos[i3 + 2] = (rand() - 0.5) * 28;
        }
        sz[i] = 1.0 + rand() * 1.2;
        tp[i] = 0;
      } else if (type < 0.45) {
        // Lane markings — dashed center lines and edge lines
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
        // Vehicle detection point clouds — clustered on vehicles
        const v = vehicles[Math.floor(rand() * vehicles.length)];
        const vw = v.heading === 0 ? 1.0 : 0.5; // width along heading
        const vh = v.heading === 0 ? 0.5 : 1.0;
        pos[i3] = v.x + (rand() - 0.5) * vw;
        pos[i3 + 1] = rand() * 0.4 + 0.02;
        pos[i3 + 2] = v.z + (rand() - 0.5) * vh;
        sz[i] = 1.8 + rand() * 2.2;
        tp[i] = 1;
      } else {
        // Sparse ground scatter within road area
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

// ── Detection Bounding Boxes ────────────────────────────────────────────────

function BoundingBoxes() {
  const groupRef = useRef<THREE.Group>(null);

  // Same vehicles as in particle generation — 3D bounding box wireframes
  const boxes = useMemo(
    () => [
      { x: -8, z: -1.2, w: 1.0, d: 0.5, heading: 0 },
      { x: -4.5, z: -0.4, w: 1.0, d: 0.5, heading: 0 },
      { x: 3, z: 0.4, w: 1.0, d: 0.5, heading: 0 },
      { x: 7, z: 1.2, w: 1.0, d: 0.5, heading: 0 },
      { x: 10, z: -1.2, w: 1.0, d: 0.5, heading: 0 },
      { x: -1.2, z: -7, w: 0.5, d: 1.0, heading: 1 },
      { x: -0.4, z: -3.5, w: 0.5, d: 1.0, heading: 1 },
      { x: 0.4, z: 4, w: 0.5, d: 1.0, heading: 1 },
      { x: 1.2, z: 8, w: 0.5, d: 1.0, heading: 1 },
      { x: -0.4, z: 11, w: 0.5, d: 1.0, heading: 1 },
    ],
    []
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      // Subtle pulse
      mat.opacity = 0.15 + Math.sin(t * 2 + i * 0.7) * 0.08;
    });
  });

  return (
    <group ref={groupRef}>
      {boxes.map((b, i) => (
        <mesh key={i} position={[b.x, 0.2, b.z]}>
          <boxGeometry args={[b.w, 0.4, b.d]} />
          <meshBasicMaterial
            color={0x3b82f6}
            transparent
            opacity={0.18}
            wireframe
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
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
      camera={{ position: [2, 18, 3], fov: 50, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Scene />
    </Canvas>
  );
}
