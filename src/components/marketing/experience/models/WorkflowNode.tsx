import * as THREE from "three";

import {
  accentMaterials,
  customerNodeMaterial,
  platformMaterial,
} from "../config/scene.materials";

const tones = [
  accentMaterials.risk,
  accentMaterials.warning,
  accentMaterials.active,
  accentMaterials.active,
  accentMaterials.healthy,
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
        <primitive object={platformMaterial} attach="material" />
      </mesh>
      <mesh>
        <boxGeometry args={[0.48, 0.22, 0.48]} />
        <primitive object={customerNodeMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 0.105, 20]} />
        <primitive object={tones[index]} attach="material" />
      </mesh>
    </group>
  );
}
