import * as THREE from "three";

import { colors } from "../config/scene.materials";

const tones = [
  colors.risk,
  colors.attention,
  colors.brand,
  colors.brand,
  colors.healthy,
];

export function WorkflowNode({
  index,
  position,
  onNodeRef,
}: {
  index: number;
  position: [number, number, number];
  onNodeRef: (index: number, value: THREE.Group | null) => void;
}) {
  return (
    <group
      ref={(value) => {
        onNodeRef(index, value);
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
  );
}
