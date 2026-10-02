"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

export type CoreMotionState = {
  progress: number;
  pointerX: number;
  pointerY: number;
  reduced: boolean;
};

export type CoreQuality = "full" | "lite" | "minimal";

type SignalCoreCanvasProps = {
  motion: React.MutableRefObject<CoreMotionState>;
  quality: CoreQuality;
  active: boolean;
  onReady: () => void;
  onFailure: () => void;
};

const colors = {
  brand: "#4fb7ac",
  brandDark: "#0f766e",
  healthy: "#77c99a",
  attention: "#d6a94a",
  risk: "#e08b8b",
  graphite: "#141816",
  graphiteRaised: "#252c29",
  line: "#59635f",
  text: "#dce5e2",
};

const customerPositions: Array<[number, number, number]> = [
  [-1.75, 0.3, 0.35],
  [-0.6, 1.55, -0.5],
  [1.05, 1.55, -0.72],
  [2.45, 0.5, -0.4],
  [1.65, -1.15, -0.15],
  [-0.25, -1.45, -0.4],
];

const signalPositions: Array<[number, number, number]> = [
  [-2.45, 1.2, -0.2],
  [-2.65, 0, 0.35],
  [-2.2, -1.25, -0.4],
  [2.25, 1.2, -0.45],
  [2.65, 0.05, 0.3],
  [2.15, -1.2, -0.25],
];

const workflowPositions: Array<[number, number, number]> = [
  [-2.8, 0.22, 0.48],
  [-1.45, 0.04, -0.22],
  [0, 0.2, 0.16],
  [1.45, -0.02, -0.3],
  [2.8, 0.18, 0.34],
];

const moduleGeometry = new THREE.BoxGeometry(0.42, 0.28, 0.42, 2, 1, 2);
const platformGeometry = new THREE.CylinderGeometry(0.46, 0.5, 0.08, 28);
const smallPlatformGeometry = new THREE.CylinderGeometry(0.24, 0.27, 0.055, 20);
const signalGeometry = new THREE.OctahedronGeometry(0.11, 0);
const particleGeometry = new THREE.SphereGeometry(0.035, 10, 8);
const customerVectors = customerPositions.map(
  (position) => new THREE.Vector3(...position),
);
const signalVectors = signalPositions.map(
  (position) => new THREE.Vector3(...position),
);
const workflowVectors = workflowPositions.map(
  (position) => new THREE.Vector3(...position),
);
const systemCenter = new THREE.Vector3();

function smooth(progress: number, from: number, to: number) {
  return THREE.MathUtils.smoothstep(progress, from, to);
}

function lineGeometry(
  start: [number, number, number],
  end: [number, number, number],
) {
  return new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ]);
}

function arcGeometry(radius: number, start: number, length: number) {
  const points: THREE.Vector3[] = [];
  for (let index = 0; index <= 48; index += 1) {
    const angle = start + length * (index / 48);
    points.push(
      new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius),
    );
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

const portfolioLines = customerPositions.map((position) =>
  lineGeometry(position, [0, 0, 0]),
);
const signalLines = signalPositions.map((position) =>
  lineGeometry(position, [0, 0, 0]),
);
const workflowLines = workflowPositions
  .slice(0, -1)
  .map((position, index) =>
    lineGeometry(position, workflowPositions[index + 1]),
  );
const orbitGeometries = [
  arcGeometry(0.88, 0.2, Math.PI * 1.45),
  arcGeometry(1.08, 2.2, Math.PI * 1.2),
  arcGeometry(1.26, 4.15, Math.PI * 0.86),
];

function WaslixCore({
  coreRef,
  ringRefs,
}: {
  coreRef: React.RefObject<THREE.Group | null>;
  ringRefs: React.MutableRefObject<Array<THREE.Group | null>>;
}) {
  return (
    <group ref={coreRef}>
      <mesh position={[0, -0.16, 0]}>
        <cylinderGeometry args={[0.72, 0.8, 0.12, 48]} />
        <meshStandardMaterial
          color={colors.graphite}
          metalness={0.84}
          roughness={0.42}
        />
      </mesh>
      <mesh position={[0, -0.09, 0]}>
        <cylinderGeometry args={[0.79, 0.81, 0.025, 48]} />
        <meshStandardMaterial
          color="#4a5450"
          metalness={0.82}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.58, 0.66, 0.12, 48]} />
        <meshStandardMaterial
          color={colors.graphiteRaised}
          metalness={0.9}
          roughness={0.34}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.43, 0.5, 0.13, 40]} />
        <meshStandardMaterial
          color="#090c0b"
          metalness={0.72}
          roughness={0.46}
        />
      </mesh>
      <mesh position={[0, 0.085, 0]}>
        <cylinderGeometry args={[0.43, 0.43, 0.018, 40]} />
        <meshStandardMaterial
          color="#313936"
          metalness={0.58}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 0.095, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.31, 0.345, 40]} />
        <meshStandardMaterial
          color={colors.brand}
          emissive={colors.brandDark}
          emissiveIntensity={0.24}
          metalness={0.7}
          roughness={0.32}
        />
      </mesh>
      <group position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {[-0.14, 0, 0.14].map((x, index) => (
          <mesh
            key={x}
            position={[x, 0, index === 1 ? 0 : 0.015]}
            rotation={[0, 0, index === 0 ? -0.38 : index === 2 ? 0.38 : 0]}
          >
            <boxGeometry args={[0.105, 0.34, 0.025]} />
            <meshStandardMaterial
              color={index === 1 ? colors.brand : "#347f77"}
              emissive={colors.brandDark}
              emissiveIntensity={0.18}
              roughness={0.35}
            />
          </mesh>
        ))}
      </group>
      {orbitGeometries.map((geometry, index) => (
        <group
          key={index}
          ref={(value) => {
            ringRefs.current[index] = value;
          }}
          rotation={[index === 1 ? 0.22 : -0.12, index * 0.8, 0]}
        >
          <lineSegments
            geometry={geometry}
            position={[0, 0.08 + index * 0.06, 0]}
          >
            <lineBasicMaterial
              color={index === 1 ? colors.brand : colors.line}
              transparent
              opacity={index === 1 ? 0.62 : 0.4}
            />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}

function CustomerModule({
  index,
  position,
  selected = false,
  hovered = false,
  onHover,
}: {
  index: number;
  position: [number, number, number];
  selected?: boolean;
  hovered?: boolean;
  onHover?: (index: number) => void;
}) {
  const node = useRef<THREE.Group>(null);
  const tone = [
    colors.attention,
    colors.healthy,
    colors.healthy,
    colors.risk,
    colors.attention,
    colors.healthy,
  ][index];

  useFrame((state, delta) => {
    if (!node.current) return;
    const scale = THREE.MathUtils.damp(
      node.current.scale.x,
      hovered ? 0.96 : 0.9,
      7,
      delta,
    );
    node.current.scale.setScalar(scale);
    node.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 0.28 + index) * 0.01;
  });

  return (
    <group
      ref={node}
      position={position}
      onPointerEnter={(event) => {
        event.stopPropagation();
        onHover?.(index);
        (event.nativeEvent.target as HTMLElement)
          .closest(".signal-core-canvas-shell")
          ?.setAttribute("data-hover", String(index));
        document.body.style.cursor = "pointer";
      }}
      onPointerLeave={(event) => {
        onHover?.(-1);
        (event.nativeEvent.target as HTMLElement)
          .closest(".signal-core-canvas-shell")
          ?.removeAttribute("data-hover");
        document.body.style.cursor = "";
      }}
    >
      <mesh geometry={platformGeometry} position={[0, -0.18, 0]}>
        <meshStandardMaterial
          color={selected ? "#202725" : colors.graphite}
          metalness={0.74}
          roughness={0.5}
        />
      </mesh>
      <mesh geometry={moduleGeometry}>
        <meshStandardMaterial
          color={selected ? "#26312e" : colors.graphiteRaised}
          metalness={0.68}
          roughness={0.46}
        />
      </mesh>
      <mesh position={[0, 0.148, 0]}>
        <boxGeometry args={[0.36, 0.018, 0.36]} />
        <meshStandardMaterial
          color="#46504c"
          metalness={0.54}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, -0.135, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.012, 8, 28]} />
        <meshStandardMaterial
          color="#4a5450"
          metalness={0.72}
          roughness={0.44}
        />
      </mesh>
      <mesh position={[0, 0.155, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.055, 18]} />
        <meshStandardMaterial
          color={tone}
          emissive={tone}
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

function PortfolioNetwork({
  groupRef,
  lineRefs,
  hoveredCustomer,
  onHover,
}: {
  groupRef: React.RefObject<THREE.Group | null>;
  lineRefs: React.MutableRefObject<Array<THREE.LineBasicMaterial | null>>;
  hoveredCustomer: number;
  onHover: (index: number) => void;
}) {
  return (
    <group ref={groupRef}>
      {portfolioLines.map((geometry, index) => (
        <lineSegments key={index} geometry={geometry}>
          <lineBasicMaterial
            ref={(value) => {
              lineRefs.current[index] = value;
            }}
            color={colors.brand}
            transparent
            opacity={0.24}
          />
        </lineSegments>
      ))}
      {customerPositions.map((position, index) => (
        <CustomerModule
          key={index}
          index={index}
          position={position}
          selected={index === 0}
          hovered={hoveredCustomer === index}
          onHover={onHover}
        />
      ))}
    </group>
  );
}

function SignalNetwork({
  groupRef,
  materialRefs,
  nodeRefs,
}: {
  groupRef: React.RefObject<THREE.Group | null>;
  materialRefs: React.MutableRefObject<Array<THREE.Material | null>>;
  nodeRefs: React.MutableRefObject<Array<THREE.Group | null>>;
}) {
  return (
    <group ref={groupRef} visible={false}>
      {signalLines.map((geometry, index) => (
        <lineSegments key={`line-${index}`} geometry={geometry}>
          <lineBasicMaterial
            ref={(value) => {
              materialRefs.current[index] = value;
            }}
            color={colors.brand}
            transparent
            opacity={0}
          />
        </lineSegments>
      ))}
      {signalPositions.map((position, index) => (
        <group
          key={index}
          ref={(value) => {
            nodeRefs.current[index] = value;
          }}
          position={position}
        >
          <mesh geometry={smallPlatformGeometry} position={[0, -0.12, 0]}>
            <meshStandardMaterial
              color={colors.graphite}
              metalness={0.66}
              roughness={0.5}
            />
          </mesh>
          <mesh geometry={signalGeometry}>
            <meshStandardMaterial
              color={index === 1 ? colors.risk : colors.graphiteRaised}
              emissive={index === 1 ? colors.risk : colors.brandDark}
              emissiveIntensity={0.12}
              metalness={0.55}
              roughness={0.42}
              transparent
            />
          </mesh>
        </group>
      ))}
      <CustomerModule index={0} position={[0, 0, 0]} selected />
    </group>
  );
}

function WorkflowNetwork({
  groupRef,
  nodeRefs,
  materialRefs,
}: {
  groupRef: React.RefObject<THREE.Group | null>;
  nodeRefs: React.MutableRefObject<Array<THREE.Group | null>>;
  materialRefs: React.MutableRefObject<Array<THREE.LineBasicMaterial | null>>;
}) {
  const tones = [
    colors.risk,
    colors.attention,
    colors.brand,
    colors.brand,
    colors.healthy,
  ];

  return (
    <group ref={groupRef} visible={false}>
      {workflowLines.map((geometry, index) => (
        <lineSegments key={`line-${index}`} geometry={geometry}>
          <lineBasicMaterial
            ref={(value) => {
              materialRefs.current[index] = value;
            }}
            color={colors.brand}
            transparent
            opacity={0}
          />
        </lineSegments>
      ))}
      {workflowPositions.map((position, index) => (
        <group
          key={index}
          ref={(value) => {
            nodeRefs.current[index] = value;
          }}
          position={position}
        >
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.38, 0.42, 0.08, 24]} />
            <meshStandardMaterial
              color={colors.graphite}
              metalness={0.74}
              roughness={0.48}
            />
          </mesh>
          <mesh>
            <boxGeometry args={[0.48, 0.22, 0.48]} />
            <meshStandardMaterial
              color={colors.graphiteRaised}
              emissive={tones[index]}
              emissiveIntensity={0}
              metalness={0.62}
              roughness={0.44}
              transparent
            />
          </mesh>
          <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.105, 20]} />
            <meshBasicMaterial color={tones[index]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SignalParticles({
  motion,
  particleRefs,
}: {
  motion: React.MutableRefObject<CoreMotionState>;
  particleRefs: React.MutableRefObject<Array<THREE.Mesh | null>>;
}) {
  return (
    <group>
      {[0, 1].map((index) => (
        <mesh
          key={index}
          ref={(value) => {
            particleRefs.current[index] = value;
          }}
          geometry={particleGeometry}
          visible={!motion.current.reduced}
        >
          <meshBasicMaterial
            color={index === 0 ? colors.attention : colors.brand}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

function TechnicalFloor({ quality }: { quality: CoreQuality }) {
  if (quality === "minimal") return null;
  return (
    <group position={[0, -0.38, 0]}>
      {[-3, -2, -1, 0, 1, 2, 3].map((value) => (
        <lineSegments
          key={`x-${value}`}
          geometry={lineGeometry([value, 0, -2.4], [value, 0, 2.4])}
        >
          <lineBasicMaterial
            color={colors.line}
            transparent
            opacity={0.032 * (1 - Math.abs(value) / 4)}
          />
        </lineSegments>
      ))}
      {[-2, -1, 0, 1, 2].map((value) => (
        <lineSegments
          key={`z-${value}`}
          geometry={lineGeometry([-3.6, 0, value], [3.6, 0, value])}
        >
          <lineBasicMaterial
            color={colors.line}
            transparent
            opacity={0.032 * (1 - Math.abs(value) / 3)}
          />
        </lineSegments>
      ))}
    </group>
  );
}

function WaslixSystem({
  motion,
  quality,
  onReady,
}: Omit<SignalCoreCanvasProps, "active" | "onFailure">) {
  const world = useRef<THREE.Group>(null);
  const core = useRef<THREE.Group>(null);
  const portfolio = useRef<THREE.Group>(null);
  const signals = useRef<THREE.Group>(null);
  const workflow = useRef<THREE.Group>(null);
  const rings = useRef<Array<THREE.Group | null>>([]);
  const portfolioMaterials = useRef<Array<THREE.LineBasicMaterial | null>>([]);
  const signalMaterials = useRef<Array<THREE.Material | null>>([]);
  const signalNodes = useRef<Array<THREE.Group | null>>([]);
  const workflowNodes = useRef<Array<THREE.Group | null>>([]);
  const workflowMaterials = useRef<Array<THREE.LineBasicMaterial | null>>([]);
  const particles = useRef<Array<THREE.Mesh | null>>([]);
  const ready = useRef(false);
  const [hoveredCustomer, setHoveredCustomer] = useState(-1);

  useFrame((state, delta) => {
    if (
      !world.current ||
      !core.current ||
      !portfolio.current ||
      !signals.current ||
      !workflow.current
    )
      return;

    const reduced = motion.current.reduced;
    const progress = reduced
      ? 0
      : THREE.MathUtils.clamp(motion.current.progress, 0, 1);
    const focus = smooth(progress, 0.25, 0.4);
    const health =
      smooth(progress, 0.36, 0.5) * (1 - smooth(progress, 0.64, 0.75));
    const action = smooth(progress, 0.66, 0.78);
    const time = reduced ? 0 : state.clock.elapsedTime;
    const damping = 1 - Math.exp(-delta * 4.2);
    const hover = hoveredCustomer;

    world.current.position.x +=
      (THREE.MathUtils.lerp(1.15, quality === "full" ? 0.72 : 1.05, focus) -
        world.current.position.x) *
      damping;
    world.current.rotation.y +=
      (THREE.MathUtils.lerp(-0.08, 0.08, action) - world.current.rotation.y) *
      damping;

    const portfolioOpacity = 1 - focus;
    portfolio.current.visible = portfolioOpacity > 0.01;
    portfolio.current.position.z = -focus * 1.6;
    portfolioMaterials.current.forEach((material, index) => {
      if (!material) return;
      const emphasis = hover < 0 ? 1 : hover === index ? 2.6 : 0.3;
      material.opacity = portfolioOpacity * 0.24 * emphasis;
    });

    core.current.position.x = THREE.MathUtils.lerp(0, 1.85, health);
    core.current.position.z = THREE.MathUtils.lerp(0, -1.15, health);
    core.current.scale.setScalar(THREE.MathUtils.lerp(1.16, 0.88, health));
    const signalPhase = health > 0.05 ? (time * 1.25) % 1 : (time * 0.32) % 1;
    const eventPulse =
      reduced || signalPhase < 0.84
        ? 0
        : Math.sin(((signalPhase - 0.84) / 0.16) * Math.PI) * 0.02;
    core.current.scale.multiplyScalar(1 + eventPulse);
    rings.current.forEach((ring, index) => {
      if (!ring || reduced) return;
      ring.rotation.y += delta * (0.018 + index * 0.007);
      ring.rotation.z = eventPulse * 12 * (index === 1 ? 1 : -0.5);
    });

    signals.current.visible = health > 0.01;
    signals.current.scale.setScalar(THREE.MathUtils.lerp(0.82, 1, health));
    const activeSignal = Math.floor(time * 1.25) % signalPositions.length;
    signalMaterials.current.forEach((material, index) => {
      if (!material) return;
      const arrival = smooth(health, index * 0.08, index * 0.08 + 0.34);
      material.opacity = arrival * (index === activeSignal ? 0.5 : 0.14);
    });
    signalNodes.current.forEach((node, index) => {
      if (!node) return;
      const isActive = index === activeSignal;
      node.scale.setScalar(isActive ? 1.08 : 1);
      const material = (node.children[1] as THREE.Mesh)
        .material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = isActive ? 0.24 : 0.035;
      material.opacity = isActive ? 1 : 0.66;
    });

    workflow.current.visible = action > 0.01;
    workflow.current.position.y = THREE.MathUtils.lerp(-0.35, 0, action);
    workflow.current.scale.setScalar(THREE.MathUtils.lerp(0.82, 1, action));
    const workflowProgress = smooth(progress, 0.74, 0.98) * 5;
    workflowNodes.current.forEach((node, index) => {
      if (!node) return;
      const activation = THREE.MathUtils.clamp(workflowProgress - index, 0, 1);
      const activeIndex = Math.min(4, Math.floor(workflowProgress));
      const isCurrent = index === activeIndex;
      const isPrevious = index === activeIndex - 1;
      node.position.y =
        workflowPositions[index][1] + Math.sin(activation * Math.PI) * 0.09;
      node.scale.setScalar(
        isCurrent ? 1.06 : isPrevious ? 1 : index > activeIndex ? 0.94 : 0.97,
      );
      const material = (node.children[1] as THREE.Mesh)
        .material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = isCurrent ? 0.22 : isPrevious ? 0.08 : 0.015;
      material.opacity = isCurrent
        ? 1
        : isPrevious
          ? 0.88
          : index > activeIndex
            ? 0.5
            : 0.68;
    });
    workflowMaterials.current.forEach((material, index) => {
      if (!material) return;
      material.opacity =
        action * THREE.MathUtils.clamp(workflowProgress - index, 0, 1) * 0.55;
    });

    particles.current.forEach((particle, index) => {
      if (!particle) return;
      if (reduced) {
        particle.visible = false;
        return;
      }
      particle.visible = true;
      if (action > 0.5) {
        if (index === 1) {
          particle.visible = false;
          return;
        }
        const segment = Math.min(
          3,
          Math.floor((time * 0.42 + index * 0.44) % 4),
        );
        const local = (time * 0.42 + index * 0.44) % 1;
        particle.position.lerpVectors(
          workflowVectors[segment],
          workflowVectors[segment + 1],
          local,
        );
      } else if (health > 0.05) {
        if (index === 1) {
          particle.visible = false;
          return;
        }
        const sourceIndex = Math.floor(time * 1.25) % signalPositions.length;
        const local = (time * 1.25) % 1;
        particle.position.lerpVectors(
          signalVectors[sourceIndex],
          systemCenter,
          local,
        );
      } else {
        const sourceIndex = index === 0 ? 0 : 3;
        const local = (time * 0.32 + index * 0.5) % 1;
        particle.position.lerpVectors(
          customerVectors[sourceIndex],
          systemCenter,
          local,
        );
      }
    });

    const cameraX =
      THREE.MathUtils.lerp(0.05, -0.12, focus) + motion.current.pointerX * 0.07;
    const cameraY =
      THREE.MathUtils.lerp(3.7, 2.75, focus) - motion.current.pointerY * 0.045;
    const cameraZ = THREE.MathUtils.lerp(7.3, 6.2, focus) + action * 0.7;
    state.camera.position.x += (cameraX - state.camera.position.x) * damping;
    state.camera.position.y += (cameraY - state.camera.position.y) * damping;
    state.camera.position.z += (cameraZ - state.camera.position.z) * damping;
    state.camera.lookAt(0.65, -0.05, 0);

    if (!ready.current) {
      ready.current = true;
      onReady();
    }
  });

  return (
    <group ref={world} position={[1.15, 0, 0]}>
      <TechnicalFloor quality={quality} />
      <PortfolioNetwork
        groupRef={portfolio}
        lineRefs={portfolioMaterials}
        hoveredCustomer={hoveredCustomer}
        onHover={setHoveredCustomer}
      />
      <SignalNetwork
        groupRef={signals}
        materialRefs={signalMaterials}
        nodeRefs={signalNodes}
      />
      <WorkflowNetwork
        groupRef={workflow}
        nodeRefs={workflowNodes}
        materialRefs={workflowMaterials}
      />
      <WaslixCore coreRef={core} ringRefs={rings} />
      <SignalParticles motion={motion} particleRefs={particles} />
    </group>
  );
}

function SceneLighting({
  motion,
}: {
  motion: React.MutableRefObject<CoreMotionState>;
}) {
  const rim = useRef<THREE.DirectionalLight>(null);

  useFrame((_, delta) => {
    if (!rim.current) return;
    rim.current.position.x = THREE.MathUtils.damp(
      rim.current.position.x,
      -4 + motion.current.pointerX * 0.35,
      3,
      delta,
    );
    rim.current.position.y = THREE.MathUtils.damp(
      rim.current.position.y,
      2.5 - motion.current.pointerY * 0.2,
      3,
      delta,
    );
  });

  return (
    <>
      <ambientLight intensity={0.14} />
      <directionalLight
        position={[3.5, 6.5, 4.5]}
        intensity={2.65}
        color="#e4ebe8"
      />
      <directionalLight
        ref={rim}
        position={[-4, 2.5, -4]}
        intensity={1.05}
        color="#9eb8b2"
      />
      <pointLight
        position={[1.5, 1, 2]}
        intensity={0.18}
        color={colors.brand}
        distance={8}
      />
    </>
  );
}

export function SignalCoreCanvas({
  motion,
  quality,
  active,
  onReady,
  onFailure,
}: SignalCoreCanvasProps) {
  const minimal = quality === "minimal";
  return (
    <Canvas
      className="signal-core-webgl"
      camera={{ position: [0.05, 3.7, 7.3], fov: 42, near: 0.1, far: 28 }}
      dpr={quality === "full" ? [1, 1.5] : 1}
      frameloop={
        motion.current.reduced ? "demand" : active ? "always" : "never"
      }
      gl={{
        alpha: true,
        antialias: !minimal,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.86;
        gl.domElement.addEventListener("webglcontextlost", onFailure, {
          once: true,
        });
      }}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 120 } }}
    >
      <SceneLighting motion={motion} />
      <WaslixSystem motion={motion} quality={quality} onReady={onReady} />
    </Canvas>
  );
}
