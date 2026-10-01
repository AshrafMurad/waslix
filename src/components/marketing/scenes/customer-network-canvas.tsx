"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export type SceneMotionState = {
  progress: number;
  pointerX: number;
  pointerY: number;
};

type CustomerNetworkCanvasProps = {
  motion: React.MutableRefObject<SceneMotionState>;
  lite: boolean;
};

type NodeLayout = {
  chaos: THREE.Vector3[];
  network: THREE.Vector3[];
  flat: THREE.Vector3[];
  links: Array<[number, number]>;
};

function createLayout(count: number): NodeLayout {
  const chaos: THREE.Vector3[] = [];
  const network: THREE.Vector3[] = [];
  const flat: THREE.Vector3[] = [];
  const links: Array<[number, number]> = [];

  for (let index = 0; index < count; index += 1) {
    const seed = index + 1;
    chaos.push(
      new THREE.Vector3(
        Math.sin(seed * 12.9898) * 5.2,
        Math.cos(seed * 7.233) * 3.8,
        Math.sin(seed * 3.117) * 3.2,
      ),
    );
    const ring = index === 0 ? 0 : 1 + (index % 3) * 0.72;
    const angle = index * 2.39996;
    network.push(
      new THREE.Vector3(
        Math.cos(angle) * ring,
        Math.sin(angle) * ring * 0.72,
        Math.sin(index * 1.7) * 0.7,
      ),
    );
    flat.push(
      new THREE.Vector3(
        ((index % 8) - 3.5) * 0.72,
        (2 - Math.floor(index / 8)) * 0.58,
        0,
      ),
    );
    if (index > 0) links.push([index, Math.floor((index - 1) / 2)]);
  }

  network[0].set(0, 0, 0.4);
  flat[0].set(0, 0.25, 0.2);
  return { chaos, network, flat, links };
}

const FULL_LAYOUT = createLayout(48);
const LITE_LAYOUT = createLayout(26);
const teal = new THREE.Color("#4fb7ac");
const white = new THREE.Color("#e8f0ee");
const amber = new THREE.Color("#d6a94a");

function NetworkScene({ motion, lite }: CustomerNetworkCanvasProps) {
  const nodes = useRef<THREE.InstancedMesh>(null);
  const pulses = useRef<THREE.InstancedMesh>(null);
  const lines = useRef<THREE.LineSegments>(null);
  const lineGeometry = useRef<THREE.BufferGeometry>(null);
  const group = useRef<THREE.Group>(null);
  const layout = lite ? LITE_LAYOUT : FULL_LAYOUT;
  const positions = useRef(layout.chaos.map((point) => point.clone()));
  const matrix = useRef(new THREE.Matrix4());
  const pulseMatrix = useRef(new THREE.Matrix4());
  const linePositions = useRef(new Float32Array(layout.links.length * 6));

  useEffect(() => {
    lineGeometry.current?.setAttribute(
      "position",
      new THREE.BufferAttribute(linePositions.current, 3),
    );
  }, []);

  useFrame((state, delta) => {
    if (!nodes.current || !pulses.current || !lines.current || !group.current)
      return;
    const progress = motion.current.progress;
    const convergence = THREE.MathUtils.smoothstep(progress, 0.08, 0.34);
    const flatten = THREE.MathUtils.smoothstep(progress, 0.5, 0.7);
    const healthFocus = 1 - Math.min(1, Math.abs(progress - 0.42) * 8);
    const time = state.clock.elapsedTime;
    const damping = 1 - Math.exp(-delta * 4.2);

    for (let index = 0; index < layout.chaos.length; index += 1) {
      const target = layout.chaos[index]
        .clone()
        .lerp(layout.network[index], convergence)
        .lerp(layout.flat[index], flatten);
      if (index === 0) {
        target.z += healthFocus * 1.35;
        target.x -= healthFocus * 0.8;
      }
      positions.current[index].lerp(target, damping);
      const scale =
        index === 0
          ? 0.16 + healthFocus * 0.16
          : 0.045 + (index % 7 === 0 ? 0.025 : 0);
      matrix.current.makeScale(scale, scale, scale);
      matrix.current.setPosition(positions.current[index]);
      nodes.current.setMatrixAt(index, matrix.current);

      if (index < pulses.current.count) {
        const source = layout.links[index % layout.links.length];
        const from = positions.current[source[0]];
        const to = positions.current[source[1]];
        const travel = (time * 0.22 + index / pulses.current.count) % 1;
        const point = from.clone().lerp(to, travel);
        pulseMatrix.current.makeScale(0.035, 0.035, 0.035);
        pulseMatrix.current.setPosition(point);
        pulses.current.setMatrixAt(index, pulseMatrix.current);
      }
    }

    layout.links.forEach(([fromIndex, toIndex], index) => {
      const from = positions.current[fromIndex];
      const to = positions.current[toIndex];
      const offset = index * 6;
      linePositions.current.set(
        [from.x, from.y, from.z, to.x, to.y, to.z],
        offset,
      );
    });

    const lineAttribute = lines.current.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    lineAttribute.needsUpdate = true;
    nodes.current.instanceMatrix.needsUpdate = true;
    pulses.current.instanceMatrix.needsUpdate = true;

    const pointerStrength = lite ? 0.08 : 0.2;
    group.current.rotation.y +=
      (motion.current.pointerX * pointerStrength - group.current.rotation.y) *
      damping;
    group.current.rotation.x +=
      (-motion.current.pointerY * pointerStrength - group.current.rotation.x) *
      damping;
    group.current.rotation.z = Math.sin(time * 0.12) * 0.025 * (1 - flatten);

    const targetX = progress < 0.17 ? 1.15 : progress < 0.48 ? -0.65 : 0;
    const targetZ =
      progress < 0.48 ? 7.2 - convergence * 0.7 : 7.1 + flatten * 1.4;
    state.camera.position.x +=
      (targetX + motion.current.pointerX * 0.12 - state.camera.position.x) *
      damping;
    state.camera.position.y +=
      (motion.current.pointerY * -0.08 - state.camera.position.y) * damping;
    state.camera.position.z += (targetZ - state.camera.position.z) * damping;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group} position={[1.2, 0, 0]}>
      <instancedMesh
        ref={nodes}
        args={[undefined, undefined, layout.chaos.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, lite ? 8 : 12, lite ? 8 : 12]} />
        <meshBasicMaterial color={white} transparent opacity={0.88} />
      </instancedMesh>
      <lineSegments ref={lines} frustumCulled={false}>
        <bufferGeometry ref={lineGeometry} />
        <lineBasicMaterial color={teal} transparent opacity={0.26} />
      </lineSegments>
      <instancedMesh
        ref={pulses}
        args={[undefined, undefined, lite ? 6 : 12]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={amber} />
      </instancedMesh>
      <mesh position={[0, 0, 0.4]}>
        <ringGeometry args={[0.34, 0.35, 64]} />
        <meshBasicMaterial
          color={teal}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export function CustomerNetworkCanvas({
  motion,
  lite,
}: CustomerNetworkCanvasProps) {
  return (
    <Canvas
      className="network-webgl"
      camera={{ position: [1.15, 0, 7.2], fov: 42, near: 0.1, far: 40 }}
      dpr={lite ? 1 : [1, 1.5]}
      gl={{
        alpha: true,
        antialias: !lite,
        powerPreference: "high-performance",
      }}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 120 } }}
    >
      <NetworkScene motion={motion} lite={lite} />
    </Canvas>
  );
}
