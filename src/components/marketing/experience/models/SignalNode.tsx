import * as THREE from "three";

import {
  signalGeometry,
  smallPlatformGeometry,
} from "../config/scene.constants";
import {
  customerNodeMaterial,
  platformMaterial,
} from "../config/scene.materials";

export function SignalNode({
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
      <mesh geometry={smallPlatformGeometry} position={[0, -0.12, 0]}>
        <primitive object={platformMaterial} attach="material" />
      </mesh>
      <mesh geometry={signalGeometry}>
        <primitive object={customerNodeMaterial} attach="material" />
      </mesh>
    </group>
  );
}
